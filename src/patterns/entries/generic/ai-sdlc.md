---
title: AI-SDLC
aliases: AI-native SDLC, Agentic SDLC, Agentic software development
category: Orchestration
order: 6
summary: Agents work at every stage of software delivery, from intent to spec, plan, code, review and release, and each stage commits an artifact a person accepts before the next one starts.
figure: A spec agent turns an intent into a spec, which the owner accepts. The build agent plans, codes and tests once an engineer accepts its plan, a review agent checks the pull request, and only a code owner can merge it. Every artifact is committed to the repository. When monitoring detects a breach in production, an ops agent diagnoses it and writes it up as a new intent, and the loop starts again.
caution: The usual failure is speed without review. Agents open pull requests faster than people can read them, approvals turn into rubber stamps, and an agent fixing a bug quietly weakens the test that caught it. Add parallel agents only while review keeps up, stop agents from editing the tests they must pass, and put the merge and production gates in controls no agent can get past.
related: [orchestrator-workers, reflection]
---

## Everyday comparison

### The building project

A client writes a brief, an architect turns it into drawings, and the client signs them. The builder works only to signed drawings and checks their own work as they go. An inspector signs off before anyone moves in. Every brief, drawing and inspection report goes into the project file, and when the roof leaks a year later, the report becomes the next brief.

## Where it comes from

Anthropic's [AI-native SDLC playbook](https://claude.com/resources/articles/the-ai-native-sdlc-playbook) starts from one observation: "Code is no longer the bottleneck." Agents can write most of the diff, but planning, review and release still move at human speed. The playbook keeps the six classic stages (plan, design, build, test, deploy, maintain) and changes how work moves between them: "Instead of a linear flow, the process becomes a loop, and AI is embedded at each point."

Its core rule is that "Every stage commits an artifact the next stage can read": an intent, a spec, a plan, the code with its tests, a pull request with review findings and, in the end, an incident record. "The chain of commits is also the audit trail: who asked for what, what the agent produced, and who approved it."

## In the agent system

The stages form a workflow: each accepted artifact starts the next stage, and code enforces the gates between them. Inside each stage is a real agent. A spec agent turns an idea, ticket or alert into an intent and then a spec. The build agent reads the code and writes a plan before it changes anything, because "Nothing is implemented without an accepted plan." It then codes and checks its own work with tests, a build or a visual comparison, so what reaches a person has already passed. A separate review agent, with a fresh context, checks every pull request for bugs, security and whether it matches the spec and plan. The loop closes in production: plain code watches the service and calls an ops agent only when a metric leaves its normal range. The agent diagnoses the problem, acts only through gated routes such as a rehearsed rollback, and writes what it found as a new intent, so people triage the work instead of having to start it.

It's Orchestrator–Workers and Reflection inside the gates a human team already uses. Written instructions for the agents are advisory. The deterministic layer behind them is checks that run before the agent acts: they block edits to protected files and to the tests under repair, and they stop a production deploy without sign-off. It fits teams with a test suite and a clear owner for each decision. Without tests, the agent has nothing to check its work against.

## In a large company

Separation of duties survives because the agent that wrote the code can't approve it. Branch protection turns everything an agent writes into a pull request that needs a code owner's approval, and "The agent may act up to the production gate, and cannot pass it": it prepares the release, and a named person authorizes it. Give each agent its own identity, scoped short-lived credentials and more autonomy in development than in production, so every log shows what the agent did and what a person did.

The agents' configuration is code, so test it like code. Keep a suite of 20 to 50 real tasks, run it whenever the instructions or controls change, and turn every production incident into a new case. Review capacity is the real limit: "add sessions only while review is keeping up."

## Step by step

1. Write every request as an intent (problem, outcome, constraints, open questions) and commit it.
2. Have an agent turn the accepted intent into a spec, and let the owner accept the spec before any plan is made.
3. Let the build agent read the code and write a plan, and don't let it change files until an engineer accepts the plan.
4. Give the agent a way to check its own work, and block it from editing the tests it must pass.
5. Run a review agent on every pull request, let the build agent fix its findings, and require a code owner's approval to merge.
6. Let agents act up to the production gate and never past it, and let plain monitoring call an ops agent that writes each breach up as a new intent.

## Code sketch

```python
def deliver(intent: Intent, max_rounds: int = 3) -> Release:
    spec = call_model("Turn this intent into a spec.", intent=intent, schema=Spec)
    require_approval(commit(spec), by="owner")
    plan = run_worker(spec, tools=READ_ONLY_TOOLS, schema=Plan)
    require_approval(commit(plan), by="engineer")
    # The agent checks its own work and can't edit the tests it must pass.
    pr = run_worker(plan, tools=BUILD_TOOLS, done_when="all tests pass")
    for _ in range(max_rounds):
        findings = run_worker(pr.diff, tools=REVIEW_TOOLS, policy=REVIEW_POLICY, schema=Findings)
        if not findings.important:
            break
        pr = run_worker(findings, tools=BUILD_TOOLS, pr=pr)
    else:
        raise NeedsHumanReview(pr, findings)
    # Gates live in branch protection and the release process, not in the prompt.
    require_approval(pr, by="code_owner")
    return prepare_release(pr)  # A named person authorizes production.
```
