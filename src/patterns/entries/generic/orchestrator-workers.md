---
title: Orchestrator–Workers
aliases: Lead agent and sub-agents, Planner–executor, Supervisor
category: Orchestration
order: 2
summary: A lead agent breaks a task into sub-tasks at run time, hands each one to a worker with its own focused context, and combines what comes back.
figure: The orchestrator plans and delegates to three workers, then synthesizes their results into one answer. When the results leave gaps, it plans another round.
caution: Workers only know what the orchestrator tells them. A vague hand-off like "look into the auth code" gets you three workers doing overlapping work, or none doing the part that mattered, so every sub-task needs a goal, its boundaries and the shape of the answer you want back.
related: [prompt-chaining, evaluator-optimizer, ai-sdlc]
---

## Everyday comparison

### The general contractor

When you renovate a kitchen, the contractor walks through the room, decides what needs doing and calls in an electrician, a plumber and a tiler. None of them sees the whole plan, and they don't need to. The contractor checks their work, notices the socket is in the wrong place, and sends the electrician back.

## Where it comes from

Anthropic's [Building effective agents](https://www.anthropic.com/research/building-effective-agents) describes it as the workflow for tasks where you can't predict the sub-tasks in advance. One of its examples is a coding change across several files, where which files need changing depends on the task. Multi-agent frameworks often call the same shape a supervisor.

## In the agent system

The difference from prompt chaining is who decides the steps. In a chain, you write them in code. Here, the orchestrator decides them at run time, based on the task in front of it.

Each worker starts with a clean context window that holds only its sub-task. That's the real win: the orchestrator's context stays small because it gets back summaries, not every file a worker read. Independent workers can also run in parallel.

## In a large company

Give each worker only the tools its job needs. A worker that searches code doesn't need write access, and a worker that edits files doesn't need the production database. The orchestrator is the one place to enforce that, so put the tool list in the hand-off, not in the worker's goodwill.

Budget the whole run, not just each call. Workers multiply cost quickly, so set a limit on workers, rounds and tokens, and log every hand-off so you can see why the orchestrator spent what it spent.

## Step by step

1. Give the orchestrator the task, the list of worker types and the tools each one may use.
2. Have it write a plan: sub-tasks, each with a goal, boundaries and the expected answer format.
3. Run the workers, in parallel where the sub-tasks don't depend on each other.
4. Collect short results, not full transcripts, back into the orchestrator.
5. Let the orchestrator check for gaps and either plan another round or write the final answer.
6. Stop at a fixed number of rounds, even if it wants another one.

## Code sketch

```python
def orchestrate(task: str, max_rounds: int = 3) -> str:
    results = []
    for _ in range(max_rounds):
        plan = call_model(
            "Split this task into independent sub-tasks. "
            "For each, give a goal, its limits and the answer format.",
            task=task,
            done_so_far=results,
            schema=Plan,
        )
        if not plan.subtasks:
            break
        results += run_in_parallel(
            run_worker(sub, tools=TOOLS[sub.kind]) for sub in plan.subtasks
        )
    return call_model("Combine these results into one answer.", task=task, results=results)
```
