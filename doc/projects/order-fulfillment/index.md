# Order Processing & Fulfillment System

## System Premise

Build a system that manages customer orders from intake through payment, inventory reservation, fulfillment, and notification.

The system must maintain correctness when many customers place orders concurrently and when downstream operations partially fail.

## Core Scenario

An order moves through stages such as:

1. Cart submission
2. Order validation
3. Payment authorization
4. Inventory reservation
5. Fulfillment request
6. Shipment update
7. Customer notification
8. Cancellation or refund

Multiple customers may compete for limited inventory at the same time.

## Suggested Object Model

Potential objects include:

- `Order`
- `OrderLine`
- `InventoryItem`
- `Reservation`
- `Payment`
- `FulfillmentRequest`
- `Shipment`
- `Notification`
- `OrderStatus`
- `RetryPolicy`

## Concurrency Pressures

This domain should expose:

- concurrent orders competing for inventory
- double-reservation risks
- payment succeeds but inventory fails
- fulfillment fails after reservation
- status updates from multiple components
- cancellation racing with fulfillment

## A1 — Object Model Under Concurrency

Create the initial object model for order processing.

Then introduce concurrency:

- two orders attempt to reserve the same inventory
- payment and inventory update order state concurrently
- cancellation conflicts with fulfillment

Expected analysis:

- where state consistency fails
- which invariants must hold
- how object boundaries need refinement

## A2 — Coordinated Object Systems

Extend the system with coordinated payment, inventory, and fulfillment objects.

Expected analysis:

- transaction boundaries
- lock ordering
- compensation strategy
- synchronization vs redesign

## A3 — Asynchronous System Design

Transform the workflow into async events or jobs.

Examples:

- `OrderSubmitted`
- `PaymentAuthorized`
- `InventoryReserved`
- `FulfillmentStarted`
- `ShipmentCreated`

Expected analysis:

- eventual consistency
- retries
- duplicate events
- ordering assumptions

## A4 — Capstone System

Extend the system to support:

- concurrent customers
- limited inventory
- payment or fulfillment failures
- retries and compensation
- audit trail and observability

The final system should demonstrate correctness under concurrency, async execution, and partial failure.

## Integrity Packet Focus

Your packet should explain:

- how inventory consistency is protected
- how order state transitions are validated
- how partial failure is handled
- how compensation is triggered
- how AI-assisted design choices were verified

## Suggested Extensions

- backorder handling
- shipment tracking
- refund workflow
- inventory replenishment
- multi-warehouse fulfillment
