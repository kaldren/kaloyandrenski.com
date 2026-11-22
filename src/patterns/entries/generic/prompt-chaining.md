---
title: Prompt Chaining
aliases: Sequential workflow, LLM pipeline
category: Orchestration
order: 1
summary: Split a task into a fixed sequence of model calls, where each step works on the output of the one before and plain code checks the result between steps.
figure: Three model calls run in a fixed order. A code gate after the first step stops the chain before a bad outline turns into a bad draft.
caution: Errors add up along a chain. A small mistake in step one becomes the input to every step after it, so put a cheap check after the steps that matter most and stop early instead of letting the chain polish a wrong answer.
related: [orchestrator-workers, evaluator-optimizer]
---

## Everyday comparison

### The assembly line

A car factory doesn't ask one person to build a whole car. One station fits the frame, the next adds the engine, and an inspector checks the welds before the car moves on. Each station does one job well, and a problem is caught at the station where it happened, not at the end of the line.

## Where it comes from

Anthropic's [Building effective agents](https://www.anthropic.com/research/building-effective-agents) lists it first among its workflows: each model call works on the output of the one before, with optional programmatic checks, or "gates", between the steps. It recommends it for tasks that split cleanly into fixed subtasks, trading some speed for accuracy.

## In the agent system

Prompt chaining is a workflow, not an agent. The steps and their order are written in code, so the model never decides what happens next. That's the point. You trade flexibility for predictability, and each call gets a smaller, clearer job than one giant prompt would.

It fits any task that splits cleanly into stages: outline, then draft, then polish. Or extract, then classify, then summarize.

## In a large company

Chains are easy to govern, which is why they're often the first pattern that gets through architecture review. Every step is a named, versioned prompt with its own input and output schema, so you can log, test and swap them one at a time.

You can also give each step the cheapest model that does the job well. The extraction step rarely needs your most expensive model.

## Step by step

1. Write down the stages the task already has. If you can't name them, this isn't the right pattern.
2. Give each stage its own prompt with a clear input and output format.
3. After the steps that matter most, add a gate in code. It can be a schema check, a length limit or a keyword test.
4. When a gate fails, stop or retry that step. Don't pass bad output down the line.
5. Log each step's input and output, so a bad result can be traced to the step that caused it.

## Code sketch

```python
def write_article(topic: str) -> str:
    outline = call_model("Write a five-point outline about: " + topic)

    # Gate: plain code, not another model call.
    points = [line for line in outline.splitlines() if line.strip()]
    if len(points) != 5:
        raise ChainStopped("outline step returned %d points" % len(points))

    draft = call_model("Write an article from this outline:\n" + outline)
    return call_model("Tighten this draft. Keep the facts:\n" + draft)
```
