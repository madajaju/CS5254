# State Machines


## Video: https://youtu.be/xMJGcmFjOcE
## Metadata
- Course: CS 5254b - Object-Oriented Systems Under Concurrency
- Week: 11
- Lecture: State Machines
- Duration: 15 minutes
- Prerequisites: Prior lectures on object state, concurrency pressure, structured evidence, and Integrity Packet reasoning
- Assignment Alignment: [A3](../../../assignments/A3/index.md)

## Learning Objectives
- Analyze the design pressure represented by state machines in a stateful concurrent system.
- Diagnose the hidden assumptions that allow the system to appear correct before pressure is introduced.
- Evaluate failure evidence using logs, traces, interleavings, or repeatable test output.
- Design a correction or control that preserves the relevant invariant without obscuring trade-offs.
- Defend the chosen approach in the Integrity Packet and connect it to A3 deliverables.


## Opening Narrative
A course project appears correct during a simple demonstration. Once concurrency, ambiguity, or operational pressure is introduced, the design exposes a hidden assumption about States. What must the engineer analyze and defend before trusting the result?

## Core Concepts
### States
- Definition: The set of possible conditions for an object (e.g., `DRAFT`, `CLEANING`, `PUBLISHED`).
- Why it matters: This concept identifies a condition that must be made explicit before the system can be trusted under pressure.
- Mechanism: It appears through object state, workflow timing, worker behavior, retries, queues, or coordination boundaries.
- Failure mode: If ignored, the system can pass the happy path while producing duplicate work, stale state, blocked progress, or misleading evidence.
- Design implication: The implementation should expose the relevant invariant, log the critical transition, and validate behavior with a repeatable test.

### Transitions
- Definition: The valid paths between states, triggered by specific events.
- Why it matters: This concept identifies a condition that must be made explicit before the system can be trusted under pressure.
- Mechanism: It appears through object state, workflow timing, worker behavior, retries, queues, or coordination boundaries.
- Failure mode: If ignored, the system can pass the happy path while producing duplicate work, stale state, blocked progress, or misleading evidence.
- Design implication: The implementation should expose the relevant invariant, log the critical transition, and validate behavior with a repeatable test.

### Illegal Transition Guard
- Definition: Logic that rejects an event if it doesn't match a valid transition from the current state (e.g., cannot move from `DRAFT` directly to `PUBLISHED`).
- Why it matters: This concept identifies a condition that must be made explicit before the system can be trusted under pressure.
- Mechanism: It appears through object state, workflow timing, worker behavior, retries, queues, or coordination boundaries.
- Failure mode: If ignored, the system can pass the happy path while producing duplicate work, stale state, blocked progress, or misleading evidence.
- Design implication: The implementation should expose the relevant invariant, log the critical transition, and validate behavior with a repeatable test.

### Deterministic Behavior
- Definition: Given a state and an event, the next state is always predictable.
- Why it matters: This concept identifies a condition that must be made explicit before the system can be trusted under pressure.
- Mechanism: It appears through object state, workflow timing, worker behavior, retries, queues, or coordination boundaries.
- Failure mode: If ignored, the system can pass the happy path while producing duplicate work, stale state, blocked progress, or misleading evidence.
- Design implication: The implementation should expose the relevant invariant, log the critical transition, and validate behavior with a repeatable test.

### System Invariant
- Definition: A condition that must remain true across all valid executions.
- Why it matters: This concept identifies a condition that must be made explicit before the system can be trusted under pressure.
- Mechanism: It appears through object state, workflow timing, worker behavior, retries, queues, or coordination boundaries.
- Failure mode: If ignored, the system can pass the happy path while producing duplicate work, stale state, blocked progress, or misleading evidence.
- Design implication: The implementation should expose the relevant invariant, log the critical transition, and validate behavior with a repeatable test.

