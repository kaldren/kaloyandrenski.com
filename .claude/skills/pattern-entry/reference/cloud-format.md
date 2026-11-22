# Cloud architecture entry format

Use this format for entries in a cloud track (`"format": "cloud"` in `src/patterns/catalog.json`, e.g. Microsoft Azure). A cloud entry shows how to build one or more generic patterns from a provider's real services. The build (`scripts/build-blog.mjs`) enforces the parts marked **(build)**. The canonical example is `src/patterns/entries/azure/multi-agent-orchestration-azure.md`.

## Front matter

The fields always appear in this order:

| Field | Rule |
|---|---|
| `title` | **(build)** What it builds, plus "on <Provider>", in Title Case: "Multi-Agent Orchestration on Azure", "RAG with AI Search on Azure". |
| `aliases` | Optional. 1–3 other names, comma-separated. A good alias is "<Generic pattern> on <Provider>". |
| `category` | **(build)** Exactly one `name` from this track's `categories` in `catalog.json`. |
| `order` | **(build)** Unique within the track: one more than the track's current highest. |
| `summary` | **(build)** One sentence naming the key services and what they do together. |
| `figure` | **(build)** 1–2 sentences describing the diagram's flow, using the same service names as the diagram. |
| `caution` | **(build)** One paragraph, 2–3 sentences, in plain text. Give the failure mode that is specific to this cloud design, such as quota, identity, networking or cost, and what to do about it. |
| `services` | **(build)** At least two entries, each with a `name` (the current official product name, e.g. "Azure Cosmos DB", "Microsoft Foundry") and a `role` (one sentence on what it does *in this architecture*). List them in request-flow order, then supporting services such as identity and monitoring. The build renders them as the "<Provider> services" table. |
| `implements` | **(build)** 1 or more slugs of generic patterns, as a YAML list. Each must be in the generic track. The build adds the link back on the generic pattern. |
| `related` | **(build)** 0–3 slugs of other entries in any track, as a YAML list. Use `[]` for none. Links go both ways. |

## Body: seven sections, in this order **(build)**

```markdown
## Scenario

## How it works

## Security and identity

## Reliability and operations

## Cost

## Deploy it

## Learn more
```

Use no other `##` headings. There's no scene title.

### Scenario
- 1–2 short paragraphs: the business problem, why the generic pattern fits it, and which reference architecture the design follows, if any.
- Say plainly which parts are the provider's reference and which are your own additions ("On top of it, I add…").

### How it works
- A numbered list of 4–7 steps that follows the request through the diagram, left to right. Name each service exactly as it appears in the diagram and the services table.

### Security and identity
- 2–4 bullets: identity (managed or workload identities, no keys), least-privilege access per agent or service, and network isolation (private endpoints, VNet integration). Only include what applies.

### Reliability and operations
- 2–4 bullets: how the design survives failure (state, retries, failover across regions or deployments) and how you see what it is doing (tracing, logs, alerts).

### Cost
- 2–4 bullets: what drives the bill (usually model tokens), how to cap it, and how to measure it per unit of work.

### Deploy it
- One sentence saying what the sketch shows, then one fenced block in the provider's usual IaC. Use `bicep` for Azure; Terraform (`hcl`) for Google Cloud or AWS unless told otherwise.
- Show the single piece people most often get wrong, such as an identity, a role assignment or a policy, not a full deployment. Say it's a sketch.
- Use real resource types and an API version you have seen in the provider's docs. Pass anything you can't verify, such as a role ID, as a parameter with a `@description`.

### Learn more
- 2–5 bullets, each a markdown link to official provider documentation or a reference architecture, followed by a few words on what it covers. Verify every link.

## Voice

The voice is the same as the generic entries (see `entry-format.md`): direct, practical, short sentences, no hype, no invented experiences or numbers. Use the provider's current product names consistently, including in the diagram.
