---
title: Retrieval-Augmented Generation
aliases: RAG, RAG chatbot, Grounded generation
category: Context & Memory
order: 4
summary: Before the model answers, code searches your own documents for the passages that matter and puts them in the prompt, so the answer rests on your data instead of the model's memory.
figure: The question goes to a retriever, which pulls the best passages from an index. The model answers from those passages, and a check sends the answer out only if it is grounded in them.
caution: Most bad answers are bad retrieval, not a bad model. If the right passage never reaches the prompt, the model fills the gap with something plausible, so test retrieval on its own with real questions, and let the system say it doesn't know when nothing relevant comes back.
related: [prompt-chaining, reflection]
---

## Everyday comparison

### The open-book exam

In an open-book exam, nobody expects you to remember every fact. You find the right page, read it, and write your answer from it, citing the page. A student who picks the wrong chapter still writes a confident answer, just a wrong one. The grade depends on finding the page as much as on writing well.

## Where it comes from

The name comes from the 2020 paper [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401) by Patrick Lewis and colleagues, which paired a language model with a search index over Wikipedia so answers could draw on facts the model didn't store. Anthropic's [Building effective agents](https://www.anthropic.com/research/building-effective-agents) treats retrieval as part of the basic building block of agentic systems: "an LLM enhanced with augmentations such as retrieval, tools, and memory."

## In the agent system

In its simplest form it is a workflow: code always searches, then the model answers. In an agent, search is a tool, and the model decides when to call it and what to search for, sometimes several times. Start with the workflow. Move to the agent version only when one search per question isn't enough.

It fits when the answer lives in documents you own and change: policies, product manuals, contracts, tickets. It doesn't fix a model that can't reason about the material, and it isn't the right tool when the data is structured and a database query would give the exact answer.

## In a large company

Access control is the hard part. The index must respect who is allowed to read each document, so filter results by the user's permissions at query time, not by asking the model to hide what it shouldn't show.

Treat the index as a product with an owner. Documents go stale, get duplicated and contradict each other. Decide who keeps the sources clean, how often the index refreshes, and log which passages each answer used, so a wrong answer can be traced back to its source.

## Step by step

1. Split your documents into passages and index them, keeping the source and access rights on every passage.
2. Build a test set of real questions with the passages that should answer them, and measure retrieval on it before you tune any prompt.
3. At question time, search the index, filtered by the user's permissions, and keep the top few passages.
4. Ask the model to answer only from those passages and to cite them.
5. Check the answer against the passages before it goes out.
6. If nothing relevant comes back or the check fails, say you don't know instead of guessing.

## Code sketch

```python
def answer(question: str, user: User, top_k: int = 5) -> Answer:
    passages = search_index(question, allowed_for=user, limit=top_k)
    if not passages:
        # Nothing to ground on: decline instead of guessing.
        return Answer.not_found()
    reply = call_model(
        "Answer only from the passages. Cite each one you use.",
        question=question,
        passages=passages,
        schema=Answer,
    )
    check = call_model("Is every claim supported by the passages?", reply=reply, passages=passages, schema=Verdict)
    if not check.grounded:
        return Answer.not_found()
    return reply
```
