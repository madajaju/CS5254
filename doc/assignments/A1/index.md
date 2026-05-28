# A1 – Object Model Under Concurrency

**Goal:**  
Design a clean object-oriented system, implement it in **two stacks**, introduce concurrent execution, demonstrate where the design fails, and redesign it so the system preserves correctness under concurrency.

This assignment begins your semester system. You will use the lecture-provided starter system as the conceptual baseline, adapted to your selected project domain.

---

## What You Must Do

0. **Your A0 assignment should be used for this.**
   - Document the baseline system 
   - Include:
     - class/object structure
     - responsibilities
     - state transitions
     - assumed single-threaded behavior
   - Minor adaptations to your domain are allowed, but the core structure must remain recognizable.

1. **Define Your Domain Object Model**
   - Create at least **three interacting classes/objects**.
   - Identify:
     - object responsibilities
     - owned state
     - shared mutable state
     - invariants that must remain true
   - Example for podcast domain:
     - `Episode`
     - `AssetProcessor`
     - `PublishingManager`
   - Example invariant:
     - an episode cannot be marked `READY_TO_PUBLISH` until required assets are complete.

2. **Implement the Baseline System in Two Stacks**
   - Build the same object model in both selected stacks.
   - The two implementations must functionally match.
   - Include:
     - configuration file or equivalent
     - structured logging
     - simple command or endpoint to run the workflow
   - Persistence may be in memory for A1.

3. **Create a Single-Threaded Success Case**
   - Run the system in a single-threaded/sequential mode.
   - Show that the workflow behaves correctly.
   - Capture logs proving:
     - objects are created
     - state transitions occur in order
     - invariants are preserved

4. **Inject Concurrency**
   - Add a repeatable script, test, or endpoint that runs at least **5 concurrent operations** against shared state.
   - Examples:
     - five workers process the same episode
     - five users reserve the same resource
     - five processors update the same job
   - The concurrency must create real overlap, not just sequential calls.

5. **Demonstrate Failure**
   - Prove at least **two** of the following:
     - race condition
     - lost update
     - duplicate processing
     - inconsistent state
     - broken invariant
   - Evidence must include:
     - logs
     - test output
     - reproducible command/script
   - It is acceptable if the failure does not happen every run, but you must show how to reproduce or increase the likelihood.

6. **Analyze the Failure**
   - Explain:
     - what failed
     - why it failed
     - which object boundaries were insufficient
     - which state was unsafe
     - why the single-threaded design looked correct but failed under concurrency

7. **Redesign for Correctness**
   - Implement one corrective approach:
     - synchronization/locking
     - immutability
     - ownership/thread confinement
     - message passing
   - Explain the tradeoffs.
   - Re-run the concurrent test and show improved behavior.

8. **AI-Assisted Design Review**
   - Ask an AI tool to propose an object model or concurrency fix.
   - Include the prompt summary and output summary.
   - Identify at least **two flaws, risks, or missing assumptions** in the AI response.
   - Explain what you accepted, rejected, and verified.

9. **Update Your Integrity Packet**
   - Include:
     - recommendation
     - assumptions
     - evidence
     - validation
     - ownership
     - escalation path

---

## Documentation & Deliverables

In your `A1/README.md`, include:

- lecture starter system capture
- your domain object model
- diagram of objects and state transitions
- explanation of invariants
- instructions to run both implementations
- single-threaded success evidence
- concurrent failure evidence
- redesign explanation
- before/after comparison
- two-stack comparison:
  - how each stack handles concurrency
  - what was easier/harder
- AI usage log
- Integrity Packet

Your repo must include:

- code for both stacks
- runnable scripts/tests
- logs or captured output
- updated `integrity-packet/` content

---

## How You Will Be Graded

- **Lecture Baseline Capture** (10%) — accurately captures and adapts the starter system
- **Object Model Quality** (15%) — clear responsibilities, state, and invariants
- **Two Implementations Functionally Match** (15%) — both stacks implement the same behavior
- **Single-Threaded Success Case** (10%) — baseline behavior is correct and evidenced
- **Concurrency Injection** (10%) — concurrent execution is real, repeatable, and relevant
- **Failure Demonstration** (15%) — failures are observable and supported by evidence
- **Redesign & Validation** (15%) — fix is appropriate and validated
- **AI Critique & Integrity Packet** (10%) — AI usage is evaluated and packet is complete

---

## Tips & Best Practices

- Do not start by adding locks everywhere. First understand what state is unsafe.
- Logs should include correlation IDs or operation IDs.
- Keep the system small enough to reason about.
- If nothing breaks, increase concurrency, add timing variation, or add repeated runs.
- Treat the object model as the thing being tested, not just the code.
