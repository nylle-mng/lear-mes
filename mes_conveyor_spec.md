# MES Conveyor Control Web App Specification

## Overview
This application is a Manufacturing Execution System (MES) module designed to demonstrate control of a conveyor system.

The main goal is to:
- Allow users to configure production parameters (e.g., takt time)
- Automatically calculate and display conveyor behavior
- Enable or disable MES control over the conveyor
- Provide real-time control and monitoring via a clean UI

---

## Core Concept

### MES Disabled
- Conveyor operates independently
- User inputs do NOT affect the conveyor
- System acts as monitoring only

### MES Enabled
- MES has FULL control over the conveyor
- Conveyor behavior is dictated by system inputs

---

## Inputs

### Numeric
- Takt Time (seconds)

### Boolean
- Enable MES
- Start Conveyor
- Stop Conveyor

---

## Outputs
- Frequency (Hz)
- Number of Stops
- Downtime (seconds)

---

## Business Logic

Frequency:
frequency = 1 / takt_time

Stops:
Increment when Stop is triggered

Downtime:
Accumulates when conveyor is stopped

---

## Control Logic

If MES Disabled:
- Ignore all inputs

If MES Enabled:
- Follow takt time and controls

Start/Stop:
- Start = run
- Stop = stop and count

---

## UI/UX

- Clean dashboard
- Control panel (inputs + toggles)
- Metrics display cards
- Status indicators (Running/Stopped, MES On/Off)
- Responsive design

---

## Tech Stack Suggestion

Frontend:
- React / Next.js

Backend:
- Node.js (optional)

---

## Goal

Demonstrate MES-controlled conveyor behavior with clear UI and real-time feedback.
