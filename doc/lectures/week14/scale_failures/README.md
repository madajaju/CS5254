# Where Systems Break at Scale

## Metadata
- Course: CS 5254b - Object-Oriented Systems Under Concurrency
- Week: 14
- Lecture: Where Systems Break at Scale
- Duration: 15 minutes
- Prerequisites: Prior lectures on object state, concurrency pressure, structured evidence, and Integrity Packet reasoning
- Assignment Alignment: [A4](../../../assignments/A4/index.md)

## Learning Objectives
- Analyze the design pressure represented by where systems break at scale in a stateful concurrent system.
- Diagnose the hidden assumptions that allow the system to appear correct before pressure is introduced.
- Evaluate failure evidence using logs, traces, interleavings, or repeatable test output.
- Design a correction or control that preserves the relevant invariant without obscuring trade-offs.
- Defend the chosen approach in the Integrity Packet and connect it to A4 deliverables.


## Opening Narrative
The system passes every functional test with one workflow. Under load, queues grow, logs interleave, timeouts appear, and the same invariant that looked stable starts failing intermittently. The failure was not created by scale; scale made it observable. How do we design and measure systems when pressure changes behavior?

## Core Concepts
### Linear vs. Non-Linear Scalling
- Definition: When doubling the work more than doubles the time or resources required.
- Why it matters: This concept identifies a condition that must be made explicit before the system can be trusted under pressure.
- Mechanism: It appears through object state, workflow timing, worker behavior, retries, queues, or coordination boundaries.
- Failure mode: If ignored, the system can pass the happy path while producing duplicate work, stale state, blocked progress, or misleading evidence.
- Design implication: The implementation should expose the relevant invariant, log the critical transition, and validate behavior with a repeatable test.

### Single Point of Contention
- Definition: A shared resource (like a global lock or a single database row) that every worker must wait for.
- Why it matters: This concept identifies a condition that must be made explicit before the system can be trusted under pressure.
- Mechanism: It appears through object state, workflow timing, worker behavior, retries, queues, or coordination boundaries.
- Failure mode: If ignored, the system can pass the happy path while producing duplicate work, stale state, blocked progress, or misleading evidence.
- Design implication: The implementation should expose the relevant invariant, log the critical transition, and validate behavior with a repeatable test.

### Resource Exhaustion
- Definition: Running out of file handles, sockets, or memory due to too many "In-Flight" async tasks.
- Why it matters: This concept identifies a condition that must be made explicit before the system can be trusted under pressure.
- Mechanism: It appears through object state, workflow timing, worker behavior, retries, queues, or coordination boundaries.
- Failure mode: If ignored, the system can pass the happy path while producing duplicate work, stale state, blocked progress, or misleading evidence.
- Design implication: The implementation should expose the relevant invariant, log the critical transition, and validate behavior with a repeatable test.

### Operational Pressure
- Definition: Load, latency, volume, or failure conditions that reveal hidden system limits.
- Why it matters: This concept identifies a condition that must be made explicit before the system can be trusted under pressure.
- Mechanism: It appears through object state, workflow timing, worker behavior, retries, queues, or coordination boundaries.
- Failure mode: If ignored, the system can pass the happy path while producing duplicate work, stale state, blocked progress, or misleading evidence.
- Design implication: The implementation should expose the relevant invariant, log the critical transition, and validate behavior with a repeatable test.

### Saturation
- Definition: The point where adding more work causes queues, latency, or failures to grow.
- Why it matters: This concept identifies a condition that must be made explicit before the system can be trusted under pressure.
- Mechanism: It appears through object state, workflow timing, worker behavior, retries, queues, or coordination boundaries.
- Failure mode: If ignored, the system can pass the happy path while producing duplicate work, stale state, blocked progress, or misleading evidence.
- Design implication: The implementation should expose the relevant invariant, log the critical transition, and validate behavior with a repeatable test.