## System / Architecture View
```plantuml
@startuml

skinparam shadowing false
left to right direction

rectangle "State Machines" as Topic
rectangle "States" as A
rectangle "Transitions" as B
rectangle "Illegal Transition Guard" as C
rectangle "Validation Evidence" as V
rectangle "Design Decision" as D

Topic --> A
A --> B
B --> C
C --> V
V --> D
D --> A : refine
@enduml
```

This view treats the lecture topic as a design pressure that must be connected to evidence. The system-level question is not whether the code can run once, but whether the relevant invariant still holds when timing, load, retries, or coordination complexity changes.

## Worked Example
### Problem Setup
The original lecture frames this topic with examples such as:

- **Podcast Domain**:
    - *Transition*: `INGESTED` + `CleanFinished` -> `CLEANED`.
    - *Guard*: If a `Publish` event arrives while the state is `INGESTED`, the FSM rejects it because the `CLEANED` state is a prerequisite.
- **Order System**: An order cannot be `SHIPPED` unless it is in the `PAID` state.

### Naive Implementation or Mental Model
A naive design assumes that the operation happens once, in order, and with current state. That assumption is often invisible in code because the method name sounds correct and the sequential test passes.

```text
actor performs operation
system reads current state
system applies transition
system emits side effect
```

### Failure Scenario
Under overlapping execution, delayed delivery, retry, or partial failure, the same operation can observe stale state, execute twice, arrive late, or leave the workflow stuck. The failure is not merely a bug in syntax; it is a mismatch between the design assumption and the execution model.

### Corrected or Improved Design Direction
A safer direction is to name the invariant, make the transition observable, and add a correctness control appropriate to the failure: version checks, idempotency keys, state-machine guards, explicit coordination, retries with backoff, compensation, or reconciliation.

### Why the Improved Design Is Safer
The improved design is safer because it changes the problem from hoping the workflow executes in the intended order to proving that invalid interleavings are rejected, contained, or recovered with evidence.

## Visual Model Anchors

### System Interaction
Actors:
- Episode service
- Worker A
- Worker B
- Episode record

Flow:
- Worker A reads `episode-42` as `DRAFT`
- Worker B reads the same episode before Worker A commits
- Both workers attempt the transition that starts processing

Diagram intent:
- Show the normal interaction before States is placed under pressure.

### State Transition Model
States:
- DRAFT
- PROCESSING
- READY_TO_PUBLISH
- PUBLISHED
- FAILED

Transitions:
- DRAFT -> PROCESSING: worker claims the episode
- PROCESSING -> READY_TO_PUBLISH: asset processing completes
- READY_TO_PUBLISH -> PUBLISHED: publish side effect succeeds
- PROCESSING -> FAILED: validation or processing error occurs

Invariant:
- Only one worker may own a state transition for a given episode at a time.

### Failure Interleaving
Interleaving:
T1: Worker A checks `episode.status == DRAFT`
T2: Worker B checks `episode.status == DRAFT` before Worker A writes `PROCESSING`

Failure:
- Two processing jobs start for `episode-42`, or the final log hides which worker won.

Violated invariant:
- Only one worker may own a state transition for a given episode at a time.

### Failure Scenario
Pressure:
- Two workers, repeated runs, and an artificial delay between read and write.

Observed:
- Two processing jobs start for `episode-42`, or the final log hides which worker won.

Root cause:
- The method treated check and update as one conceptual step even though execution split them apart.

Evidence:
- Thread or worker IDs, episode ID, previous state, new state, timestamp, and repeated test output.

### Design Response
Protected property:
- The episode state machine rejects stale or competing transitions.

Mechanism:
- Atomic compare-and-set, versioned update, synchronized transition method, or single-owner queue.

Trade-off:
- Less parallelism around the protected entity and more explicit transition code.

Diagram intent:
- Show the baseline path beside the corrected path and label the point where the invariant is protected.

### Evidence Flow
Claim:
- State Machines is handled when the invariant survives an intentionally bad interleaving.

Evidence:
- Thread or worker IDs, episode ID, previous state, new state, timestamp, and repeated test output.

