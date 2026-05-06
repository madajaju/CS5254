# Vanderbilt University – School of Engineering

## CS 5891b – Object-Oriented Systems Under Concurrency

**Instructor:** Dr. Darren Pulsipher  
**Meeting Time:** Thursdays, 5:00–6:15 PM CT (Online via Zoom)  
**Office Hours:** Thursdays, 6:15–7:00 PM CT  
**Semester:** Summer 2026 (May 4 – August 6)

---

## Course Description

This course explores how **object-oriented systems behave under real-world conditions**, where concurrency, asynchrony, and uncertainty expose weaknesses in design.

The course is **design-first and stress-driven**:

> We begin with object-oriented designs — then subject them to concurrency pressure to reveal their strengths and failures.

Students will learn how to design systems that are:

- **correct under concurrency**
- **resilient under load and failure**
- **maintainable as complexity grows**
- **composed of reusable concurrent components**

Examples and implementations span multiple environments:

- Java (threads, locks, concurrent libraries)
- Python (threading, asyncio)
- Node.js (event loop, promises)
- Go (goroutines, channels)

Students will implement and compare designs across at least **two environments**.

---

## Instructor Philosophy

Modern engineers must design systems that **hold under pressure**, not just pass tests.

This course simulates real engineering practice:

- designing object models
- observing how they fail under concurrency
- refining designs under stress
- building reusable components
- validating correctness under uncertainty
- using AI as a thinking partner—not a substitute

> The goal is not to produce correct code once.  
> The goal is to produce systems that remain correct as conditions change.

---

## Skill Development Model

This course develops four integrated capabilities:

- **SME Skills:**  
  Concurrency mechanisms (threads, locks, atomic operations), synchronization, coordination, and system behavior

- **Core Skills:**  
  Object-oriented design, abstraction, encapsulation, and implementation

- **Meta Skills:**  
  Architectural reasoning, tradeoff analysis, debugging non-deterministic systems

- **AI Skills:**  
  Responsible use of AI for design, generation, debugging, and validation

All assignments are evaluated across these dimensions.

---

## Learning Objectives

By the end of this course, students will be able to:

1. Design object-oriented systems that maintain correctness under concurrent execution
2. Diagnose failures caused by shared state, timing, and coordination
3. Apply concurrency mechanisms:
    - threads, locks, monitors, atomic operations, and synchronizers
4. Design reusable concurrent components and abstractions
5. Evaluate tradeoffs between:
    - synchronization vs immutability
    - blocking vs async
    - shared state vs message passing
6. Implement systems across multiple runtime environments and understand their differences
7. Validate system behavior under stress and non-deterministic conditions
8. Use Generative AI responsibly to support design, debugging, and validation

---

## Course Structure

**Before Class**
- Analyze a system scenario (often flawed or incomplete)
- Form hypotheses about behavior

**During Class**
- 10–15 minute design framing
- System behavior analysis
- Failure exploration
- Pattern emergence
- Design discussion

**After Class**
- Implement and refine designs
- Compare alternatives
- Document reasoning using the Integrity Packet

---

## Required Tools & Resources

- Brightspace — course materials
- GitHub — repositories and submissions
- Docker and Git
- Ability to run at least **two** of the following:

    - Java
    - Python
    - Node.js
    - Go

- Generative AI tools (ChatGPT, Claude, Gemini, etc.)

---

## The Integrity Packet (Core to This Course)

Every assignment must include an **Integrity Packet**.

This is the primary deliverable—not just code.

Each packet includes:

1. **Recommendation** — design decision made
2. **Assumptions** — explicit and time-bound
3. **Evidence** — code, tests, observed behavior
4. **Validation** — how correctness was verified
5. **Ownership** — who is accountable
6. **Escalation Path** — where this design may fail

> If you cannot explain your system, you do not understand it.

---

## Assignment Continuity Requirement

All assignments in this course build on a **single evolving system**.

Students are expected to:

- extend and refine their previous implementations
- address prior design weaknesses
- incorporate feedback into future iterations

Starting over is **not permitted** without instructor approval.

> This reflects real-world engineering, where systems evolve rather than restart.

---

## Use of Generative AI

AI is required—but must be used responsibly.

Students may use AI for:

- generating initial designs or code
- exploring alternatives
- debugging and explaining behavior
- generating test cases

**Rules**

1. **Disclose usage clearly**
2. **Verify all outputs** — concurrency errors are subtle
3. You must **fully understand** all submitted work
4. Be prepared to **defend AI-assisted decisions**

