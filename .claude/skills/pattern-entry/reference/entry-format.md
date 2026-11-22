# Generic pattern entry format

Use this format for entries in the generic track (`"format": "pattern"` in `src/patterns/catalog.json`). One entry is one markdown file, `src/patterns/entries/generic/<slug>.md`. Cloud entries use `cloud-format.md` instead. The build (`scripts/build-blog.mjs`) enforces the parts marked **(build)**.

## Front matter

The fields always appear in this order:

| Field | Rule |
|---|---|
| `title` | **(build)** The pattern's common name in Title Case. Join paired roles with an en dash (`Evaluator–Optimizer`, `Orchestrator–Workers`). |
| `aliases` | Optional. 1–3 other names people search for, comma-separated (`Sequential workflow, LLM pipeline`). |
| `category` | **(build)** Exactly one `name` from the generic track's `categories` in `src/patterns/catalog.json`. |
| `order` | **(build)** Unique within the track: one more than the track's current highest. It only sorts entries within their category. |
| `summary` | **(build)** One plain-language sentence, at most about 200 characters, saying what the pattern does. No jargon a non-engineer couldn't follow. |
| `figure` | **(build)** The diagram caption: 1–2 sentences describing what the diagram shows, in the order the eye follows it. |
| `caution` | **(build)** One paragraph, 2–3 sentences. Name the way this pattern usually fails, then say what to do about it. It is plain text, so no markdown or links. |
| `related` | **(build)** 1–3 slugs of other entries in any track, as a YAML list (`[prompt-chaining, orchestrator-workers]`). Links go both ways. Don't list cloud entries that implement this pattern; the build links those automatically under "In the cloud". |

Quote a value with `"…"` only if YAML needs it, for example when it contains `: ` or starts with a special character.

## Body: six sections, in this order **(build)**

```markdown
## Everyday comparison

### The <scene>

## Where it comes from

## In the agent system

## In a large company

## Step by step

## Code sketch
```

Use no other `##` headings and no `#` headings. The build moves every heading down two levels on the page (the track is the `h2` and the entry title the `h3`), so `##` renders as `h4`.

### Everyday comparison
- Start with a `###` scene title naming a concrete, non-software situation, as "The <thing>": "The assembly line", "The general contractor", "The writer and the editor". **(build: the `###` must come first)**
- Then one paragraph of 3–5 short sentences that maps each part of the pattern onto the scene. Don't explain the mapping; the reader will see it.

### Where it comes from
- 1–2 short paragraphs: who named or popularised it and in what context.
- At least one real markdown link to a primary source: a paper, an official engineering post or documentation. Verify every link. If you can't, write `TODO: source`.
- Cite only what the source actually says.

### In the agent system
- 2 short paragraphs.
- Say whether it is a workflow (code decides the steps) or an agent (the model decides). Say what problem it solves, how it differs from the nearest related pattern, and when it fits and when it doesn't.

### In a large company
- 2 short paragraphs on what changes at enterprise scale. Pick the angles that matter most for this pattern:
  - governance and audit
  - least-privilege tools and data access
  - cost and budgets
  - versioning and testing
  - human sign-off

### Step by step
- A numbered list of 5–6 steps, each one imperative sentence ("Write the rubric…", "Stop at a fixed number of rounds…").
- Always include the stopping or safety step if the pattern loops or delegates.

### Code sketch
- One fenced `python` block of about 10–20 lines. It is a sketch, not runnable code: no imports and no real SDK calls.
- Use the same made-up helpers as the existing entries so the sketches read as one family:
  - `call_model(prompt, **context, schema=SomeModel)` for one model call. `schema=` means structured output.
  - `run_worker(subtask, tools=...)` runs a sub-agent; `run_in_parallel(...)` runs workers in parallel.
  - Raise a named exception for a stop or escalation, such as `ChainStopped(...)` or `NeedsHumanReview(...)`.
  - Use type hints on the function signature, and give loops and retries a `max_rounds` keyword argument with a default.
- Use one-line comments only where the code alone doesn't make the point (`# Gate: plain code, not another model call.`).

## Voice

- Write as Kaloyan: direct, practical, an architect explaining to engineers and decision makers. Use short sentences and plain words.
- Use "I" sparingly, and only for opinions he holds. Never make up anecdotes.
- No hype ("revolutionary", "game-changing") and no filler ("In today's fast-paced world").
- Write "model call", "agent", "tool" and "workflow" consistently with the existing entries.
- Keep each section short. The whole entry should read in about 3 minutes.
