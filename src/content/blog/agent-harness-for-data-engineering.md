---
title: 'Building an Agent Harness for Data Engineering'
description: 'A harness is what turns an LLM from a chat window into something that can safely operate on your pipelines — scoped tools, approval gates, sandboxing, and an audit log.'
pubDate: 'Jul 22 2026'
updatedDate: 'Oct 10 2026'
heroImage: '/blog-agent-harness.png'
difficulty: 'high'
tags: ['pipelines']
---

Pasting a stack trace into a chat window and pasting the fix back into your terminal is not automation — it's a human doing all the risky parts by hand while a model does the easy part. A **harness** is the system you build around a model so it can do more of the work directly: call real tools, read real schemas, propose real fixes — inside boundaries you define, with every action logged. This article covers what a harness is, why data engineering is a good and dangerous place to use one, and how to build a minimal version.

## What "Harness" Means Here

A harness is not the model. It's everything around the model that turns "generate some text" into "take a safe, bounded action on a real system":

- **Tools** — a fixed set of functions the model is allowed to call, each with a narrow, explicit contract (`get_table_schema`, `run_diagnostic_query`, `propose_action`).
- **Permission boundaries** — which tools are read-only, which are destructive, and which require a human to approve before they run.
- **An execution environment** — where tool calls actually execute (sandboxed container, read replica, staging warehouse — never directly against production with no isolation).
- **An audit log** — a durable record of every tool call, its arguments, and its result, independent of the model's own summary of what it did.

The model proposes actions. The harness decides what it's allowed to do, executes it, and writes down what happened. This separation is the entire point — it's what lets you trust the system without trusting the model's judgment on every single step.

## Why Data Engineering Is a Good Fit — and a Risky One

Pipeline failures tend to be structured and diagnosable: a schema changed upstream, a null rate spiked, a watermark stalled, a join started fanning out. These are exactly the kind of pattern-matching-plus-tool-use tasks agents are good at — check the schema, run a diagnostic query, compare against the last known-good run, propose a fix.

They're also exactly the kind of task where a bad action is expensive. `DROP TABLE`, a backfill that reprocesses two years of data, a migration applied to the wrong environment, a credential pasted into a log line that gets forwarded to a third-party API — a harness that can act on your warehouse can also break it faster than a human would, because it doesn't get tired or hesitant. The design goal isn't "let the agent do everything" — it's "let the agent do the diagnostic and drafting work, and gate everything with side effects behind a human."

## Anatomy of a Minimal Harness

Four pieces, in order of how a request flows through them:

```
[Agent] → proposes tool call
   ↓
[Tool layer] → validates args against a narrow schema
   ↓
[Permission boundary] → read-only? run it. destructive? queue for approval.
   ↓
[Sandboxed execution] → runs against an isolated environment, never prod directly
   ↓
[Audit log] → every call, its arguments, and its result, written durably
```

### The Tool Layer

Tools are the only interface between the model and your systems. Keep each one narrow — a tool that takes a raw SQL string and executes it against production is not a tool, it's a backdoor with extra steps.

```python
# harness/tools.py
from dataclasses import dataclass

@dataclass
class ToolResult:
    ok: bool
    data: dict | None = None
    error: str | None = None

def get_table_schema(table: str) -> ToolResult:
    """Read-only. Returns column names and types from information_schema."""
    if table not in ALLOWED_TABLES:
        return ToolResult(ok=False, error=f"{table} is not in the allowed set")
    # information_schema has names and types, not row counts. If you want a
    # count, run COUNT(*) as a bounded diagnostic query or read the catalog's
    # estimate (e.g. pg_class.reltuples in Postgres).
    schema = introspect(table)
    return ToolResult(ok=True, data=schema)

def run_diagnostic_query(sql: str) -> ToolResult:
    """Read-only. Runs against a read replica, with a hard row and time limit."""
    # The real safeguard is the database role: a replica connection whose
    # grants are SELECT-only. is_select_only() is defense in depth that gives
    # the agent a clear error message; string checks on SQL are easy to fool.
    if not is_select_only(sql):
        return ToolResult(ok=False, error="only SELECT statements are permitted")
    rows = execute_on_replica(sql, row_limit=1000, timeout_s=10)
    return ToolResult(ok=True, data={"rows": rows})

def propose_action(tool_name: str, args: dict, rationale: str) -> ToolResult:
    """Queues a specific destructive call for human review. Executes nothing."""
    proposal_id = queue_for_approval(
        tool_name=tool_name,
        args=args,
        args_hash=call_fingerprint(tool_name, args),
        rationale=rationale,
    )
    return ToolResult(ok=True, data={"proposal_id": proposal_id})
```

