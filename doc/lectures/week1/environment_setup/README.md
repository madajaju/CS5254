# Environment and Repo Structure

## Video: https://youtu.be/ywsOMy4n8g4
## Metadata
- Course: CS 5254b - Object-Oriented Systems Under Concurrency
- Week: 1
- Lecture: Environment and Repo Structure
- Duration: 15 minutes
- Prerequisites: Git basics, command-line execution, package managers, editor or IDE setup
- Assignment Alignment: [A0 - Project Selection, Environment & Integrity Packet](../../../assignments/A0/index.md)

## Learning Objectives
- Design a repository structure that supports two-stack implementation and repeatable evidence collection.
- Evaluate whether a development environment can produce reproducible runs.
- Diagnose setup gaps that will make later concurrency failures hard to analyze.
- Justify tool and runtime choices in terms of observability, repeatability, and comparison.
- Defend environment evidence in an oral review.

## Opening Narrative
A student demonstrates a concurrent failure on their laptop. The logs prove a race condition, but the command does not run on another machine. One stack uses a different runtime version, the second stack writes logs in a different format, and the repository stores evidence in ad hoc folders. The failure may be real, but the engineering process is not reproducible.

How should the environment be structured so future failures can be repeated, compared, and defended?

## Core Concepts

### Reproducible Execution
- Definition: The ability to run the same workflow with the same configuration and obtain comparable behavior.
- Why it matters: Concurrency failures are difficult to analyze when the environment changes silently.
- Mechanism: Versioned runtimes, scripts, containers, and documented commands reduce ambiguity.
- Failure mode: A result only works on one developer machine.
- Design implication: Every assignment needs runnable commands and captured evidence.

### Two-Stack Repository Layout
- Definition: A project structure that separates implementations while preserving conceptual parity.
- Why it matters: A1 requires the same object model in two runtime environments.
- Mechanism: Shared documentation, separate stack directories, and common scripts keep the comparison meaningful.
- Failure mode: The two implementations drift and no longer test the same design.
- Design implication: The repo must make comparison obvious.

### Structured Logging
- Definition: Consistent event records that include time, operation ID, entity ID, action, and state.
- Why it matters: Logs are the main evidence for concurrency behavior.
- Mechanism: JSON logs or consistent key-value logs allow sorting, filtering, and correlation.
- Failure mode: Students cannot prove which operation caused a state change.
- Design implication: Logging must be designed before failure injection.

### Evidence Organization
- Definition: A predictable location for commands, screenshots, logs, test output, and integrity packet entries.
- Why it matters: Evidence must be reviewable by another person.
- Mechanism: Standard folders and naming conventions reduce lost context.
- Failure mode: Claims cannot be traced to raw output.
- Design implication: The repo is part of the system, not a storage afterthought.

## System / Architecture View

```text
semester-repo/
  A0/
  A1/
  A2/
  A3/
  A4/
  docs/
  integrity-packet/
  shared/
  src/
    stack-a/
    stack-b/
  scripts/
  evidence/
    logs/
    screenshots/
    command-output/
```

The structure separates coursework milestones from implementation code while keeping evidence and integrity documentation accessible across assignments.

## Worked Example

### Problem Setup
A student chooses the podcast production domain and implements it in Java and Node.js. Both stacks must run the same workflow: create an episode, process assets, mark the episode ready, and publish.

### Naive Mental Model
The student places code wherever each framework prefers and relies on manual IDE runs. Java writes console text. Node.js writes a different format. The student later tries to compare concurrency behavior and cannot align events.

### Failure Scenario
Five workers publish the same episode. Java logs thread names. Node.js logs request IDs. Neither log includes the same episode correlation ID. The student cannot show whether the same failure happened in both stacks.

### Improved Design Direction
Define a shared event schema:

```json
{
  "operationId": "op-017",
  "entityType": "Episode",
  "entityId": "episode-42",
  "action": "publish_attempt",
  "previousStatus": "READY_TO_PUBLISH",
  "newStatus": "PUBLISHED",
  "stack": "node",
  "timestamp": "2026-01-15T10:15:30Z"
}
```

This is safer because the environment now supports comparison. The same failure can be observed, filtered, and defended across both implementations.

## Visual Model Anchors

### System Interaction
Actors:
- Student developer
- Java stack
- Node.js stack
- Evidence directory

Flow:
- Run the same podcast workflow from a checked-in script
- Both stacks emit `operationId`, `entityId`, `action`, and `state` fields
- Reviewer compares command output and logs without using the student IDE

Diagram intent:
- Show the normal interaction before Reproducible Execution is placed under pressure.

### State Transition Model
States:
- UNCONFIGURED
- RUNNABLE_LOCAL
- REPRODUCIBLE_REVIEW
- EVIDENCE_ACCEPTED

