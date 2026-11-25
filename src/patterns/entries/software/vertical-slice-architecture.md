---
title: Vertical Slice Architecture
aliases: Feature slices, Feature folders, Slice architecture
category: Application Structure
order: 1
summary: Organise code by feature instead of by technical layer, so everything one request needs, from the endpoint to the data, lives together in one folder.
figure: Two slices, add_task and complete_task, each hold their own endpoint, request schema and handler. A request enters one slice, its schema validates it and its handler does the work, and the only thing the slices share is the task store. main.py only registers each slice's router.
caution: Slices drift into copy and paste. The same business rule ends up written in three slices and changed in only two. Some duplication between slices is fine, but when a real rule repeats, move it into shared domain code that each slice calls, and never let one slice import from another.
related: [retrieval-augmented-generation]
---

## Everyday comparison

### The meal kit

A meal kit doesn't send you a bag of all the onions, a bag of all the spices and a bag of all the sauces for the week. Each box holds everything for one recipe: the card, the measured ingredients, the sauce. To cook Tuesday's dinner you open one box and nothing else. A new recipe is a new box, and the other boxes stay exactly as they were. Salt and oil still come from the shared shelf.

## Where it comes from

Jimmy Bogard, who also wrote the MediatR library for .NET, named it in his 2018 post [Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/). He builds each system around distinct requests, grouping everything one request needs "from front-end to back", and couples "along the axis of change" instead of across layers. His rule: "Minimize coupling between slices, and maximize coupling in a slice."

He came to it after an onion architecture project started to crack within months. His argument is that rigid layer rules, like "Controller MUST talk to a Service that MUST use a Repository", add abstractions most requests don't need. Each slice can choose its own approach instead: start with simple code and refactor only when it grows complex.

## In the agent system

Vertical slices are neither a workflow nor an agent. They are a way to lay out the code that hosts both. In an agentic app, each capability is one slice: "draft a reply", "summarise a ticket" and "search the policy docs" each get a folder with their own endpoint or tool definition, input schema, prompt, model call and eval cases. Changing one prompt touches one folder, and only that slice's evals need to run again. The same holds for agent tools: one tool is one slice, and an MCP server registers its tools the way `main.py` registers routers.

The alternative is the familiar layered layout: a `prompts/` folder, a `services/` folder and a `repositories/` folder, where every feature is spread across all three. That works for a small app with a handful of endpoints. It also stops paying off when slices share a lot of real domain rules, which then belong in a shared domain model. Bogard's own caveat: the team has to recognise when a handler is doing too much and refactor it.

## In a large company

Slices make ownership clear. A team owns a feature folder end to end, review rules can be set per folder, and deleting a feature means deleting a folder rather than hunting through layers. It is also easier to audit: each slice declares which tools, data and model it uses, so least-privilege access and cost per feature can be checked one slice at a time.

The risk at scale is that every team solves the same cross-cutting problems on its own. Keep authentication, logging, tracing, rate limits and the model gateway in shared middleware that every slice passes through, so slices hold business logic, not copies of plumbing.

## Step by step

1. List the requests the system handles, one use case per line, and give each its own folder under `features/`.
2. Put that use case's endpoint, request schema and handler in its folder, and nothing that belongs to another use case.
3. Register every slice's router or tool in one entry point, so that file is the only one that knows about all the slices.
4. Write each handler as the simplest code that does the job, and refactor it into domain objects only when the logic grows complex.
5. Keep cross-cutting concerns such as authentication, logging and tracing in shared middleware instead of copying them into each slice.
6. Never import from one slice into another. When a business rule repeats, move it into shared domain code.

## Code sketch

```python
# features/add_task/schema.py: the request this slice accepts.
class AddTask(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]

# features/add_task/handler.py: the operation, as simple as it can be.
def add_task(request: AddTask, db: Database) -> Task:
    return db.tasks.insert(Task(name=request.name, completed=False))

# features/add_task/router.py: the endpoint.
router = APIRouter()

@router.post("/tasks", status_code=201)
def post_task(request: AddTask, db: Database = Depends(get_db)) -> Task:
    return add_task(request, db)

# main.py: the only file that knows about every slice.
app = FastAPI()
app.include_router(add_task.router)
app.include_router(complete_task.router)
```
