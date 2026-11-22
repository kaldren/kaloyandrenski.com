---
title: What It Builds on Azure
aliases: Generic Pattern on Azure
category: AI Agents
order: 99
summary: One sentence naming the key services and what they do together.
figure: One or two sentences describing the diagram's flow, using the same service names as the diagram.
caution: The failure mode specific to this cloud design, then what to do about it.
services:
  - name: Azure Service One
    role: What it does in this architecture.
  - name: Azure Service Two
    role: What it does in this architecture.
implements: [orchestrator-workers]
related: []
---

## Scenario

The business problem, why the generic pattern fits it, and which reference architecture this follows. What you add on top of it.

## How it works

1. The request enters through the first service.
2. The next service does its part.
3. And so on, left to right through the diagram.
4. The result goes back to the user.

## Security and identity

- Identity: managed identities, no keys.
- Least privilege per service or agent.
- Network isolation.

## Reliability and operations

- How it survives failure.
- How you see what it is doing.

## Cost

- What drives the bill.
- How to cap it and measure it.

## Deploy it

A sketch of the piece people most often get wrong. It is not a full deployment.

```bicep
param exampleName string

resource example 'Microsoft.Example/resources@2024-01-01' existing = {
  name: exampleName
}
```

## Learn more

- [Official doc title](https://learn.microsoft.com/), on what it covers.