Notice `propose_action` never touches the pipeline itself: it writes the exact tool name and arguments to a review queue, along with a fingerprint of them. Running the action is a separate call, gated behind approval of that specific proposal.

### The Permission Boundary

Every tool falls into one of two buckets, and the harness — not the model — enforces which bucket:

| Tool type | Examples | Executes |
|---|---|---|
| Read-only | schema introspection, diagnostic queries, log search | Immediately, on request |
| Destructive / stateful | migrations, backfills, config changes, credential rotation | Only after a human approves the specific proposal |

```python
# harness/permissions.py
import hashlib, json

READ_ONLY = {"get_table_schema", "run_diagnostic_query", "search_logs"}
REQUIRES_APPROVAL = {"apply_migration", "run_backfill", "rotate_credential"}

def call_fingerprint(tool_name: str, args: dict) -> str:
    """Stable hash of exactly what will run: tool name plus canonicalized args."""
    payload = json.dumps({"tool": tool_name, "args": args}, sort_keys=True, default=str)
    return hashlib.sha256(payload.encode()).hexdigest()

def dispatch(tool_name: str, args: dict, actor: str,
             approved_proposal_id: str | None = None) -> ToolResult:
    result = _dispatch(tool_name, args, approved_proposal_id)
    log_tool_call(tool_name, args, result, actor)   # every call, including refusals
    return result

def _dispatch(tool_name, args, approved_proposal_id):
    if tool_name in READ_ONLY:
        return TOOLS[tool_name](**args)

    if tool_name in REQUIRES_APPROVAL:
        if not approved_proposal_id:
            return ToolResult(ok=False, error=f"{tool_name} requires an approved proposal_id")
        proposal = get_proposal(approved_proposal_id)
        if proposal is None or not proposal.approved:
            return ToolResult(ok=False, error=f"proposal {approved_proposal_id} was not approved")
        # The approval covers one exact call. If the tool or any argument
        # differs from what the human reviewed, refuse.
        if proposal.args_hash != call_fingerprint(tool_name, args):
            return ToolResult(ok=False, error="arguments differ from the approved proposal")
        # Approved changes still go through staging and the normal deploy path.
        return run_via_staging(TOOLS[tool_name], args)

    return ToolResult(ok=False, error=f"unknown tool: {tool_name}")
```

An agent can call `run_diagnostic_query` a hundred times in a session without asking anyone. It cannot call `apply_migration` without a human first looking at the specific diff and clicking approve.

Three details in `dispatch` matter more than they look:

- **Approval is bound to the exact call.** The human approves a fingerprint of `(tool_name, args)`. Without that check, an agent could get a 30-day backfill approved and then run the same proposal ID with `days=730`.
- **Approved actions still go through staging.** `run_via_staging` applies the change to a staging environment and promotes it through your normal deploy path, as described below. Approval doesn't mean "run it on production now".
- **Every call is logged, including refusals.** A refused destructive call is exactly the event you want on record.

### Sandboxed Execution

Diagnostic tools should run against a read replica or a warehouse role with `SELECT`-only grants — not because you don't trust the harness code, but because a bug in the harness shouldn't be able to become an outage. That grant is the actual safeguard; the `is_select_only` check in the tool is a second layer that produces friendlier errors. Anything that executes an approved fix should run in a staging environment first, and only reach production through the same deploy path a human change would use (migration tooling, CI, whatever you already have).

