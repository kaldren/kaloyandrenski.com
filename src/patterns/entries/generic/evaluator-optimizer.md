---
title: Evaluator–Optimizer
aliases: Generate–critique–revise, Reflection loop, LLM-as-judge loop
category: Reliability
order: 3
summary: One model call writes a draft, a second call checks it against clear criteria and explains what's wrong, and the draft goes back for another pass until it passes.
figure: The generator writes a draft, the evaluator scores it against a rubric, and failing drafts go back with feedback. The loop stops when a draft passes or the round limit is hit.
caution: An evaluator that's too easy to please passes everything, and one with vague criteria makes the generator chase its own tail. Write the rubric down, test the evaluator on drafts you've already graded by hand, and always cap the number of rounds.
related: [prompt-chaining, orchestrator-workers]
---

## Everyday comparison

### The writer and the editor

A journalist files a story, and the editor hands it back covered in notes: the lead is buried, the second quote isn't attributed, cut 200 words. The journalist fixes it and sends it back. Two or three rounds later it runs. The editor doesn't write the story, and the journalist doesn't decide when it's good enough.

## Where it comes from

Anthropic's [Building effective agents](https://www.anthropic.com/research/building-effective-agents) names it as the workflow for tasks with clear evaluation criteria, where feedback measurably improves the result. It builds on research such as [Self-Refine](https://arxiv.org/abs/2303.17651), where a model improves its own output from its own feedback, and work on [LLM-as-a-judge](https://arxiv.org/abs/2306.05685), which measured how well a strong model's verdicts match human judgement.

## In the agent system

The pattern works when two things are true. You can say what "good" looks like, and a model's feedback actually makes the next draft better. Translation, code that must pass tests and documents with a strict house style are good fits. Open creative work, where "better" is a matter of taste, is not.

The evaluator can be a model, but use plain code when you can. A test suite, a linter or a schema check is cheaper, faster and never changes its mind.

## In a large company

The rubric is a business artifact, not a prompt detail. Store it, version it and have the people who own the quality bar sign it off. When an output is challenged later, you can show the exact criteria it passed.

Watch the cost. Each round is at least two model calls, so measure how often the second and third rounds actually change the verdict. If round three almost never helps, stop at two.

## Step by step

1. Write the rubric: a short list of pass or fail criteria the evaluator can check.
2. Grade a handful of drafts by hand and make sure the evaluator agrees with you.
3. Generate a first draft.
4. Have the evaluator return a verdict and specific feedback, in a fixed format.
5. If it fails, send the draft and the feedback back to the generator.
6. Stop when it passes or after a fixed number of rounds, and send anything that never passed to a person.

## Code sketch

```python
def refine(task: str, rubric: str, max_rounds: int = 3) -> str:
    draft = call_model("Complete this task:\n" + task)
    for attempt in range(1, max_rounds + 1):
        review = call_model(
            "Check the draft against the rubric. Return pass or fail, with specific fixes.",
            rubric=rubric,
            draft=draft,
            schema=Review,
        )
        if review.passed:
            return draft
        if attempt < max_rounds:
            draft = call_model("Revise the draft using this feedback:\n" + review.feedback, draft=draft)
    # Every round failed: a person decides, with the last draft and its feedback.
    raise NeedsHumanReview(draft, review.feedback)
```