Transitions:
- UNCONFIGURED -> RUNNABLE_LOCAL: install runtime and run setup script
- RUNNABLE_LOCAL -> REPRODUCIBLE_REVIEW: peer runs the documented command
- REPRODUCIBLE_REVIEW -> EVIDENCE_ACCEPTED: logs match the shared schema

Invariant:
- The same domain workflow can be executed and compared in both stacks with traceable evidence.

### Failure Interleaving
Interleaving:
T1: Java stack logs `episode-42` with `operationId=op-17`
T2: Node.js stack logs the same transition without `operationId`

Failure:
- The reviewer cannot align Java and Node.js behavior for the same podcast episode.

Violated invariant:
- The same domain workflow can be executed and compared in both stacks with traceable evidence.

### Failure Scenario
Pressure:
- Peer review on a clean machine with no IDE state or local shell history.

Observed:
- The reviewer cannot align Java and Node.js behavior for the same podcast episode.

Root cause:
- The repository treated setup and logging as local convenience instead of evidence infrastructure.

Evidence:
- Version output, setup command transcript, stack-specific run logs, and a shared evidence index.

### Design Response
Protected property:
- Repository evidence remains reproducible across machines and across stacks.

Mechanism:
- Checked-in run scripts, pinned versions, shared log schema, and predictable evidence folders.

Trade-off:
- More setup discipline before feature work starts.

Diagram intent:
- Show the baseline path beside the corrected path and label the point where the invariant is protected.

### Evidence Flow
Claim:
- The project is ready for [A0 - Project Selection, Environment & Integrity Packet](../../../assignments/A0/index.md) because a reviewer can rerun and compare the baseline workflow.

Evidence:
- Version output, setup command transcript, stack-specific run logs, and a shared evidence index.

Review question:
- Can another student reproduce the same run without asking which IDE button was clicked?

Decision:
- Reject environment claims that lack command output or comparable logs.
## Failure Modes and Anti-Patterns

- Symptom: "It works on my machine."
  - Why it happens: Runtime versions and setup steps are undocumented.
  - How to detect it: A peer cannot run the same command.
  - How to correct it: Add version files, Docker configuration, or setup scripts.

- Symptom: Logs are readable but not analyzable.
  - Why it happens: Logs lack correlation IDs and state fields.
  - How to detect it: You cannot reconstruct the order of events.
  - How to correct it: Standardize event fields early.

- Symptom: The two stacks evolve into different systems.
  - Why it happens: Framework conventions override conceptual parity.
  - How to detect it: Object names, states, or workflows no longer match.
  - How to correct it: Maintain a shared domain model and comparison notes.

- Symptom: Evidence is scattered.
  - Why it happens: Output is captured informally.
  - How to detect it: A claim has no linked command or log.
  - How to correct it: Store evidence under predictable folders.

## Trade-Off Analysis

| Approach | Strengths | Weaknesses | When to Use |
|---|---|---|---|
| Manual local setup | Fast to start | Hard to reproduce | Early exploration only |
| Dockerized setup | Consistent across machines | Adds configuration overhead | Required when runtime drift matters |
| Shared scripts | Repeatable commands | Scripts must be maintained | Assignment demos and evidence capture |
| Structured logs | Strong failure evidence | Requires design discipline | All concurrent workflows |
| IDE-only execution | Convenient debugging | Weak as submitted evidence | Debugging, not final validation |

## Practical Application

Tomorrow morning:

- Confirm Git, Docker, both runtimes, and your editor are installed.
- Record version commands and outputs.
- Create the assignment and implementation folder structure.
- Add one run script per stack.
- Add a shared logging schema.
- Capture a "hello workflow" run in both stacks.
- Store setup evidence in the repository.

## Assignment Integration

This lecture supports [A0 - Project Selection, Environment & Integrity Packet](../../../assignments/A0/index.md). A0 requires students to choose a domain, select two stacks, set up tooling, create a repository structure, and begin the Individual Integrity Packet.

The student should demonstrate that their environment is not merely installed, but usable as an evidence-producing system. Mastery is shown by repeatable commands, clear structure, version evidence, and comparable output from both selected stacks.

## Validation and Interview Questions

1. Why is environment reproducibility especially important in a concurrency course?
2. What information must be present in a log record to analyze a race condition?
3. How would you know whether two stack implementations are still conceptually equivalent?
4. What evidence proves your setup is ready for A1?
5. When is Docker worth the overhead?
6. Why is IDE output weaker evidence than a repeatable script?
7. What part of your repository structure supports the Integrity Packet?

## Summary

The central insight is that environment setup is part of the engineering argument. If a system cannot be run, observed, and compared, its correctness claims are weak. Professional practice requires repeatable execution, structured evidence, and a repository that makes future failures easier to study rather than harder to reconstruct.

## Further Reading

- Topic: Docker for reproducible development environments
- Topic: Structured logging with JSON
- Topic: Correlation IDs in distributed systems
- Search phrase: "reproducible development environment best practices"
- Search phrase: "12 factor app logs"
