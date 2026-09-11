# RepairGraph Database Architecture & Data Dictionary

This document details the relational database architecture, entity-relationship model, constraints, and index strategy for the **RepairGraph** platform implemented using **PostgreSQL** and **Prisma ORM**.

---

## 1. Entity-Relationship Overview

```
User (1) ─────────── (N) Device (1) ─────────── (N) RepairRequest
  │                                                      │
  │ (1)                                                  │ (1)
  ▼                                                      ▼
Repairer (1) ────── (N) Quote (1) ───────────── (1) RepairJob (1) ──── (1) Review
  │                        │                               │
  │ (1)                    │ (1)                           │ (1)
  ▼                        ▼                               ▼
RepairerSpecialization   [Accepted] ───────────────►  RepairHistory (Passport)
```

---

## 2. Enums

### `UserRole`
- `USER`: Regular consumer device owner.
- `REPAIRER`: Verified or commercial technician / repair workshop.
- `ADMIN`: Platform administrator with catalog and dispute privileges.

### `DeviceCategory`
- `SMARTPHONE`
- `LAPTOP`
- `TABLET`
- `HEADPHONES`
- `MONITOR`

### `DeviceCondition`
- `EXCELLENT` | `GOOD` | `FAIR` | `DEGRADED` | `CRITICAL`

### `UrgencyLevel`
- `LOW` | `MEDIUM` | `HIGH`

### `RequestStatus`
- `REQUESTED`: Problem submitted by consumer, awaiting diagnostic/quotes.
- `ACCEPTED`: Quote accepted by consumer, repair job scheduled.
- `DIAGNOSING`: Under bench inspection by technician.
- `WAITING_FOR_PART`: Specialist awaiting component delivery.
- `REPAIRING`: Physical intervention in progress.
- `TESTING`: Hardware undergoing bench stress tests.
- `COMPLETED`: Handover complete, service record stamped.
- `CANCELLED`: Withdrawn before bench work began.

### `QuoteStatus`
- `PENDING` | `ACCEPTED` | `REJECTED` | `WITHDRAWN`

### `JobStatus`
- `ACCEPTED` | `DIAGNOSING` | `WAITING_FOR_PART` | `REPAIRING` | `TESTING` | `COMPLETED` | `CANCELLED`

### `RecommendedAction`
- `REPAIR` | `DIY` | `REPLACE` | `RESELL` | `RECYCLE`

### `VerificationStatus`
- `PENDING` | `VERIFIED` | `REJECTED`

---

## 3. Core Entities

### `User`
Stores account identities, authentication credentials, and roles.
- `id` (String, PK, cuid)
- `name` (String)
- `email` (String, Unique)
- `passwordHash` (String, bcrypt salt rounds 10)
- `role` (UserRole, default: `USER`)
- `phone` (String, Nullable)
- `createdAt` / `updatedAt` (DateTime)
- **Indexes**: `[email]`, `[role]`

### `Device`
Stores registered consumer hardware telemetry, purchase history, and baseline condition.
- `id` (String, PK, cuid)
- `userId` (String, FK -> User.id, Cascade Delete)
- `category` (DeviceCategory)
- `brand` (String)
- `model` (String)
- `serialNumber` (String)
- `purchaseDate` (DateTime, Nullable)
- `purchasePrice` (Float, Non-negative, Nullable)
- `warrantyExpiry` (DateTime, Nullable)
- `currentValue` (Float, Depreciated Fair Market Value, Nullable)
- `condition` (DeviceCondition, default: `GOOD`)
- `imageUrl` (String, Nullable)
- **Indexes**: `[userId]`, `[category]`, `[serialNumber]`

### `RepairRequest`
Captures user-reported symptoms and failure conditions for a specific device.
- `id` (String, PK, cuid)
- `deviceId` (String, FK -> Device.id, Cascade Delete)
- `userId` (String, FK -> User.id, Cascade Delete)
- `description` (String)
- `urgency` (UrgencyLevel, default: `MEDIUM`)
- `status` (RequestStatus, default: `REQUESTED`)
- **Indexes**: `[deviceId]`, `[userId]`, `[status]`

### `Diagnosis`
Stores failure category, root-cause probability, and evidence generated during triage.
- `id` (String, PK, cuid)
- `repairRequestId` (String, Unique, FK -> RepairRequest.id, Cascade Delete)
- `issueCategory` (String)
- `possibleIssue` (String)
- `confidence` (Float, 0 to 100)
- `evidence` (String[])

