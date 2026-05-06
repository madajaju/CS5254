# A2 – Coordinated Object Systems

**Goal:**  
Extend your A1 system into a coordinated multi-object workflow where objects depend on one another, operations must occur in a valid order, and coordination failures can be observed, analyzed, and corrected.

A2 is not a new project. It must build directly on your A1 system and incorporate feedback from A1.

---

## What You Must Do

0. **Carry Forward Your A1 System**
   - Use your A1 redesigned system as the starting point.
   - Document:
     - what you kept
     - what you changed
     - what feedback you incorporated
   - You may not restart with a new system.

1. **Add a Multi-Step Coordinated Workflow**
   - Add at least **three workflow stages** that must occur in order.
   - At least two objects/components must coordinate.
   - Example podcast workflow:
     - ingest audio
     - generate transcript
     - render video
     - publish episode
   - Example order workflow:
     - validate order
     - reserve inventory
     - process payment
     - fulfill shipment

2. **Define Coordination Rules**
   - Write explicit rules such as:
     - Stage B cannot start until Stage A completes.
     - Publishing cannot occur until all required assets are complete.
     - A reservation expires if confirmation does not occur in time.
   - Identify the object or component responsible for enforcing each rule.

3. **Implement Coordination in Two Stacks**
   - Implement the coordinated workflow in both selected stacks.
   - Use at least one coordination mechanism:
     - locks
     - condition variables/signals
     - queues
     - semaphores
     - futures/promises
     - channels
   - The two implementations must be comparable.

4. **Create Coordination Tests**
   - Write tests or scripts that:
     - run multiple workflows concurrently
     - attempt out-of-order execution
     - attempt duplicate execution
     - simulate delayed completion of a stage

5. **Demonstrate Coordination Failure**
   - Intentionally demonstrate at least **one** of the following:
     - out-of-order execution
     - missed signal
     - deadlock
     - livelock
     - duplicate completion
     - premature finalization
   - Evidence must include logs, traces, or test output.

6. **Analyze Failure**
   - Explain:
     - what coordination rule failed
     - why the failure occurred
     - whether the root cause was object design, synchronization, lifecycle, or state ownership
     - why the failure matters

7. **Repair the Coordination Design**
   - Implement a corrected coordination strategy.
   - Show before/after evidence.
   - Explain why the corrected design is safer.

8. **Compare Two Coordination Strategies**
   - Compare your chosen strategy with at least one alternative.
   - Example comparisons:
     - lock-based coordinator vs queue-based coordinator
     - shared-state workflow vs message-driven workflow
     - blocking coordination vs future/promise coordination
   - Explain tradeoffs in complexity, correctness, and maintainability.

9. **AI-Assisted Coordination Review**
   - Ask AI to design or fix the coordination workflow.
   - Identify at least two issues, risks, or missing assumptions.
   - Explain how you validated or rejected the AI suggestion.

10. **Update Your Integrity Packet**
   - Include the new recommendation, assumptions, evidence, validation, ownership, and escalation path.

---

## Documentation & Deliverables

In your `A2/README.md`, include:

- summary of how A1 evolved into A2
- coordinated workflow diagram
- coordination rules
- explanation of coordination mechanism used in each stack
- tests/scripts used to exercise coordination
- failure evidence
- corrected design
- comparison of two coordination strategies
- AI usage log
- updated Integrity Packet
- instructions to run both implementations

Your repo must include:

- code for both stacks
- test scripts
- logs or captured output
- updated documentation

---

## How You Will Be Graded

- **Continuity from A1** (10%) — clearly evolves prior system and incorporates feedback
- **Workflow & Coordination Rules** (15%) — rules are explicit, meaningful, and domain-relevant
- **Two Implementations Functionally Match** (15%) — both stacks implement comparable workflows
- **Coordination Tests** (15%) — tests exercise ordering, concurrency, and edge cases
- **Failure Demonstration** (15%) — coordination failure is observable and well-evidenced
- **Repair & Validation** (15%) — corrected strategy is implemented and validated
- **Strategy Comparison** (10%) — tradeoffs are clearly analyzed
- **AI Critique & Integrity Packet** (5%) — AI usage is evaluated and packet is complete

---

## Tips & Best Practices

- Coordination failures often hide in timing. Add delays intentionally to expose them.
- Do not bury coordination logic everywhere; make ownership clear.
- A central coordinator is simpler, but may become a bottleneck.
- Message-driven workflows reduce direct coupling but introduce ordering complexity.
