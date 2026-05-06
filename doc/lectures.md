# CS 5254b — Lecture Plan (Object-Oriented Systems Under Concurrency)

This document outlines the lecture sequence for the course.  
Each week includes **4–6 focused lectures (~15 minutes each)** designed to:

- introduce a concept
- expose failure
- explain the pattern
- enable assignment progress

The lectures are tightly aligned with **A0–A4 assignments** and follow the model:

> Design → Break → Understand → Fix → Validate

---

# WEEK 1 — Foundations (A0)

## Goal
Students can:
- choose a valid system domain
- define their system
- set up environment
- create their Integrity Packet
- understand AI usage expectations

---

### Lectures

**1. Course Model: Design Under Pressure**
- Why OO systems fail under concurrency
- What this course is really teaching
- How assignments build on each other

**2. What Makes a “Good System” for This Course**
- Shared state
- Multi-step workflows
- Failure potential
- Examples (podcast, order, job systems)

**3. The Integrity Packet**
- Purpose and structure
- Each field explained
- Example (good vs weak)

**4. AI as a Thinking Partner**
- Where AI helps
- Where AI fails (especially concurrency)
- Verification discipline

**5. Two-Stack Strategy**
- Why compare runtimes
- Differences across Java, Node, Python, Go

**6. Environment & Repo Structure**
- Expected repo layout
- Docker, logging, and execution basics

---

# WEEK 2 — Object Model (A1 Part 1)

## Goal
Students can:
- design clean object models
- define state and invariants
- implement baseline system

---

### Lectures

**1. The Illusion of Correctness**
- Why single-threaded systems appear correct
- Hidden assumptions

**2. Object Boundaries & Responsibilities**
- What belongs in an object
- Common mistakes

**3. State & Invariants**
- Defining correctness
- Examples of invariant violations

**4. Starter System Walkthrough (Lecture System)**
- Objects and responsibilities
- Intended flaws

**5. Structured Logging & Observability**
- Correlation IDs
- How to trace behavior

**6. Two-Stack Implementation Strategy**
- Maintaining parity across stacks

---

# WEEK 3 — Concurrency Injection (A1 Part 2)

## Goal
Students can:
- introduce concurrency
- expose race conditions
- observe system failure

---

### Lectures

**1. What is Concurrency Really?**
- Interleaving vs parallelism

**2. Race Conditions Step-by-Step**
- Visual examples
- Timeline analysis

**3. Shared State is the Problem**
- Why mutable state breaks systems

**4. How to Force Failure**
- Concurrent test strategies
- Injecting delays and overlap

**5. Debugging Concurrency with Logs**
- Identifying anomalies
- Reading interleaved logs

**6. Why Locks Are Not the First Answer**
- Design vs patching

---

# WEEK 4 — Fixing Concurrency (A1 Part 3)

## Goal
Students can:
- redesign object model
- apply concurrency-safe patterns
- validate fixes

---

### Lectures

**1. Three Ways to Fix Concurrency**
- Locks
- Immutability
- Message passing

**2. Tradeoffs**
- Performance vs simplicity vs correctness

**3. Object Ownership & Thread Confinement**
- Keeping state safe

**4. AI-Generated Designs**
- Common mistakes
- Missing assumptions

**5. Validating the Fix**
- Re-running tests
- Proving correctness

---

# WEEK 5 — Coordination (A2 Part 1)

## Goal
Students can:
- design workflows
- coordinate multiple objects

---

### Lectures

**1. From Objects to Workflows**
- Why coordination is needed

**2. Coordination Patterns**
- Centralized vs distributed

**3. Ordering Constraints**
- Dependencies between steps

**4. Synchronization Mechanisms**
- Locks, signals, queues

**5. Workflow Design Example**
- Podcast/order system walkthrough

---

# WEEK 6 — Coordination Failures (A2 Part 2)

## Goal
Students can:
- detect coordination issues
- understand deadlocks and timing problems

---

### Lectures

**1. Deadlocks Explained**
- Circular wait
- Resource locking

**2. Missed Signals**
- Timing-based failures

**3. Livelock vs Deadlock**
- Differences and examples

**4. Testing Coordination**
- Forcing edge cases

**5. Fixing Coordination**
- Design improvements

---

# WEEK 7 — Coordination Tradeoffs (A2 Part 3)

## Goal
Students can:
- compare coordination approaches
- select appropriate designs

---

### Lectures

**1. Centralized vs Distributed Coordination**
- Pros and cons

**2. Blocking vs Non-Blocking Coordination**

**3. Simplicity vs Scalability**

**4. AI Coordination Designs**
- Critique and validation

---

# WEEK 8 — Midterm

## Goal
Students can:
- reason about system behavior
- identify failures and tradeoffs

---

### Lectures

**1. System Reasoning Walkthrough**
- Analyze a system live

**2. Common Failure Patterns**
- Review and synthesis

**3. Midterm Preparation**
- How to think, not memorize

---

# WEEK 9 — Async Systems (A3 Part 1)

## Goal
Students can:
- understand async models
- identify blocking issues

---

### Lectures

**1. Blocking is the Enemy of Scale**

**2. Async Models Across Languages**
- Node, Python, Go, Java

**3. Events, Queues, Workers**

**4. Designing Async Systems**

---

# WEEK 10 — Async Failures (A3 Part 2)

## Goal
Students can:
- identify async failure modes

---

### Lectures

**1. Duplicate Execution**

**2. Out-of-Order Events**

**3. Lost Messages**

**4. Retry Side Effects**

---

# WEEK 11 — Async Correctness (A3 Part 3)

## Goal
Students can:
- stabilize async systems

---

### Lectures

**1. Idempotency**

**2. Event Ordering**

**3. State Machines**

**4. Debugging Async Systems**

---

# WEEK 12 — System Stress (A4 Part 1)

## Goal
Students can:
- test systems under load

---

### Lectures

**1. What is System Stress?**

**2. Load Testing Basics**

**3. Observability Under Stress**

---

# WEEK 13 — Failure Handling (A4 Part 2)

## Goal
Students can:
- design for partial failure

---

### Lectures

**1. Failure is Normal**

**2. Retries, Compensation, Dead Letter Queues**

**3. Designing for Recovery**

---

# WEEK 14 — Final System & Defense (A4 Part 3)

## Goal
Students can:
- defend system design
- explain correctness under pressure

---

### Lectures

**1. System Integrity Under Pressure**

**2. Where Systems Break at Scale**

**3. Defending Your Design**

**4. AI Final Review**
- What AI missed
- What you validated

---

# Summary

This lecture plan ensures:

- Every concept directly supports an assignment
- Students learn by **breaking and fixing systems**
- Concurrency, OO design, async behavior, and AI usage are fully integrated
- The course progresses from **simple → complex → realistic**

---