### `RepairRecommendation`
Stores decision engine evaluation (repairability score, economic viability, recommended action).
- `id` (String, PK, cuid)
- `repairRequestId` (String, Unique, FK -> RepairRequest.id, Cascade Delete)
- `repairabilityScore` (Float, 0 to 100)
- `economicScore` (Float, 0 to 100)
- `recommendedAction` (RecommendedAction)
- `estimatedCostMin` / `estimatedCostMax` (Float)
- `reasoning` (String)

### `Repairer`
Stores business profile, service radius coordinates, verification badges, and ratings.
- `id` (String, PK, cuid)
- `userId` (String, Unique, FK -> User.id, Cascade Delete)
- `businessName` (String)
- `description` (String, Nullable)
- `address` (String)
- `latitude` / `longitude` (Float, Nullable)
- `verificationStatus` (VerificationStatus, default: `PENDING`)
- `rating` (Float, 0.0 to 5.0, default: 0)
- `totalJobs` (Int, default: 0)
- **Indexes**: `[verificationStatus]`, `[rating]`

### `RepairerSpecialization`
Defines device and component-level competencies (e.g. Laptop -> Lenovo -> Thermal Module).
- `id` (String, PK, cuid)
- `repairerId` (String, FK -> Repairer.id, Cascade Delete)
- `deviceCategory` (DeviceCategory)
- `brand` (String)
- `serviceType` (String)
- **Indexes**: `[repairerId]`, `[deviceCategory, brand]`

### `Quote`
Represents competitive technician estimates submitted against open repair requests.
- `id` (String, PK, cuid)
- `repairRequestId` (String, FK -> RepairRequest.id, Cascade Delete)
- `repairerId` (String, FK -> Repairer.id, Cascade Delete)
- `estimatedCost` (Float, Positive)
- `estimatedDays` (Int, Positive)
- `notes` (String, Nullable)
- `status` (QuoteStatus, default: `PENDING`)
- **Indexes**: `[repairRequestId]`, `[repairerId]`, `[status]`

### `RepairJob`
State-machine orchestrator created when a consumer accepts a specific quote.
- `id` (String, PK, cuid)
- `repairRequestId` (String, Unique, FK -> RepairRequest.id, Cascade Delete)
- `repairerId` (String, FK -> Repairer.id, Cascade Delete)
- `quoteId` (String, Unique, FK -> Quote.id, Cascade Delete)
- `status` (JobStatus, default: `ACCEPTED`)
- `agreedCost` (Float)
- `actualCost` (Float, Nullable)
- `startedAt` (DateTime)
- `completedAt` (DateTime, Nullable)
- `notes` (String, Nullable)
- **Indexes**: `[repairerId]`, `[status]`

### `RepairHistory` (Repair Passport)
Permanent, immutable maintenance ledger entry linked to physical device serials upon job completion.
- `id` (String, PK, cuid)
- `deviceId` (String, FK -> Device.id, Cascade Delete)
- `repairJobId` (String, Unique, FK -> RepairJob.id, Cascade Delete)
- `repairType` (String)
- `issue` (String)
- `partsReplaced` (String[])
- `cost` (Float)
- `repairerId` (String, FK -> Repairer.id, Cascade Delete)
- `repairDate` (DateTime)
- `notes` (String, Nullable)
- `verificationStatus` (VerificationStatus, default: `VERIFIED`)
- **Indexes**: `[deviceId]`, `[repairerId]`

### `Review`
Customer review and star rating submitted exclusively for completed repair jobs.
- `id` (String, PK, cuid)
- `repairJobId` (String, Unique, FK -> RepairJob.id, Cascade Delete)
- `userId` (String, FK -> User.id, Cascade Delete)
- `repairerId` (String, FK -> Repairer.id, Cascade Delete)
- `rating` (Int, 1 to 5)
- `comment` (String)
- **Indexes**: `[repairerId]`, `[userId]`

---

## 4. Key Relational Constraints & Business Invariants

1. **Unique Email**: Enforced via PostgreSQL unique index on `User.email`.
2. **Quote Uniqueness in Jobs**: `RepairJob.quoteId` is unique; a quote can produce at most one active job.
3. **One Active Job per Request**: `RepairJob.repairRequestId` is unique.
4. **Single Review per Job**: `Review.repairJobId` is unique; prevents multiple reviews for the same service action.
5. **Cascading Integrity**: Deleting a `User` cascades to delete their `Device` records, `RepairRequest` records, and orphaned quotes.
