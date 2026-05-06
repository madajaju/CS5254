# Deadlocks Explained

## Metadata
- Course: CS 5254b - Object-Oriented Systems Under Concurrency
- Week: 6
- Lecture: Deadlocks Explained
- Duration: 15 minutes
- Prerequisites: Prior lectures on object state, concurrency pressure, structured evidence, and Integrity Packet reasoning
- Assignment Alignment: [A2](../../../assignments/A2/index.md)

## Learning Objectives
- Analyze the design pressure represented by deadlocks explained in a stateful concurrent system.
- Diagnose the hidden assumptions that allow the system to appear correct before pressure is introduced.
- Evaluate failure evidence using logs, traces, interleavings, or repeatable test output.
- Design a correction or control that preserves the relevant invariant without obscuring trade-offs.
- Defend the chosen approach in the Integrity Packet and connect it to A2 deliverables.


## Opening Narrative
A student asks AI for a coordination design and receives confident code with a missing ordering guard. The answer is useful as a draft, but unsafe as evidence. Under concurrent execution the workflow stalls or violates an invariant. How should engineers use AI-generated designs without surrendering responsibility for correctness?

## Core Concepts
### Deadlock
- Definition: A state where two or more threads are waiting for each other to release resources, and none can proceed.
- Why it matters: This concept identifies a condition that must be made explicit before the system can be trusted under pressure.
- Mechanism: It appears through object state, workflow timing, worker behavior, retries, queues, or coordination boundaries.
- Failure mode: If ignored, the system can pass the happy path while producing duplicate work, stale state, blocked progress, or misleading evidence.
- Design implication: The implementation should expose the relevant invariant, log the critical transition, and validate behavior with a repeatable test.

### The Four Conditions (Coffman Conditions)
- Definition: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.
- Why it matters: This concept identifies a condition that must be made explicit before the system can be trusted under pressure.
- Mechanism: It appears through object state, workflow timing, worker behavior, retries, queues, or coordination boundaries.
- Failure mode: If ignored, the system can pass the happy path while producing duplicate work, stale state, blocked progress, or misleading evidence.
- Design implication: The implementation should expose the relevant invariant, log the critical transition, and validate behavior with a repeatable test.

### Circular Wait
- Definition: Thread A holds Resource 1 and waits for Resource 2; Thread B holds Resource 2 and waits for Resource 1.
- Why it matters: This concept identifies a condition that must be made explicit before the system can be trusted under pressure.
- Mechanism: It appears through object state, workflow timing, worker behavior, retries, queues, or coordination boundaries.
- Failure mode: If ignored, the system can pass the happy path while producing duplicate work, stale state, blocked progress, or misleading evidence.
- Design implication: The implementation should expose the relevant invariant, log the critical transition, and validate behavior with a repeatable test.

### Coordination Boundary
- Definition: The point where independent objects must agree on ordering, ownership, or progress.
- Why it matters: This concept identifies a condition that must be made explicit before the system can be trusted under pressure.
- Mechanism: It appears through object state, workflow timing, worker behavior, retries, queues, or coordination boundaries.
- Failure mode: If ignored, the system can pass the happy path while producing duplicate work, stale state, blocked progress, or misleading evidence.
- Design implication: The implementation should expose the relevant invariant, log the critical transition, and validate behavior with a repeatable test.

### Progress Guarantee
- Definition: A property showing that work eventually completes instead of waiting forever.
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

rectangle "Deadlocks Explained" as Topic
rectangle "Deadlock" as A
rectangle "The Four Conditions (Coffman Conditions)" as B
rectangle "Circular Wait" as C
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
    - *Scenario*: Thread 1 locks `Episode-A` to add a transcript and then tries to lock `Episode-B` to link them. Simultaneously, Thread 2 locks `Episode-B` and tries to lock `Episode-A`.
- **Order System**: Thread 1 locks `Inventory` then `Payment`. Thread 2 locks `Payment` then `Inventory`.

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
- Order API
- Workflow coordinator
- Inventory service
- Payment service
- Shipping worker

Flow:
- Order API creates `order-42` and requests inventory reservation
- Coordinator waits for inventory before charging payment
- Shipping worker runs only after payment and reservation are both confirmed