## System / Architecture View
```plantuml
@startuml
skinparam monochrome true
skinparam shadowing false
left to right direction

rectangle "Where Systems Break at Scale" as Topic
rectangle "Linear vs. Non-Linear Scalling" as A
rectangle "Single Point of Contention" as B
rectangle "Resource Exhaustion" as C
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
    - *Limit*: Your system stores all `Episode` objects in a single `List` in memory.
    - *Break Point*: At 1,000,000 episodes, the system crashes with `OutOfMemoryError` or search time becomes unusable.
- **Order System**: A central database lock on the `Inventory` table that prevents more than 50 orders per second regardless of how many workers you add.

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
- Load driver
- API gateway
- Worker pool
- Database
- Metrics and log store

Flow:
- Load driver sends concurrent podcast or order workflow requests
- API gateway assigns correlation IDs and forwards work
- Worker pool processes state transitions while metrics and logs capture latency, errors, and retries

Diagram intent:
- Show the normal interaction before Linear vs. Non-Linear Scalling is placed under pressure.

### State Transition Model
States:
- HEALTHY
- SATURATED
- DEGRADED
- RECOVERING
- STABLE

Transitions:
- HEALTHY -> SATURATED: request rate exceeds worker capacity
- SATURATED -> DEGRADED: queue depth and p95 latency cross threshold
- DEGRADED -> RECOVERING: load is reduced or backpressure starts
- RECOVERING -> STABLE: error rate and queue depth return to baseline

Invariant:
- The system either completes accepted work or exposes bounded degradation with enough evidence to recover.

### Failure Interleaving
Interleaving:
T1: Load test pushes 200 concurrent publish requests
T2: Worker pool retries slow database writes while the queue keeps accepting new work

Failure:
- Latency spikes, duplicate work, missing completion logs, or unbounded queue growth.

Violated invariant:
- The system either completes accepted work or exposes bounded degradation with enough evidence to recover.

### Failure Scenario
Pressure:
- Sustained load, partial database slowdown, and retry storms during recovery.

Observed:
- Latency spikes, duplicate work, missing completion logs, or unbounded queue growth.

Root cause:
- The baseline design assumed normal load and treated failure evidence as optional.

Evidence:
- Load profile, p50/p95/p99 latency, queue depth, retry counts, error logs, and recovery timeline.

### Design Response
Protected property:
- System integrity remains explainable when capacity, timing, or dependencies fail.

Mechanism:
- Backpressure, bounded retries, circuit breakers, compensation, reconciliation, and evidence dashboards.

Trade-off:
- Reduced peak throughput or delayed work in exchange for controlled recovery.

Diagram intent:
- Show the baseline path beside the corrected path and label the point where the invariant is protected.

### Evidence Flow
Claim:
- Where Systems Break at Scale is defensible when the design shows both the failure and the recovery path with measurements.

Evidence:
- Load profile, p50/p95/p99 latency, queue depth, retry counts, error logs, and recovery timeline.

Review question:
- Which metric tells you the system is degraded but still controlled?

Decision:
- Accept a design only when its stress evidence includes baseline, failure, correction, and residual risk.
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

- Identify the invariant or progress property most relevant to where systems break at scale.
- Write one sequential scenario that should succeed.
- Write one pressure scenario that could expose the failure.
- Add operation IDs and entity IDs to the logs before running the pressure scenario.
- Capture before/after evidence if you apply a fix.
- Update the Integrity Packet with the assumption, evidence, validation, and remaining risk.

## Assignment Integration
This lecture supports [A4](../../../assignments/A4/index.md). The student should connect the lecture concept to their semester project by showing the relevant object, workflow, event, failure, or recovery mechanism in their own domain.

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

The central insight is that where systems break at scale is not just a vocabulary item; it is a way to reason about whether a system remains correct under realistic execution. The professional engineering task is to connect the concept to invariants, observable behavior, and defensible trade-offs. A design is not mature until it can be explained, stressed, repaired, and validated with evidence.

## Further Reading
- Search phrase: "Where Systems Break at Scale distributed systems failure mode"
- Search phrase: "Where Systems Break at Scale concurrency design tradeoffs"
- Topic: structured logging and correlation IDs
- Topic: invariants in stateful object-oriented systems
- Topic: resilience engineering, recovery, and load testing
