# A4 – Capstone System Under Stress

**Goal:**  
Deliver a final object-oriented system that preserves correctness under concurrency, asynchronous execution, partial failure, and runtime differences. You will validate the system, document its limits, and defend your design.

A4 is the culmination of A1–A3. It must extend your A3 system.

---

## What You Must Do

0. **Carry Forward Your A3 System**
   - Use your A3 async system as the baseline.
   - Document:
     - what remains from A1, A2, and A3
     - what was redesigned
     - what feedback was incorporated
   - You may not restart.

1. **Finalize the System Architecture**
   - Your final system must include:
     - at least three major objects/components
     - shared or coordinated state
     - concurrent operations
     - asynchronous processing
     - failure handling
     - observable system status
   - Create an architecture diagram showing:
     - major objects/components
     - concurrency boundaries
     - async/event boundaries
     - data/state ownership
     - failure/retry paths

2. **Add Stress Conditions**
   - Create a repeatable stress script or test.
   - It must include:
     - at least **10 concurrent operations**
     - asynchronous task execution
     - multiple objects/components interacting
   - Capture logs or metrics.

3. **Inject Partial Failures**
   - Simulate at least **two** failure types:
     - worker failure
     - task timeout
     - external service failure
     - duplicate message
     - lost message
     - invalid state transition
     - retry exhaustion
   - Show how the system responds.

4. **Implement Recovery or Containment**
   - Add mechanisms such as:
     - retry with limit
     - compensation step
     - dead-letter queue/list
     - state rollback
     - idempotency
     - failure status
     - alert/log escalation
   - Explain what is recovered vs what is contained.

5. **Compare Runtime Differences**
   - Compare your two stacks under final system behavior.
   - Discuss:
     - concurrency model
     - async model
     - debugging experience
     - performance/responsiveness
     - correctness risks
   - Include evidence where possible.

6. **Validation Suite**
   - Provide a validation script or test suite that demonstrates:
     - normal success path
     - concurrent path
     - async path
     - failure path
     - recovery/containment path
   - The validation should be runnable by the instructor.

7. **Final Integrity Packet**
   - Produce a final Integrity Packet that includes:
     - final design recommendation
     - major assumptions
     - evidence summary
     - validation results
     - ownership
     - escalation path
   - Include where the system would fail at larger scale.

8. **AI-Assisted Final Review**
   - Ask AI to review your final architecture.
   - Ask AI to identify risks or hidden concurrency issues.
   - Document:
     - what AI found
     - what AI missed
     - what you verified
     - what you rejected

9. **Prepare a System Defense**
   - Prepare a short presentation or defense document covering:
     - system architecture
     - key design decisions
     - failure modes
     - validation evidence
     - AI usage
     - what you would improve next

---

## Documentation & Deliverables

In your `A4/README.md`, include:

- system evolution summary from A1–A4
- final architecture diagram
- concurrency and async boundaries
- stress test instructions
- failure injection evidence
- recovery/containment explanation
- two-stack comparison
- validation suite instructions
- final Integrity Packet
- AI usage log
- system defense slides or notes

Your repo must include:

- final code in both stacks
- runnable validation scripts
- logs or captured output
- diagrams
- final packet and defense materials

---

## How You Will Be Graded

- **System Continuity & Evolution** (10%) — final system clearly builds from A1–A3
- **Architecture Quality** (15%) — object boundaries, state ownership, concurrency, and async design are clear
- **Stress Execution** (15%) — system is tested under meaningful concurrent load
- **Partial Failure Handling** (15%) — failures are injected and handled with evidence
- **Validation Suite** (15%) — instructor can run or inspect validation of key paths
- **Two-Stack Runtime Comparison** (10%) — comparison is grounded in actual implementation experience
- **Final Integrity Packet** (10%) — complete, specific, and evidence-based
- **System Defense & AI Review** (10%) — design can be explained, defended, and critiqued

---

## Tips & Best Practices

- Do not hide failures. A well-contained failure is better than a fake success.
- Make validation easy to run.
- Keep the final architecture understandable.
- Your defense should explain why the system holds, not just what it does.
- The final packet should make your reasoning transferable to another engineer.
