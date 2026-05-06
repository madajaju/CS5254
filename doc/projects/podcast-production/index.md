# Podcast Production & Distribution System

## System Premise

Build a system that manages the full lifecycle of a podcast episode from raw content to publication and promotion.

The system must coordinate multiple assets, long-running processing tasks, external publishing targets, and failure recovery while preserving correctness under concurrent execution.

## Core Scenario

A podcast episode moves through stages such as:

1. Episode creation
2. Raw audio/video ingestion
3. Transcript generation
4. Audio cleanup
5. Video rendering
6. Show notes generation
7. Approval
8. Publishing
9. Promotion

Multiple episodes may be in progress at the same time. Multiple workers may attempt to update or process the same episode.

## Suggested Object Model

Potential objects include:

- `Episode`
- `MediaAsset`
- `Transcript`
- `ProcessingJob`
- `ApprovalGate`
- `Publisher`
- `PromotionCampaign`
- `EpisodeStatus`
- `Worker`
- `RetryPolicy`

## Concurrency Pressures

This domain should expose:

- multiple workers processing the same episode
- concurrent updates to episode status
- assets completing out of order
- publishing before all dependencies are complete
- retries after partial failure
- duplicate processing events

## A1 — Object Model Under Concurrency

Create the initial object model for an episode lifecycle.

Then introduce concurrent access:

- two workers update the same episode
- transcript and audio cleanup run concurrently
- status transitions conflict

Expected analysis:

- where encapsulation fails
- which invariants are violated
- what state must be protected

## A2 — Coordinated Object Systems

Extend the system with dependent workflow stages.

Examples:

- transcript requires audio ingestion
- show notes require transcript
- publishing requires approval
- promotion requires publishing

Expected analysis:

- coordination strategy
- ordering constraints
- synchronization mechanism
- deadlock or missed-signal risks

## A3 — Asynchronous System Design

Transform processing into async jobs or events.

Examples:

- `AudioProcessed`
- `TranscriptReady`
- `VideoRendered`
- `EpisodeApproved`
- `EpisodePublished`

Expected analysis:

- event ordering
- duplicate events
- eventual consistency
- blocking vs non-blocking tradeoffs

## A4 — Capstone System

Extend the system to support:

- multiple episodes
- multiple workers
- simulated platform failures
- retries and recovery
- observability and audit trail

The final system should demonstrate correctness under concurrency, async execution, and partial failure.

## Integrity Packet Focus

Your packet should explain:

- how episode state is protected
- how dependencies are enforced
- how duplicate processing is handled
- how failures are retried or escalated
- where AI helped and where it was wrong

## Suggested Extensions

- multi-language implementation
- external platform simulation
- priority scheduling
- cancellation workflow
- human approval step
- social media promotion queue