Failure to disclose AI use may be treated as an academic integrity violation.

---

## Grading

| Component | Weight |
|----------:|-------:|
| A0–A3 Assignments | 40% |
| Final Project | 20% |
| Final Defense | 25% |
| Midterm Evaluation | 5% |
| Participation | 10% |

---

## Midterm Evaluation

The midterm is a **system reasoning evaluation**, not a traditional written exam.

Students will:

- analyze a concurrent object-oriented system
- identify failure modes
- propose design improvements
- explain tradeoffs and assumptions

You may be asked to:

- reason about interleavings and race conditions
- explain synchronization strategies
- critique an AI-generated design
- defend your design decisions

> This evaluates your ability to think—not memorize.

---

## Participation Policy

- Deadlines are **firm** — late work is not accepted
- All assignments are due **Sunday at 11:59 PM CT (Nashville)**
- Course material builds progressively; falling behind compounds difficulty
- Active participation in discussions and labs is expected

---

## Weekly Schedule — Object-Oriented Design Under Concurrency

| Week | Date | Focus | Original Coverage |
|-----:|------|------|------------------|
| **1** | May 7 | OO Boundaries Under Concurrency | Intro |
| **2** | May 14 | Threads, Synchronization, Invariants | Threads |
| **3** | May 21 | Atomic Operations & Visibility | Atomics |
| **4** | May 28 | Locks, Monitors, Deadlocks | Synchronizers |
| **5** | June 4 | Thread Pools & Resource Control | Thread Pools |
| **6** | June 11 | Coordination & Object Consistency | Coordination |
| **7** | June 18 | Async Tasks & Futures | Async |
| **8** | June 25 | Deadlock Analysis & Midterm Evaluation | Midterm |
| **9** | July 2 | Concurrent Data Structures | Collections |
| **10** | July 9 | Event-Driven & Reactive Systems | Async Streams |
| **11** | July 16 | Runtime Models (Node, Go, Python) | Platform |
| **12** | July 23 | Distributed Object Systems | Advanced |
| **13** | July 30 | Lifecycle & Evolution | Lifecycle |
| **14** | August 6 | AI-Augmented Design & System Integrity | AI |

Final project presentations occur during the **finals period immediately following August 6**.

---

## Assignments

---

### **A0 — Individual Integrity Packet**
**Assigned:** May 7  
**Due:** May 17

Create your personal Integrity Packet:

- how you reason about systems
- how you validate correctness
- how you use AI
- how you identify failure

This becomes the template for all future work.

---

### **A1 — Object Model Under Concurrency**
**Assigned:** May 14  
**Due:** June 7

Design a clean object-oriented system, then introduce concurrency.

- Identify where the system fails
- Redesign to maintain correctness under concurrent execution

---

### **A2 — Coordinated Object Systems**
**Assigned:** June 11  
**Due:** July 5 

Extend your A1 system to include multiple interacting components.

- Introduce coordination requirements
- Resolve race conditions and ordering issues
- Compare coordination strategies

---

### **A3 — Asynchronous System Design**
**Assigned:** July 9  
**Due:** July 26

Transform your system into an asynchronous/event-driven architecture.

- Replace blocking interactions
- Evaluate throughput, complexity, and correctness
- Identify new failure modes

---

### **A4 — Capstone System**
**Assigned:** July 23  
**Due:** August 9

Extend your system to operate under full stress:

- concurrency
- asynchronous execution
- partial failure
- runtime differences

Includes full Integrity Packet and system defense.

---

## Assignments — Summary Table

| Assignment | Theme | Assigned | Due      |
|-----------:|-------|----------|----------|
| **A0** | Integrity Packet | May 7 | May 17   |
| **A1** | Object model under concurrency | May 14 | June 7   |
| **A2** | Coordinated object systems | June 11 | July 5   |
| **A3** | Async system design | July 9 | July 26  |
| **A4** | Capstone system | July 23 | August 9 |

---

## Honor Code & Academic Integrity

You are bound by Vanderbilt’s Honor Code.  
All work must be your own unless collaboration is explicitly allowed and documented.

GenAI usage must always be disclosed.

---

## Mental Health & Wellness

Support is available through the **Student Care Network**:  
https://www.vanderbilt.edu/carecoordination/

---

## Disability Statement

Students needing accommodations should contact Student Access Services:  
https://www.vanderbilt.edu/student-access/disability/

I will work with you to ensure equitable access.

---