---
title: Multi-Agent Orchestration on Azure
aliases: Orchestrator–Workers on Azure, Agent Framework on Container Apps
category: AI Agents
order: 1
summary: An orchestrator and its worker agents run as your own code on Azure Container Apps, reach Foundry models through an API Management AI gateway, and keep plans and results in Cosmos DB.
figure: A user submits a task through App Service. The orchestrator on Container Apps fans it out to three workers, every model call goes through API Management to Foundry, and the orchestrator saves plans and state in Cosmos DB.
caution: Fan-out multiplies model calls, and they all draw on the same Foundry quota. Without per-agent token limits at the gateway, one runaway worker can starve every other agent and app on that deployment, so set limits per agent identity from day one and alert on them.
services:
  - name: Azure App Service
    role: Hosts the front end where users submit tasks and follow their progress.
  - name: Azure Container Apps
    role: Runs the orchestrator and worker agents, written with Microsoft Agent Framework.
  - name: Microsoft Foundry
    role: Hosts the model deployments that every agent calls.
  - name: Azure API Management
    role: AI gateway between the agents and Foundry, with token limits, load balancing and usage logs per agent.
  - name: Azure Cosmos DB
    role: Stores plans, task state and agent outcomes, so runs can resume and be audited.
  - name: Microsoft Entra ID
    role: Managed identities, so no service holds a key for another.
  - name: Application Insights
    role: Traces each run across the orchestrator and its workers.
implements: [orchestrator-workers]
related: []
---

## Scenario

A team wants agents to handle multi-step requests: research a supplier, draft a contract change, check it against policy. One agent with every tool gets confused and expensive, so the work is split between an orchestrator and specialist workers, as in the generic Orchestrator–Workers pattern.

This design follows Microsoft's multi-agent reference architecture, where the agents are your own code rather than managed agents. On top of it, I add an AI gateway, managed identities and tracing, which a large company will ask for before go-live.

## How it works

1. The user submits a task in the web front end on App Service.
2. The orchestrator, a Microsoft Agent Framework app on Container Apps, asks a model to break the task into sub-tasks and saves the plan in Cosmos DB.
3. It hands each sub-task to a worker agent in the same Container Apps environment. Independent workers run in parallel.
4. Every model call, from the orchestrator or a worker, goes to API Management, which applies the agent's token limit and forwards the call to a Foundry model deployment.
5. Workers return short results. The orchestrator stores them, checks for gaps, and either plans another round or writes the final answer.
6. The front end reads the run's status and result from Cosmos DB.

## Security and identity

- Each Container App runs as its own managed identity. API Management authenticates to Foundry with its own managed identity, so no agent holds a model key.
- Give each worker identity access only to the tools and data its job needs, and keep that list in code review, not in a prompt.
- Run the Container Apps environment in a virtual network, reach Foundry and Cosmos DB through private endpoints with public access turned off, and let traffic in only through the front end and the gateway.

## Reliability and operations

- Because the plan and every result are in Cosmos DB, a crashed orchestrator can resume a run instead of starting over.
- API Management can spread calls across several Foundry deployments and fail over when one is throttled.
- Trace every run with OpenTelemetry into Application Insights, with one trace spanning the orchestrator and its workers, so a slow or failing worker is easy to find.

## Cost

- Model tokens are almost always the biggest cost, and fan-out multiplies them. Measure tokens per completed task, not per call.
- The gateway's token limits per agent cap the worst case. Its usage logs show which agent spends what.
- Container Apps can scale idle workers to zero, so the compute cost follows real usage.

## Deploy it

A Bicep sketch of the one piece people most often get wrong: letting the gateway call Foundry with its managed identity instead of a key. It is a sketch, not a full deployment.

```bicep
param foundryName string
param apimName string
@description('Role that allows calling Foundry models, as listed in the Foundry docs')
param modelUserRoleId string

resource foundry 'Microsoft.CognitiveServices/accounts@2024-10-01' existing = {
  name: foundryName
}

resource apim 'Microsoft.ApiManagement/service@2023-05-01-preview' existing = {
  name: apimName
}

// Keyless: only the gateway's identity may call the models.
resource gatewayModelAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: foundry
  name: guid(foundry.id, apim.id, modelUserRoleId)
  properties: {
    principalId: apim.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', modelUserRoleId)
  }
}
```

## Learn more

- [Build a multiple-agent workflow automation solution by using Microsoft Agent Framework](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/idea/multiple-agent-workflow-automation), the Azure Architecture Center reference this design builds on.
- [AI gateway capabilities in Azure API Management](https://learn.microsoft.com/en-us/azure/api-management/genai-gateway-capabilities), covering token limits, load balancing and logging for model APIs.
- [Managed identities for Azure resources](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview).
- [Enable OpenTelemetry in Application Insights](https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-enable).
