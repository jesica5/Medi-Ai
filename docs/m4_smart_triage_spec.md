# MediAI Module M4: Smart Triage, Safety Rules & Alerts — Technical Specification & Architecture

## Overview
Module M4 delivers the core **Deterministic Clinical Safety Pre-Check Engine**, **Vital Baseline Validation**, **Priority Stratification Mapping**, **Emergency Workstation Queue Management**, and **Clinician Override Audit Journal**.

---

## Key Architecture & Design Boundaries

```
[Presentation Layer] -> React UI Components & Next.js App Router Pages
        |
        v
[Application Layer]  -> TriageOrchestrator, QueueService, OverrideService, AuditService
        |
        v
[Domain Layer]       -> RedFlagEngine (Pure Function, 100% Branch Covered, 0 I/O), PriorityMapper, VitalsBaseline
        |
        v
[Data Access Layer]  -> Supabase PostgreSQL (RLS & Append-Only Audit Journal)
```

---

## Clinical Safety Pre-Check Engine Rules (12 Risk Domains)

1. **Infection / Sepsis**: `qSOFA >= 2` of `{RR >= 22, SBP <= 100, altered mentation}` OR `Core Temp < 35.0°C`
2. **Respiratory**: `SpO2 < 90%` on room air OR `cyanosis` OR `audible stridor` OR `RR > 32 or < 8 bpm`
3. **Cardiac**: `Crushing retrosternal pain radiating to jaw/left arm` OR `syncope with chest pressure` OR `HR > 150 or < 40 bpm`
4. **Neurological**: `Acute focal deficit (facial droop, arm drift, slurred speech)` OR `GCS < 12` OR `status epilepticus`
5. **Blood Pressure**: `(SBP > 180 OR DBP > 120) WITH headache/chest pain` OR `profound shock (SBP < 85 mmHg)`
6. **Diabetes**: `Severe hypoglycemia (CBG < 60 mg/dL WITH altered consciousness)` OR `DKA (CBG > 400 mg/dL WITH ketotic breathing)`
7. **Gastrointestinal**: `Massive hematemesis` OR `involuntary guarding/rigidity` OR `melena WITH hemodynamic instability`
8. **Trauma**: `Pulsatile arterial hemorrhage` OR `flail chest` OR `suspected acute spinal cord injury` OR `traumatic amputation`
9. **Pregnancy**: `Third-trimester vaginal hemorrhage` OR `severe epigastric pain WITH visual aura` OR `eclamptic convulsions` (`gestational age > 20 wks`)
10. **Allergy**: `Angioedema of tongue/pharynx` OR `acute stridor` OR `wheezing WITH systemic hypotension`
11. **Dehydration**: `Anuria > 12h` OR `severe skin tenting` OR `cold extremities WITH cap refill > 4s`
12. **Multi-System / Toxic**: `Organophosphate (SLUDGE) signs` OR `venomous bite WITH ptosis`

---

## API Endpoints Summary

- `POST /api/v1/triage/assess`: Executes triage assessment. Safety pre-check runs first. Red flags force `CRITICAL` (P1) and bypass ML inference.
- `GET /api/v1/doctor/queue?status=PENDING_REVIEW`: Retrieves priority queue (P1 to P4). Evaluates RBAC (Doctor/Nurse sees MRN/name; Admin sees SHA-256 masked identifiers).
- `POST /api/v1/doctor/override`: Attending Doctor review endpoint. Requires mandatory written rationale when changing acuity category. Writes to `triage_reviews` and appends audit event.

---

## Test Evidence & Verification Commands

- `npm run test:coverage`: **100% Branch Coverage** on `red_flag_engine.ts`
- `npm run test`: **49 Tests Passing** (Unit, Integration, and E2E)
- `npm run typecheck`: **0 TypeScript Errors** (Strict mode)
- `npm run build`: Next.js production build succeeded.
