---
title: Reflection
aliases: Reflexion, Self-reflection, Self-correction
category: Reliability
order: 5
summary: After a failed attempt, the agent works out what went wrong, writes itself a short lesson, and tries again with that lesson in hand, so each attempt learns from the last.
figure: The actor attempts the task and an evaluator checks the result with tests or tools. A failed attempt goes to the reflector, which writes a short lesson into memory, and the actor reads it on the next try. The loop stops when an attempt passes or the attempt limit is hit.
caution: A model that checks its own work tends to decide it is fine, so reflection with no outside signal often changes nothing or makes the answer worse. Ground every critique in something the model can't argue with, such as a test run, a search result or a policy check, and always cap the number of attempts.
related: [evaluator-optimizer, retrieval-augmented-generation]
---

## Everyday comparison

### The driving test

A learner fails a driving test, and the examiner's sheet says why: no mirror check before the roundabout, too fast into the bend. That evening the learner writes two lines on a card: check the mirror before every roundabout, brake before the bend, not in it. The card goes into their pocket for the next test. The examiner never teaches, and the learner doesn't replay the whole drive, only the lessons on the card.

## Where it comes from

Three 2023 papers shaped the pattern. [Self-Refine](https://arxiv.org/abs/2303.17651) has one model write an answer, critique it and rewrite it, with no extra training, and reports about 20% absolute improvement on average across seven tasks. It also showed where self-critique breaks: on math problems the model couldn't tell whether its own answer had an error, so the gains were small. [Reflexion](https://arxiv.org/abs/2303.11366) added memory across attempts. After a failure the agent writes a short reflection, keeps the last one to three, and reads them on its next try. With unit tests it wrote itself as the signal, it reached 91% pass@1 on the HumanEval coding benchmark, against 80% for GPT-4 on its own.

[CRITIC](https://arxiv.org/abs/2305.11738) looked at what the critique should rest on. It checks each answer with tools, such as a search engine for facts or a code interpreter for code, before correcting it. Its authors found that self-correction without outside feedback "may yield modest improvements or even deteriorate performance."

## In the agent system

The loop around the attempts is a workflow: code runs the attempt, checks it, asks for a reflection and decides whether to try again. The attempt itself is often an agent with tools, as in Reflexion. The difference from Evaluator–Optimizer is what carries over between rounds. There, an evaluator marks up one draft until it passes. Here, the agent explains its own failure in words and takes that lesson into a fresh attempt. That helps most on multi-step tasks, where the fix is a different approach, not a better sentence.

It fits when a failure produces a clear signal: tests fail, a tool returns an error, an answer contradicts a search result. It fits poorly when the only judge is the model's opinion of itself, and it doesn't help much on tasks that need broad exploration. Reflexion made no real progress on a web-shopping benchmark where the agent had to search widely. It also needs a capable model: in both Self-Refine and Reflexion, smaller open models didn't produce feedback that helped.

## In a large company

Lessons are data the agent writes for itself, so govern them like any other memory. Log every reflection next to the attempt that caused it, and scope lessons to the task or customer they came from, so one client's case never shapes another's. Because reflections are plain text, the Reflexion authors note they can be checked before the agent acts on them. A trail of written lessons is far easier to audit than a model's hidden reasoning.

Cost and risk grow with every attempt. Each retry is a full attempt plus a reflection call, so measure how often attempts two and three actually succeed and set the limit from that. If attempts run generated code, run it in a sandbox: the Reflexion authors advise isolated execution environments because the code isn't validated before it runs.

## Step by step

1. Choose the outside signal that decides success: tests, a tool check or a policy rule, not the model's opinion of its own work.
2. Run the attempt and keep its trajectory: the actions, the tool results and the final answer.
3. If the check fails, ask the model to say in two or three sentences what went wrong and what to do differently.
4. Store that lesson, keep only the last few, and give them to the next attempt.
5. Test the signal itself, because a self-written test that passes a wrong answer ends the loop with a confident mistake.
6. Stop after a fixed number of attempts and send anything that never passed to a person, with its lessons.

## Code sketch

```python
def reflect_and_retry(task: str, max_rounds: int = 3) -> str:
    lessons: list[str] = []
    for _ in range(max_rounds):
        attempt = run_worker(task, tools=TOOLS, lessons=lessons)
        # The verdict comes from tests or tools, not the model's view of itself.
        verdict = run_checks(task, attempt)
        if verdict.passed:
            return attempt.answer
        lesson = call_model(
            "Your attempt failed. In two or three sentences, say why and what to do differently.",
            task=task,
            trajectory=attempt.trajectory,
            feedback=verdict.details,
        )
        # Keep only the latest few lessons, as Reflexion does.
        lessons = (lessons + [lesson])[-3:]
    raise NeedsHumanReview(attempt.answer, lessons)
```
