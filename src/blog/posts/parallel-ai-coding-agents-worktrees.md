---
title: "Running AI coding agents in parallel without port fights"
date: 2026-11-02
summary: How I run several AI coding agents in parallel on one app, why a port per git worktree fell apart, and how local domains fixed it.
---

Most work with an AI coding agent looks the same. One agent, one task, and a lot of waiting for it to finish. I wanted to run AI coding agents in parallel instead, with several of them building separate features on the same app at once. That turned out to be harder than opening more terminals.

## Starting with git worktrees

The first problem is code. Agents working in the same checkout trip over each other's changes.

The fix is a [git worktree](https://git-scm.com/docs/git-worktree) per agent. A worktree is a separate checkout on its own branch, sharing one repository, so each agent works in its own folder and never touches another agent's files. Claude Code supports this out of the box with `claude --worktree dark-mode`.

That solved the code. It didn't solve running the app.

## The problem with ports

Every worktree is a full copy of the app, and every copy wants to run its dev server on port 3000. Only one of them can.

My first fix was to give each worktree its own port. I wrote hooks that started a containerised copy of the app for each worktree on a different port, plus a script that hunted for free ports.

It worked, but it was a hack. With ten worktrees I had ten random ports and no idea which was which. Was the dark mode feature on 3004 or 3007? Every new worktree meant more scripts to keep working, and I spent more time managing ports than looking at features.

## Switching to local domains

So I stopped thinking in ports and gave each worktree a name instead.

```text
dark-mode.cats.localhost
feed-cat.cats.localhost
meow.cats.localhost
```

Any name ending in `.localhost` points to your own machine without any setup. [RFC 6761 reserves it for loopback](https://www.rfc-editor.org/rfc/rfc6761#section-6.3), and browsers handle it natively, so there are no hosts file edits and no local DNS server.

A small reverse proxy, [Caddy](https://caddyserver.com/), listens on port 80 and sends each name to the right worktree's dev server. The dev server still runs on some port behind the proxy, but nobody has to know which one. A script picks a free port and registers the name with Caddy when the server starts, and removes it when the server stops.

## What domains solved

**I know where every feature lives.** The address is the feature name. If an agent is building dark mode, it's at dark-mode.cats.localhost. I open the three domains in tabs side by side and watch each feature take shape, and each tab shows only its own agent's work.

**The agents know too.** Each agent is told its own address, so it tests its feature in the right place and doesn't start a second server on port 3000.

**No more port bookkeeping.** There's no list of ports to remember, and no clashes when I add the tenth worktree.

**Separate logins.** I hadn't planned for this one. [Cookies are scoped by host, not port](https://www.rfc-editor.org/rfc/rfc6265#section-8.5), so worktrees running on localhost with different ports all share one login session. Log out in one and you're logged out in all of them. With a domain each, every worktree gets its own cookies.

## Where it ended up

Now starting a new feature takes one command per agent.

```bash
claude --worktree dark-mode
claude --worktree feed-cat
claude --worktree meow
```

Each agent gets its own code, its own running app and its own address. The time I used to spend juggling ports now goes into reviewing and merging what the agents have built.

Then I stopped setting it up by hand. I turned the whole setup into a skill, so any project gets it with a single request to my agent. After that I built it into Squadstorm, my personal IDE, so every worktree I create there comes up with its own domain and a running app, with nothing for me to do.
