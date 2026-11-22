---
title: Enterprise Chatbot on Azure
aliases: Baseline Foundry Chat on Azure, Retrieval-Augmented Generation on Azure
category: AI Agents
order: 2
summary: A chat front end on App Service, behind Application Gateway and its WAF, talks to a Foundry Agent Service agent that grounds answers in AI Search and keeps conversations in Cosmos DB, all on private networking.
figure: A user reaches the chat UI on App Service through Application Gateway. The Foundry agent grounds its answer in AI Search, calls a Foundry model and saves the conversation in Cosmos DB over private endpoints, and any call to a public tool leaves through Azure Firewall.
caution: Foundry Agent Service doesn't check which user owns a conversation, so any caller with access to the project can read any thread it can name. Store the conversation IDs each signed-in user owns in your own app, check them on every request before calling the agent, and never pass a conversation ID from the browser straight through.
services:
  - name: Azure Application Gateway
    role: The only public entry point, terminating TLS and inspecting every request with Azure Web Application Firewall.
  - name: Azure App Service
    role: Hosts the chat UI and the server code that signs users in, checks conversation ownership and calls the agent.
  - name: Foundry Agent Service
    role: Runs the chat agent in the standard setup, injected into your virtual network, with its instructions, model and tools.
  - name: Microsoft Foundry
    role: Hosts the model deployment the agent calls, with a content filter bound to it.
  - name: Azure AI Search
    role: Holds the grounding index the agent searches before it answers.
  - name: Azure Cosmos DB for NoSQL
    role: Stores conversations and agent definitions in your subscription, so chats can resume.
  - name: Azure Storage
    role: Holds files users upload in chat.
  - name: Azure Firewall
    role: Controls all outbound traffic from the agent with FQDN rules, so it can reach only the public tools you allow.
  - name: Azure Private Link
    role: Private endpoints for Foundry, AI Search, Cosmos DB and Storage, with public access turned off.
  - name: Azure Key Vault
    role: Stores the TLS certificate for Application Gateway, the only secret in the design.
  - name: Microsoft Entra ID
    role: Signs users in and gives every service a managed identity, so nothing holds a key.
  - name: Application Insights
    role: Traces each chat turn from the web app through the agent and its tool calls.
implements: [retrieval-augmented-generation]
related: [multi-agent-orchestration-azure]
---

## Scenario

A company wants an internal assistant that answers questions from its own policies, manuals and knowledge base, and it has to pass a security review before anyone outside the pilot team sees it. That is Retrieval-Augmented Generation with one agent, wrapped in the network controls, identities and monitoring a production workload needs.

This design follows Microsoft's Baseline Microsoft Foundry Chat reference architecture: Application Gateway in front, App Service for the UI, Foundry Agent Service in the standard setup with your own Cosmos DB, Storage and AI Search, and egress through Azure Firewall. On top of it, I add two things: a retrieval test set that runs before every agent or index change ships, and a token budget per user with an alert, so a pilot can't quietly become the biggest line on the bill.

## How it works

1. The user opens the chat UI. The request reaches Application Gateway, where the WAF inspects it before it reaches App Service.
2. The App Service app signs the user in, checks that they own the conversation, and calls the Foundry agent over a private endpoint with its managed identity.
3. The Foundry agent applies its instructions and searches AI Search over a private endpoint for the passages that ground its answer.
4. It calls its Foundry model with the question and those passages. The content filter on the deployment screens both.
5. Calls to public tools, such as web search or a public API, leave only through Azure Firewall. Calls to private tools stay in the virtual network.
6. Before replying, the agent saves the turn in Cosmos DB, and the answer goes back to the user through App Service.

## Security and identity

- Every component has its own managed identity, and connections use Microsoft Entra ID. The web app needs the Foundry User role to call the agent, and no service holds a key.
- Foundry Agent Service doesn't enforce per-user access to conversations, so the web app must check ownership on every request. Without it, one user can read another's chat.
- Only Application Gateway has a public IP. Foundry, AI Search, Cosmos DB and Storage are reached through private endpoints with public access off, and the agent's outbound traffic is forced through Azure Firewall.
- Filter AI Search results by the signed-in user's permissions when documents aren't open to everyone in the company.

## Reliability and operations

- Deploy App Service, Application Gateway, Cosmos DB, Storage, AI Search and Azure Firewall across availability zones. AI Search needs at least three replicas for zone redundancy.
- Foundry Agent Service has no built-in disaster recovery: it can't replicate, back up or restore its state. If you need another region, plan the failover yourself, including the Cosmos DB, Storage and AI Search behind it.
- Define the agent as code, pin the agent and model versions, and run the retrieval test set and a regression set of conversations in your pipeline before each release.
- Send traces from the web app and the agent to Application Insights, so a slow answer can be traced to search, the model or a tool.

## Cost

- Model tokens drive the bill, and retrieved passages are input tokens on every turn. Keep the number and size of passages small, and measure tokens per answered question.
- The fixed cost is the platform: Application Gateway with WAF, Azure Firewall, zone-redundant AI Search and Cosmos DB run all month, even when nobody chats. Size them to the real load and use reserved capacity once usage is stable.
- Connect only the tools most conversations need, and delete old agents and conversations you no longer have to keep.

## Deploy it

A Bicep sketch of the piece people most often get wrong: letting the web app call the agent with its managed identity instead of a key. It is a sketch, not a full deployment.

```bicep
param foundryName string
param webAppName string
@description('ID of the Foundry User role, as listed in the Foundry RBAC docs')
param foundryUserRoleId string

resource foundry 'Microsoft.CognitiveServices/accounts@2024-10-01' existing = {
  name: foundryName
}

resource webApp 'Microsoft.Web/sites@2023-12-01' existing = {
  name: webAppName
}

// Keyless: the chat web app calls the agent as itself.
resource webAppAgentAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: foundry
  name: guid(foundry.id, webApp.id, foundryUserRoleId)
  properties: {
    principalId: webApp.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', foundryUserRoleId)
  }
}
```

## Learn more

- [Baseline Microsoft Foundry Chat reference architecture](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/architecture/baseline-microsoft-foundry-chat), the Azure Architecture Center reference this design follows.
- [Basic Microsoft Foundry Chat reference architecture](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/architecture/basic-microsoft-foundry-chat), the smaller version for learning and proofs of concept.
- [Set up standard agent resources for Foundry Agent Service](https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/standard-agent-setup), on bringing your own Cosmos DB, Storage and AI Search.
- [Retrieval-augmented generation in Azure AI Search](https://learn.microsoft.com/en-us/azure/search/retrieval-augmented-generation-overview), on building the grounding index.
- [Azure Web Application Firewall on Application Gateway](https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/ag-overview).
