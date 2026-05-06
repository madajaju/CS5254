# A3 – Asynchronous Object Systems

**Goal:**  
Transform your A2 coordinated system into an asynchronous or event-driven object system. Compare the blocking/coordinated design with the asynchronous design, demonstrate new failure modes, and validate correctness under asynchronous execution.

A3 must evolve your A2 system. You are not starting over.

---

## What You Must Do

0. **Carry Forward Your A2 System**
   - Use your corrected A2 system as the baseline.
   - Document which workflow stages will become asynchronous.
   - Preserve the same domain and core object responsibilities unless redesigning intentionally.

1. **Identify Blocking Interactions**
   - Identify at least **two** blocking or tightly coupled interactions in your A2 system.
   - Explain why these interactions limit scalability, responsiveness, or maintainability.

2. **Design an Asynchronous Architecture**
   - Introduce asynchronous execution using one or more:
     - event queue
     - task queue
     - futures/promises
     - async/await
     - channels
     - callbacks
     - background workers
   - Define:
     - event/message types
     - producer objects
     - consumer objects
     - state transitions
     - retry behavior

3. **Implement the Async Design in Two Stacks**
   - Implement comparable async behavior in both selected stacks.
   - Each stack must include:
     - async execution path
     - logging with operation/correlation IDs
     - a way to observe task/event status
   - You may use in-memory queues for this assignment.

4. **Preserve a Blocking Baseline**
   - Keep or document the A2 blocking/coordinated version.
   - You must be able to compare blocking vs async behavior.

5. **Create Async Execution Tests**
   - Write scripts/tests that:
     - submit multiple workflows
     - process tasks asynchronously
     - introduce delays
     - retry failed tasks
     - show final state

6. **Demonstrate Async Failure Modes**
   - Demonstrate at least **two**:
     - duplicate event processing
     - out-of-order event handling
     - lost event/message
     - retry causing duplicate side effects
     - stale state read
     - task completes after object is no longer valid
   - Provide logs or test output.

7. **Add Correctness Controls**
   - Add at least one control:
     - idempotency key
     - event sequencing
     - status guard
     - retry limit
     - deduplication
     - state machine
   - Show that the control reduces or eliminates the demonstrated failure.

8. **Compare Blocking vs Async**
   - Compare:
     - correctness
     - complexity
     - throughput/responsiveness
     - debugging difficulty
     - object model clarity
   - Include simple timing or throughput evidence if feasible.

9. **AI-Assisted Async Review**
   - Ask AI to convert or review your design.
   - Identify at least two risks in the AI proposal.
   - Explain what you accepted, rejected, and verified.

10. **Update Your Integrity Packet**
   - Include the async design recommendation and validation evidence.

---

## Documentation & Deliverables

In your `A3/README.md`, include:

- summary of how A2 evolved into A3
- blocking interaction analysis
- async architecture diagram
- event/message definitions
- instructions to run both implementations
- async test evidence
- demonstrated failure modes
- correctness controls
- blocking vs async comparison
- AI usage log
- updated Integrity Packet

Your repo must include:

- both stack implementations
- async test scripts
- logs or captured output
- updated documentation

---

## How You Will Be Graded

- **Continuity from A2** (10%) — evolves prior system rather than restarting
- **Async Architecture Design** (15%) — events/tasks, producers, consumers, and state transitions are clear
- **Two Implementations Functionally Match** (15%) — both stacks implement comparable async behavior
- **Async Tests & Evidence** (15%) — tests exercise async behavior under load/delay/retry
- **Failure Demonstration** (15%) — async-specific failures are observable and explained
- **Correctness Controls** (15%) — controls are appropriate and validated
- **Blocking vs Async Comparison** (10%) — tradeoffs are grounded in evidence
- **AI Critique & Integrity Packet** (5%) — AI usage is evaluated and packet is complete

---

## Tips & Best Practices

- Async does not automatically make systems correct or faster.
- Duplicate messages are normal in many real systems; design for them.
- Add operation IDs early.
- A state machine can make async behavior easier to reason about.
