# Pattern diagram spec

One diagram is one SVG file, `src/patterns/diagrams/<track>/<slug>.svg`. Every track uses this same language. The build inlines it into the page. Colors come only from `src/public/patterns.css` (see "Pattern diagrams" in `DESIGN_SYSTEM.md`), so the SVG describes **structure only**. The build enforces the rules marked **(build)**.

## Root element

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 W H" role="img" aria-labelledby="<slug>-title">
  <title id="<slug>-title"><Pattern name>: one sentence describing the flow.</title>
```

- **(build)** The file starts with `<svg` (no XML prolog or comment before it), has `role="img"`, a `viewBox="0 0 W H"` and a non-empty `<title>`.
- **(build)** No `width` or `height` on the root. The build sets them from `viewBox`.
- **(build)** No `style` attributes or `<style>` elements, no color values (`fill`, `stroke` or `color` set to `#…`, `rgb()` or `hsl()`), no scripts or event handlers, and no `<image>` or `<foreignObject>`. That rules out provider icon files too: services are drawn as nodes with their name as the label.
- **(build)** Every `id` starts with `<slug>-`, because all the diagrams share one page.
- `W` is 680–720 and `H` is whatever the layout needs. Use round numbers.
- The title starts with the pattern name and describes the flow for screen-reader users.

## Arrowhead markers

Copy these into `<defs>` unchanged, with the slug filled in:

```svg
<defs>
  <marker id="<slug>-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path class="arrowhead" d="M0 0 L10 5 L0 10 Z"/></marker>
  <marker id="<slug>-arrow-main" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path class="arrowhead arrowhead--main" d="M0 0 L10 5 L0 10 Z"/></marker>
</defs>
```

`edge--main` paths use `<slug>-arrow-main`. Every other path uses `<slug>-arrow`.

## Node kinds

There are exactly seven, in every track. Never add a kind or style a node any other way.

| Class | Use it for | Example labels |
|---|---|---|
| `node--agent` | An LLM-driven agent that decides its own next steps | Orchestrator, Worker A, Router agent |
| `node--model` | A single model call inside a workflow, where code decides what comes next | Step 1, Generator, Classifier |
| `node--tool` | A tool, API or MCP server an agent calls | Search, Code runner, CRM API |
| `node--store` | Memory, a vector store, a database, a rubric or other reference data | Rubric, Memory, Vector store |
| `node--check` | A gate, a verdict or a policy check that can pass or fail | Gate, Evaluator, Guardrail |
| `node--human` | A person in the loop | Reviewer, Approver, User |
| `node--io` | The input entering or the output leaving the pattern, including terminal states | Task, Input, Answer, Stop early |

Markup, with a two-line node centred on `(cx, cy)`:

```svg
<g class="node node--model"><rect x="…" y="…" width="92" height="60" rx="8"/><text class="node-label" x="cx" y="cy-9">Step 1</text><text class="node-sub" x="cx" y="cy+11">outline</text></g>
```

- **Sizes:**
  - A standard two-line node is 92–140 wide and 60 high, with the label at `cy-9` and the subtitle at `cy+11`.
  - The pattern's central node can be 80 high, with the label at `cy-10` and the subtitle at `cy+12`.
  - A one-line node is 36–44 high, with the label at `cy`.
- **Corners:** `rx="8"` on every node except `node--store`, which uses `rx="2"`.
- **Labels:** `node-label` is short Title Case, at most about 14 characters. `node-sub` is lowercase, at most about 18 characters; separate two verbs with ` · ` ("plan · delegate"). The text is centred by CSS, so don't add `text-anchor` or font attributes.
- **Size limit:** 3–9 nodes. If you need more, the diagram is doing too much.

## Boundaries (cloud diagrams)

A boundary groups nodes that live together: a subscription, project or account, a virtual network, or a hosting environment like Container Apps or Kubernetes.

```svg
<g class="zone"><rect x="120" y="10" width="560" height="410" rx="8"/><text class="zone-label" x="130" y="20">Azure subscription</text></g>
<g class="zone zone--inner"><rect x="262" y="40" width="242" height="290" rx="8"/><text class="zone-label" x="272" y="50">Container Apps</text></g>
```

