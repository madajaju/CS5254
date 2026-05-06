# Reservation & Resource Allocation System

## System Premise

Build a system that manages reservations for limited resources, such as rooms, equipment, seats, appointments, vehicles, or lab machines.

The system must prevent double-booking and maintain correctness when many users attempt to reserve or release the same resources concurrently.

## Core Scenario

A reservation moves through stages such as:

1. Resource search
2. Availability check
3. Temporary hold
4. Confirmation
5. Payment or approval
6. Cancellation
7. Expiration
8. Release back to inventory

Multiple users may attempt to reserve the same resource or overlapping time slots.

## Suggested Object Model

Potential objects include:

- `Resource`
- `Reservation`
- `AvailabilityWindow`
- `Hold`
- `ReservationManager`
- `ConflictDetector`
- `ExpirationPolicy`
- `UserRequest`
- `ResourceCalendar`
- `ReservationStatus`

## Concurrency Pressures

This domain should expose:

- double-booking risk
- stale availability checks
- hold expiration racing with confirmation
- cancellation racing with allocation
- concurrent updates to resource calendars
- fairness and contention under high demand

## A1 — Object Model Under Concurrency

Create the initial object model for resources and reservations.

Then introduce concurrency:

- two users reserve the same resource
- availability is checked before another user confirms
- cancellation conflicts with confirmation

Expected analysis:

- broken invariants
- unsafe availability checks
- ownership of resource state

## A2 — Coordinated Object Systems

Extend the system with holds, expirations, and confirmations.

Expected analysis:

- lock granularity
- hold lifecycle
- time-based coordination
- conflict detection strategy

## A3 — Asynchronous System Design

Transform expiration, confirmation, and notification into async processes.

Examples:

- `HoldCreated`
- `HoldExpired`
- `ReservationConfirmed`
- `ReservationCancelled`
- `ResourceReleased`

Expected analysis:

- delayed events
- race between expiration and confirmation
- idempotent state changes
- event ordering

## A4 — Capstone System

Extend the system to support:

- multiple resource types
- concurrent users
- time-slot conflicts
- simulated payment or approval failures
- audit trail and observability

The final system should demonstrate correctness under concurrency, async execution, and partial failure.

## Integrity Packet Focus

Your packet should explain:

- how double-booking is prevented
- how availability is validated
- how holds expire safely
- how conflicting events are resolved
- how AI-assisted recommendations were verified

## Suggested Extensions

- waitlist handling
- recurring reservations
- priority users
- resource maintenance windows
- distributed calendar simulation