### The Audit Log

The model's own narration of what it did is not a source of truth — it's a summary that can be wrong or incomplete. Log every tool call independently of the model, from `dispatch`, and redact secrets before they reach the log:

```python
# harness/audit.py
import json, time

SECRET_KEYS = {"password", "token", "secret", "api_key", "credential", "private_key"}

def redact(args: dict) -> dict:
    """Replace values of secret-looking keys before anything is written."""
    return {
        k: "[REDACTED]" if any(s in k.lower() for s in SECRET_KEYS) else v
        for k, v in args.items()
    }

def log_tool_call(tool_name: str, args: dict, result: ToolResult, actor: str):
    record = {
        "ts": time.time(),
        "actor": actor,          # "agent:session-4f2a" or a human's approval identity
        "tool": tool_name,
        "args": redact(args),
        "ok": result.ok,
        "error": result.error,   # refusals are logged too: they show what the agent tried
    }
    append_to_durable_log(json.dumps(record))
```

When something goes wrong three weeks later, this log — not the chat transcript — is what you use to reconstruct what actually happened. Key-name redaction is a floor, not a guarantee: a secret pasted into a free-text argument (a SQL string, a log query) won't match, so keep credentials out of tool arguments entirely where you can.

## Guardrails Checklist

| Guardrail | Why it matters |
|---|---|
| Read-only by default | The agent should never be one bad tool call away from a write |
| Explicit tool allowlist | No general-purpose "run arbitrary SQL/shell" escape hatch |
| Approval gate on destructive tools | A human reviews the specific diff, not a description of it |
| Row and time limits on every query tool (cost limits where the warehouse supports them) | Bounds a runaway loop or a bad query before it becomes an incident |
| Approval bound to the exact call | A reviewed proposal can't be replayed with different arguments |
| Durable audit log, separate from the transcript | The transcript is a summary; the log is the record |
| Execution against replicas/staging, not prod directly | A harness bug degrades to "nothing happened," not an outage |

<!-- TODO(michael): EXPERIENCE — Have you run an agent against a real pipeline? What did it catch, what scared you? -->

## Where This Fits in the Pipeline Lifecycle

A harness like this is well suited to:

- **Incident triage** — given an alert, pull the schema, run a few diagnostic queries, and summarize the likely cause before a human even opens a terminal.
- **Schema drift detection** — compare today's schema against yesterday's snapshot and flag what changed.
- **Backfill and fix proposals** — draft the SQL or migration, with rationale, and queue it for review.
- **Runbook and documentation drafting** — turn a resolved incident's tool-call history into a first draft of a postmortem.

It is not well suited to unattended production writes. The value isn't removing the human from pipeline maintenance — it's removing the tedious, mechanical parts of diagnosis so the human's time goes into the one decision that actually matters: whether to approve the fix.

## Common Pitfalls

- **One tool that does everything.** A `run_sql(query: str)` tool that accepts arbitrary statements collapses the whole permission boundary into a single string match. Split read and write into separate, narrowly-typed tools.
- **No audit trail independent of the transcript.** If your only record of what happened is the model's chat log, you don't have an audit trail — you have the model's opinion of what it did.
- **Skipping the approval queue "just this once."** The queue is the boundary. The first time someone lets a destructive tool run without going through it is the time it matters most that it didn't.
- **Treating diagnostic output as ground truth without row/time limits.** An unbounded query from an agent is the same risk as an unbounded query from a runaway script — cap it the same way you would for any other automated caller.

## Related Articles

- **[Fear the Black Box: Why Data Must Be Understood End to End](/article/fear-the-black-box/)** — The same argument for legibility applies doubly to a system that can act on your data, not just describe it.
- **[Operational Telemetry, Explained](/article/operational-telemetry-explained/)** — The audit log described here is a form of telemetry; this article covers the broader pattern.
- **[Building Your First Data Pipeline](/article/building-your-first-data-pipeline/)** — The pipeline shape a harness like this is built to diagnose and maintain.