Review question:
- Which operation is atomic, and what log line proves the losing worker was rejected?

Decision:
- Keep the simplest mechanism that protects the episode transition and produces reviewable evidence.
## Failure Modes and Anti-Patterns

- Symptom: The system passes a single happy-path demonstration.
  - Why it happens: The test avoids the timing, ordering, or pressure condition that exposes the design weakness.
  - How to detect it: Add repeated runs, concurrent actors, delayed events, structured logs, or stress conditions.
  - How to correct it: Preserve the happy-path test but add a failure-focused test that targets the invariant.

- Symptom: The explanation names a tool but not a design property.
  - Why it happens: Students focus on locks, queues, retries, or frameworks before stating what must remain true.
  - How to detect it: Ask which invariant the mechanism protects.
  - How to correct it: Write the invariant first, then select the mechanism.

- Symptom: Evidence is too vague to support the claim.
  - Why it happens: Logs lack operation IDs, entity IDs, state transitions, or timing information.
  - How to detect it: A reviewer cannot reconstruct the failure from the submitted artifact.
  - How to correct it: Capture structured evidence and link it directly to the design claim.

- Symptom: The fix changes behavior but is not compared to the baseline.
  - Why it happens: The failure was not preserved as a repeatable scenario.
  - How to detect it: There is no before/after run using the same workload.
  - How to correct it: Keep the failing test and rerun it after the redesign.

## Trade-Off Analysis

| Approach | Strengths | Weaknesses | When to Use |
|---|---|---|---|
| Simple baseline | Easy to explain and implement | Often hides timing and pressure assumptions | First implementation and comparison point |
| Guarded state transition | Protects the core invariant directly | Requires careful state modeling | Status changes, reservations, publishing, workflow steps |
| Explicit coordination | Makes dependencies visible | Can introduce waiting, deadlock, or bottlenecks | Multi-object workflows with ordering requirements |
| Idempotent or retry-safe design | Handles duplicate work and partial failure | Requires keys, deduplication, or side-effect control | Queues, retries, external calls, async workers |
| Observability-first design | Produces strong evidence for review | Adds instrumentation work | Assignments requiring failure proof and design defense |

## Practical Application

Tomorrow morning:

- Identify the invariant or progress property most relevant to state machines.
- Write one sequential scenario that should succeed.
- Write one pressure scenario that could expose the failure.
- Add operation IDs and entity IDs to the logs before running the pressure scenario.
- Capture before/after evidence if you apply a fix.
- Update the Integrity Packet with the assumption, evidence, validation, and remaining risk.

## Assignment Integration
This lecture supports [A3](../../../assignments/A3/index.md). The student should connect the lecture concept to their semester project by showing the relevant object, workflow, event, failure, or recovery mechanism in their own domain.

Mastery should be demonstrated with concrete evidence: runnable commands, structured logs, before/after behavior, diagrams, failure reproduction, and an Integrity Packet explanation that defends the design choice.

## Validation and Interview Questions

1. What invariant or progress property is most relevant to this lecture?
2. What hidden assumption would make the baseline design appear correct?
3. How would you force the failure in a repeatable test?
4. What evidence would prove the failure occurred?
5. Which design mechanism would you choose first, and what trade-off does it introduce?
6. How would the same issue appear differently in your two implementation stacks?
7. What would you record in the Integrity Packet to defend your conclusion?

## Summary

The central insight is that state machines is not just a vocabulary item; it is a way to reason about whether a system remains correct under realistic execution. The professional engineering task is to connect the concept to invariants, observable behavior, and defensible trade-offs. A design is not mature until it can be explained, stressed, repaired, and validated with evidence.

## Further Reading
- Search phrase: "State Machines distributed systems failure mode"
- Search phrase: "State Machines concurrency design tradeoffs"
- Topic: structured logging and correlation IDs
- Topic: invariants in stateful object-oriented systems
- Topic: message queues, idempotency, and event ordering
