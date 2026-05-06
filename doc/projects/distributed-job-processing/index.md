# Distributed Job Processing System

## System Premise

Build a system that accepts, schedules, executes, and tracks asynchronous jobs across multiple workers.

The system must operate correctly under concurrent job submission, worker contention, partial worker failure, retries, and uneven load.

## Core Scenario

A job moves through stages such as:

1. Job submission
2. Validation
3. Queueing
4. Worker assignment
5. Execution
6. Progress reporting
7. Completion or failure
8. Retry or escalation
9. Result retrieval

Multiple workers may compete for available jobs. Jobs may be long-running, fail, or time out.

## Suggested Object Model

Potential objects include:

- `Job`
- `JobQueue`
- `Worker`
- `Scheduler`
- `JobLease`
- `ResultStore`
- `RetryPolicy`
- `WorkerPool`
- `JobStatus`
- `FailureRecord`

## Concurrency Pressures

This domain should expose:

- multiple workers claiming the same job
- concurrent job submission
- queue contention
- worker failure during execution
- stale leases or timeouts
- retry storms
- inconsistent status updates

## A1 — Object Model Under Concurrency

Create the initial object model for job submission and execution.

Then introduce concurrency:

- multiple workers try to claim the same job
- job status is updated concurrently
- completed jobs are retried incorrectly

Expected analysis:

- shared queue state
- ownership of a job
- safe state transitions

## A2 — Coordinated Object Systems

Extend the system with scheduling, leases, and worker coordination.

Expected analysis:

- lock strategy
- lease expiration
- worker lifecycle
- starvation or fairness concerns

## A3 — Asynchronous System Design

Transform the system into an async queue/event-driven model.

Examples:

- `JobSubmitted`
- `JobClaimed`
- `JobStarted`
- `JobCompleted`
- `JobFailed`
- `JobRetried`

Expected analysis:

- event ordering
- duplicate processing
- backpressure
- recovery after worker failure

## A4 — Capstone System

Extend the system to support:

- multiple queues
- worker pools
- failure injection
- retries and dead-letter handling
- metrics and observability

The final system should demonstrate correctness under concurrency, async execution, and partial failure.

## Integrity Packet Focus

Your packet should explain:

- how jobs are claimed safely
- how duplicate execution is prevented or handled
- how worker failure is detected
- how retries are bounded
- how AI-generated code was tested under stress

## Suggested Extensions

- priority queues
- delayed jobs
- dead-letter queue
- worker health checks
- distributed scheduler simulation