Diagram intent:
- Show the normal interaction before Deadlock is placed under pressure.

### State Transition Model
States:
- CREATED
- RESERVED
- PAID
- READY_TO_SHIP
- SHIPPED
- COMPENSATING

Transitions:
- CREATED -> RESERVED: inventory hold succeeds
- RESERVED -> PAID: payment capture succeeds
- PAID -> READY_TO_SHIP: coordinator observes both prerequisites
- READY_TO_SHIP -> SHIPPED: shipping worker emits one shipment

Invariant:
- An order is shipped only after inventory is reserved and payment is captured exactly once.

### Failure Interleaving
Interleaving:
T1: Coordinator waits for payment confirmation while holding the inventory lock
T2: Payment callback waits for inventory status while holding the payment lock

Failure:
- Order remains stuck or ships without one prerequisite being visible in the log.

Violated invariant:
- An order is shipped only after inventory is reserved and payment is captured exactly once.

### Failure Scenario
Pressure:
- Concurrent orders, delayed callbacks, and workers processing workflow steps out of order.

Observed:
- Order remains stuck or ships without one prerequisite being visible in the log.

Root cause:
- The design assumed workflow steps would be observed in the same order they were requested.

Evidence:
- Order timeline with correlation ID, lock or wait graph, state transition log, and before/after test run.

### Design Response
Protected property:
- Workflow progress and prerequisite ordering remain explicit under concurrent execution.

Mechanism:
- State-machine guards, ordered acquisition, timeout handling, and compensation for failed prerequisites.

Trade-off:
- More workflow metadata and recovery paths to maintain.

Diagram intent:
- Show the baseline path beside the corrected path and label the point where the invariant is protected.

### Evidence Flow
Claim:
- Deadlocks Explained is correctly handled when the order workflow preserves prerequisites and progress under pressure.

Evidence:
- Order timeline with correlation ID, lock or wait graph, state transition log, and before/after test run.

Review question:
- What exact state proves the workflow is allowed to move to the next step?

Decision:
- Add the guard or coordination rule closest to the state transition that can violate the invariant.
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

- Identify the invariant or progress property most relevant to deadlocks explained.
- Write one sequential scenario that should succeed.
- Write one pressure scenario that could expose the failure.
- Add operation IDs and entity IDs to the logs before running the pressure scenario.
- Capture before/after evidence if you apply a fix.
- Update the Integrity Packet with the assumption, evidence, validation, and remaining risk.

## Assignment Integration
This lecture supports [A2](../../../assignments/A2/index.md). The student should connect the lecture concept to their semester project by showing the relevant object, workflow, event, failure, or recovery mechanism in their own domain.

Mastery should be demonstrated with concrete evidence: runnable commands, structured logs, before/after behavior, diagrams, failure reproduction, and an Integrity Packet explanation that defends the design choice.

Original assignment note preserved:

- **A2 Alignment**: Part 5 of A2 requires you to "demonstrate coordination failure," and Deadlock is one of the primary options. This lecture shows you how to design a scenario where your system intentionally free

## Validation and Interview Questions

1. What invariant or progress property is most relevant to this lecture?
2. What hidden assumption would make the baseline design appear correct?
3. How would you force the failure in a repeatable test?
4. What evidence would prove the failure occurred?
5. Which design mechanism would you choose first, and what trade-off does it introduce?
6. How would the same issue appear differently in your two implementation stacks?
7. What would you record in the Integrity Packet to defend your conclusion?

## Summary

The central insight is that deadlocks explained is not just a vocabulary item; it is a way to reason about whether a system remains correct under realistic execution. The professional engineering task is to connect the concept to invariants, observable behavior, and defensible trade-offs. A design is not mature until it can be explained, stressed, repaired, and validated with evidence.

## Further Reading
- Search phrase: "Deadlocks Explained distributed systems failure mode"
- Search phrase: "Deadlocks Explained concurrency design tradeoffs"
- Topic: structured logging and correlation IDs
- Topic: invariants in stateful object-oriented systems
- Topic: coordination patterns, deadlocks, and progress guarantees
