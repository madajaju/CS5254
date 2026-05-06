# A0 – Project Selection, Environment & Integrity Packet

**Goal:**  
Choose your semester project domain, configure your development environment, select two implementation stacks, and create the **Individual Integrity Packet** that will be reused for every assignment.

This assignment establishes the foundation for the entire semester. You are not building the full system yet. You are defining the system you will evolve, the tools you will use, and the discipline you will follow.

---

## What You Must Do

0. **Choose Your Project Domain**
   - Pick one approved project domain:
     - Podcast Production & Distribution System
     - Video Content Production Pipeline
     - Order Processing & Fulfillment System
     - Distributed Job Processing System
     - Reservation & Resource Allocation System
     - AI Content Generation Pipeline
   - You will use this domain for **A1–A4**.
   - Describe the domain in 1–2 paragraphs.
   - Identify the core workflow that will become your system backbone.

1. **Define the Semester System**
   - Describe the system you intend to build in 4–6 sentences.
   - Identify:
     - primary objects/entities
     - shared state
     - likely concurrent operations
     - likely failure modes
   - Include a simple initial domain model.

2. **Select Two Implementation Stacks**
   - Pick two languages/runtime environments you will compare throughout the course:
     - Java
     - Python
     - Node.js
     - Go
   - Record:
     - language version
     - framework/library choices
     - package manager/build tool
     - why each stack was selected
   - You must use the same two stacks throughout the course unless approved.

3. **Tooling & Environment Setup**
   - Install and verify:
     - Docker
     - Git
     - IDE/editor
     - HTTP client or CLI test tool
     - AI assistant/tool of choice
   - Capture evidence that each tool works.

4. **Create Repository Structure**
   - Create a repository with this structure:
     - `A0/`
     - `A1/`
     - `A2/`
     - `A3/`
     - `A4/`
     - `docs/`
     - `integrity-packet/`
     - `shared/`
   - Add a root `README.md` explaining the semester project.

5. **Create Your Individual Integrity Packet**
   - Use the Integrity Packet structure:
     - Recommendation
     - Assumptions
     - Evidence
     - Validation
     - Ownership
     - Escalation Path/Reflection
   - This should describe how you will reason about correctness, concurrency, AI use, and failure throughout the semester.

6. **Create Your AI Usage Plan**
   - Identify which AI tools you expect to use.
   - Explain what AI may be used for:
     - brainstorming
     - explanation
     - code generation
     - test generation
     - debugging
   - Explain how you will verify AI output.
   - Explain how you will disclose AI usage in each assignment.

---

## Documentation & Deliverables

Create an `A0/README.md` containing:

- selected project domain
- semester system description
- initial domain model
- two selected implementation stacks and versions
- tool installation evidence
- repository structure
- Individual Integrity Packet
- AI Usage Plan
- short reflection:
  - why you chose this domain
  - why you chose these stacks
  - what concurrency risks you expect

Also include:

- `integrity-packet/individual-integrity-packet.md`
- `shared/ai-usage-log.md`
- screenshots or command output proving your environment works

---

## How You Will Be Graded

- **Project Domain & System Definition** (20%) — domain is appropriate, scoped, and contains real concurrency pressure
- **Two-Stack Selection** (15%) — stacks are clearly identified, justified, and usable for the semester
- **Environment Completeness** (20%) — tools installed and verified with evidence
- **Repository Structure** (10%) — clean, organized, and ready for future assignments
- **Individual Integrity Packet** (25%) — specific, thoughtful, reusable, and tied to concurrency/system correctness
- **AI Usage Plan** (10%) — clear disclosure and verification process

---

## Tips & Best Practices

- Choose a domain with shared state, workflow dependencies, and failure potential.
- Avoid UI-heavy projects. The focus is system behavior.
- Treat the Integrity Packet as an engineering artifact, not a worksheet.
- Document tools and versions now; this will save time later.