- Draw boundaries first, so they sit behind nodes and edges.
- Use at most two levels. The outer level is plain `zone`; a boundary inside another adds `zone--inner`, which gives it a white fill.
- The `zone-label` sits 10 units right of and 10 units below the boundary's top-left corner. The CSS anchors it top-left in mono. Keep it to 2–3 words, and keep nodes at least 20 units below the label line and clear of its width.
- Leave people, external users and other clouds outside the outer boundary.

## Cloud node labels

- The `node-label` is the service's short name ("App Service", "API Management", "Cosmos DB", "Foundry", "AI Search"). The full official name goes in the entry's `services` table.
- The `node-sub` is the service's role here ("front end", "AI gateway", "plans · state").
- Choose the kind by what the service does in this design, not by its product family:
  - agents you host are `node--agent`
  - model deployments are `node--model`
  - functions and APIs the agents call are `node--tool`
  - databases, search indexes and storage are `node--store`
  - gateways, policy engines and content filters are `node--check`
  - the front end the user talks to is `node--io`
- Supporting services that touch everything, such as identity and monitoring, usually stay out of the diagram. They belong in the services table, and the caption can say so.

## Edges

| Class | Meaning |
|---|---|
| `edge edge--main` | The pattern's main path, from input to output |
| `edge` | A supporting flow, such as results coming back or a rubric feeding a check |
| `edge edge--optional` | Optional, delayed, failure, retry or re-plan flow (drawn dashed) |

```svg
<path class="edge edge--main" d="M106 80 H132" marker-end="url(#<slug>-arrow-main)"/>
```

- Draw edges after the nodes, so they render on top.
- Use straight `H`/`V` segments. Use cubic `C` curves only for fan-out and fan-in.
- Start an edge at the source's edge and end it 2 units before the target's edge, so the arrowhead tip touches the target.
- Leave at least 28 units between neighbouring nodes in a row.

## Edge labels

```svg
<text class="edge-label" x="…" y="…">pass</text>
```

- Use lowercase and at most 4 words; longer notes on loop lines are fine ("fail: feedback goes back to the generator").
- A label must never overlap a node or an arrowhead. A 12-unit label is about 7 units wide per character.
  - On a horizontal edge, put it at least 8 units above the line, and only where the gap is wider than the text.
  - In a narrow gap, put it above the whole node row, as `pass` sits in `prompt-chaining.svg`.
  - On a loop or return line, put it below or above the line, centred on its long segment.

## Layouts

Always flow left to right: input on the left, output on the right. Use one of these layouts, and copy the geometry of its reference file (paths are under `src/patterns/diagrams/`).

| Layout | Use it when | Reference file | Shape |
|---|---|---|---|
| **Linear pipeline** | Fixed steps run in order | `generic/prompt-chaining.svg` (720 × 200) | One row of nodes at `y=50`. A failure exit drops below a `node--check` with an `edge--optional`. |
| **Fan-out / fan-in** | Work is split and combined | `generic/orchestrator-workers.svg` (680 × 330) | Input, then the central node, then a column of parallel nodes, then a combining node, then the output below it. A re-plan loop runs above everything as an `edge--optional`. |
| **Loop** | Something repeats until a condition holds | `generic/evaluator-optimizer.svg` (680 × 270) | One row of nodes, with the loop-back edge running below the row and its labels under the line. Reference data, such as a `node--store`, sits above the node it feeds. |
| **Cloud** | A cloud architecture | `azure/multi-agent-orchestration-azure.svg` (690 × 430) | The user outside, on the left. An outer `zone` for the subscription holds everything else, with an inner `zone--inner` for the hosting environment. The main request path runs left to right through the zones. Model and gateway services sit in a right-hand column, and state stores sit below the node that writes to them. |

If a pattern genuinely needs another layout, such as a router choosing one of several paths, build it from the same parts. Keep the left-to-right flow, the node sizes and the 28-unit gaps.
