# Architecture — ProiectWeb_1

<!-- graffino-agentic:begin v1 -->
> How this repo is built, generated from the code at backfill and kept current by
> whoever changes the structure. The code wins: when this page is wrong, fix it.
<!-- graffino-agentic:end -->

## Overview
ProiectWeb_1 web application architecture (initial setup).

```text
[Client / Browser] <---> [Web Application] <---> [Storage / Database]
```

## Parts
| Part | Path | Responsibility | Talks to |
|---|---|---|---|
| Core | `src/` | Application logic (to be initialized) | Browser / Storage |

## Data flow
1. User request -> Application route -> Processing -> Response.

## State and storage
| What | Where | Owner | Notes |
|---|---|---|---|
| App data | TBD | ProiectWeb_1 | To be determined in Q-001 |

## Configuration
| Name | Where set | Used by | Notes |
|---|---|---|---|
| ENV | Environment | Core | Standard configuration |

## Build, deploy, runtime
Runtime environment to be configured once stack is selected (see Q-001).

## Boundaries
Boundary rules and contracts defined in `docs/agents/CONTRACTS.md`.
