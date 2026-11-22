---
title: Pattern Name
aliases: Other name, Another name
category: Orchestration
order: 99
summary: One plain-language sentence saying what the pattern does.
figure: One or two sentences describing what the diagram shows, in the order the eye follows it.
caution: Name the way this pattern usually fails. Then say what to do about it.
related: [prompt-chaining]
---

## Everyday comparison

### The scene title

One paragraph, three to five short sentences, mapping the pattern onto an everyday, non-software situation.

## Where it comes from

Who named or popularised it, and where, with a real [link to the source](https://example.com).

## In the agent system

Workflow or agent? What problem it solves, how it differs from the nearest related pattern, and when it fits.

When it doesn't fit.

## In a large company

What changes at enterprise scale: governance, least privilege, cost, versioning or human sign-off.

A second angle, or the practical consequence of the first.

## Step by step

1. First imperative step.
2. Second step.
3. Third step.
4. Fourth step.
5. The stopping or safety step.

## Code sketch

```python
def pattern_name(task: str, max_rounds: int = 3) -> str:
    result = call_model("Do the first thing:\n" + task, schema=Result)
    return result
```
