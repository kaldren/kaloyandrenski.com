---
title: "Claude Ship: automating the pull request stage of the AI-SDLC"
date: 2026-11-25
summary: Anthropic's Claude Ship automates pull requests with Code Review, PR Steward and Claude Approvals. What each part does, and where people still belong.
---

Anthropic has released [Claude Ship](https://claude.com/resources/articles/introducing-claude-ship), a product that automates the pull request stage of the AI-assisted software development lifecycle. Your agents write the code and open a pull request. Claude then reviews it, fixes it, and approves it if your team's policy says it can.

Coding agents have made writing code cheap. The bottleneck has moved to everything after the pull request opens: review, failing checks, merge conflicts and sign-off. Claude Ship goes after that stage.

![Claude Ship flow: an opened pull request goes through Code Review, then PR Steward, then Claude Approvals, which either lets Claude approve or requires a human to sign off, before the change enters your delivery pipeline of merge, deploy and production](/public/blog/claude-ship-pull-request-to-production.jpg)

## The three parts of Claude Ship

Claude Ship is three agents, each owning one step of the pull request.

**Code Review finds and verifies bugs.** It reviews the pull request against the whole codebase from several angles, then adversarially verifies its own findings before posting them, so you get fewer false alarms. You pick a Quick, Standard or Deep review level per repository. This part was already [generally available](https://claude.com/resources/articles/code-review-is-now-generally-available).

**PR Steward keeps the pull request green.** It works through failing CI checks, merge conflicts, and feedback from Code Review, other review tools or teammates. After every push it comments with what it changed and how to undo it. You steer it with an `@claude` comment, or tell it to back off with `@claude stop`. It is deliberately designed never to approve or merge.

**Claude Approvals applies your team's approval rules.** The team writes an approval policy as a file in the repository. Claude can approve routine changes on its own where the policy allows, and require a human to sign off on everything else. Anthropic describes it as "a smarter CODEOWNERS file": instead of only matching file paths, a policy can use Code Review findings or your own natural-language classifiers to decide what counts as routine.

Your existing branch protection and required checks stay in place. Claude Ship sits in front of your delivery pipeline, it doesn't replace it.

## How you turn it on

There are two ways in:

- **Per developer**, with the new `/ship` command in Claude Code. Claude pushes your change, opens the pull request, reviews it, and works on feedback and failing checks.
- **Per repository**, where an admin turns it on and it runs on every pull request, without anyone typing `/ship`. The admin picks the review level, when reviews run and a monthly spend limit.

It's in beta on the Claude Team and Enterprise plans, for repositories on GitHub. Code Review is generally available; PR Steward and Claude Approvals are the beta parts. Billing is by tokens, so cost grows with the number and size of pull requests, the review level and how much fixing PR Steward does. It isn't available to organisations using Zero Data Retention, the HIPAA configuration or customer-managed encryption keys. The [Claude Ship docs](https://code.claude.com/docs/en/claude-ship) cover the setup.

## A person still has to watch over it

These systems are, at the end of the day, probabilistic. Anthropic says so itself: Claude Ship "may miss bugs, security vulnerabilities, or other issues."

So the question isn't whether to keep humans involved, it's where. Every gate in this flow needs domain expertise behind it:

- **Review.** Someone who knows the system has to decide which findings matter and what a reviewer that has never seen production will miss.
- **Code fix.** A fix that turns a check green isn't automatically the right fix. Someone has to look at what PR Steward changed, not just that the build passes.
- **Approval.** The policy is only as good as the people who wrote it. Someone has to decide what "routine" means for this codebase, and keep that definition current as the code changes.

Without that, automating the pull request stage turns into a nightmare. You get a faster pipeline that merges more changes nobody really understood.

The product does leave room for this. Claude Approvals can run in observe-only mode first, so you can compare its decisions with your team's before you let it approve anything. Only once you trust it do you make its approval a required check in branch protection. That's the order I'd follow: start with one repository, watch it for a while, and widen the policy only as the evidence builds up.

## Worth experimenting with

Claude Ship is still in its early days, and it automates exactly the part of delivery where mistakes reach production. But splitting the work into review, fix and approval, with policy deciding where humans step in, is the right shape for AI in the pull request stage. It's worth trying on a low-risk repository, with an expert watching every gate.
