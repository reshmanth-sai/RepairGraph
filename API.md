# RepairGraph REST API Specification

This document specifies the REST API endpoints, authorization rules, request bodies, responses, and HTTP status codes for the **RepairGraph** backend foundation.

---

## 1. Global Conventions

### Base URL
`/api`

### Response Formats

#### Single Resource
```json
{
  "data": { ... }
}
```

#### Paginated Collections
```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

#### Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": [
      {
        "field": "serialNumber",
        "message": "Serial number is required"
      }
    ]
  }
}
```

### Standard HTTP Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Input validation failed or invalid payload syntax.
- `401 Unauthorized`: Missing, invalid, or expired authentication session.
- `403 Forbidden`: Authenticated user lacks permission to access or modify resource.
- `404 Not Found`: Target resource does not exist.
- `409 Conflict`: Resource already exists (e.g., duplicate email or review).
- `422 Unprocessable Entity`: Business rule invariant violated.
- `500 Internal Server Error`: Unexpected server error.

---

## 2. Authentication Endpoints

### `POST /api/auth/register`
Creates a new user account, hashes password with bcrypt, and sets secure HTTP-only cookie.
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "name": "Arun Kumar",
    "email": "arun@example.com",
    "password": "Password123!",
    "role": "USER",
    "phone": "+91 98765 43210"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "data": {
      "user": {
        "id": "cuid...",
        "name": "Arun Kumar",
        "email": "arun@example.com",
        "role": "USER",
        "phone": "+91 98765 43210",
        "createdAt": "2026-09-11T..."
      },
      "token": "jwt-token-string"
    }
  }
  ```

### `POST /api/auth/login`
Authenticates credentials, returns session token, and sets secure cookie.
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "email": "arun@example.com",
    "password": "Password123!"
  }
  ```
- **Response `200 OK`**: `{ "data": { "user": { ... }, "token": "..." } }`

### `POST /api/auth/logout`
Clears HTTP-only session cookie.
- **Auth**: Public / Authenticated
- **Response `200 OK`**: `{ "data": { "message": "Successfully logged out" } }`

### `GET /api/auth/me`
Retrieves sanitized profile of currently authenticated user.
- **Auth**: Any authenticated role (`USER`, `REPAIRER`, `ADMIN`)
- **Response `200 OK`**: `{ "data": { "id": "...", "name": "...", "email": "...", "role": "..." } }`

---

## 3. Device Management Endpoints

### `GET /api/devices`
Lists devices. Regular users only see their own devices; admins see all.
- **Auth**: Authenticated
- **Query Params**:
  - `page` (integer, default: 1)
  - `limit` (integer, default: 20)
  - `category` (optional enum: `SMARTPHONE`, `LAPTOP`, `TABLET`, `HEADPHONES`, `MONITOR`)
- **Response `200 OK`**: Paginated array of devices.

### `POST /api/devices`
Registers a new consumer device.
- **Auth**: Authenticated
- **Request Body**:
  ```json
  {
    "category": "LAPTOP",
    "brand": "Lenovo",
    "model": "ThinkPad T14 Gen 3",
    "serialNumber": "PF-3B79K2",
    "purchaseDate": "2023-04-12",
    "purchasePrice": 98000,
    "warrantyExpiry": "2024-04-12",
    "currentValue": 56000,
    "condition": "GOOD"
  }
  ```
- **Response `201 Created`**: `{ "data": { "id": "...", ... } }`

### `GET /api/devices/:id`
Retrieves single device digital record with repair requests and history.
- **Auth**: Authenticated (Device owner or ADMIN)
- **Response `200 OK`**: Single device object.
- **Errors**: `403 Forbidden` if attempting to access another user's device.

### `PUT /api/devices/:id`
Updates device details.
- **Auth**: Authenticated (Device owner or ADMIN)
- **Response `200 OK`**: Updated device object.

### `DELETE /api/devices/:id`
Deletes device from registry.
- **Auth**: Authenticated (Device owner or ADMIN)
- **Response `200 OK`**: `{ "data": { "success": true } }`

---

## 4. Repair Request Endpoints

### `GET /api/repair-requests`
Lists repair requests. Users see their own; repairers see open requests.
- **Auth**: Authenticated
- **Query Params**: `page`, `limit`, `status`
- **Response `200 OK`**: Paginated requests array.

### `POST /api/repair-requests`
Creates a repair request for a device owned by the user.
- **Auth**: Authenticated
- **Request Body**:
  ```json
  {
    "deviceId": "cuid...",
    "description": "Exhaust fan rattling with thermal shutdown under high load.",
    "urgency": "MEDIUM"
  }
  ```
- **Response `201 Created`**: Single repair request object with device details.
- **Errors**: `403 Forbidden` if device does not belong to the user.

### `GET /api/repair-requests/:id`
Retrieves request details, diagnosis, recommendation, and submitted quotes.
- **Auth**: Authenticated (Owner, Quoting Repairer, or ADMIN)
- **Response `200 OK`**: Single request object.

### `PUT /api/repair-requests/:id`
Updates request description, urgency, or status.
- **Auth**: Request Owner or ADMIN
- **Response `200 OK`**: Updated request object.

### `DELETE /api/repair-requests/:id`
Deletes open request.
- **Auth**: Request Owner or ADMIN
- **Response `200 OK`**: `{ "data": { "success": true } }`

---

## 5. Quote Endpoints

### `GET /api/repair-requests/:id/quotes`
Lists quotes submitted for a repair request. Customer sees all competing quotes; repairers see only their own quote.
- **Auth**: Authenticated (Request owner, repairer, or ADMIN)
- **Response `200 OK`**: Array of quotes.

### `POST /api/repair-requests/:id/quotes`
Submits a repair quote for an open request.
- **Auth**: `REPAIRER` or `ADMIN`
- **Request Body**:
  ```json
  {
    "estimatedCost": 3800,
    "estimatedDays": 2,
    "notes": "Includes OEM fan replacement and 6-month repair warranty."
  }
  ```
- **Response `201 Created`**: Quote object.
- **Errors**: `400 Bad Request` if quoting own request or request already completed.

### `PUT /api/quotes/:id`
Handles quote state transitions:
- Customer accepts (`ACCEPTED`) or rejects (`REJECTED`) quote.
- Repairer withdraws (`WITHDRAWN`) quote.
- **Note**: Accepting a quote automatically creates the active `RepairJob` and marks competing quotes `REJECTED`.
- **Response `200 OK`**: Updated quote object.

---

## 6. Repair Job Endpoints

### `POST /api/repair-jobs`
Explicitly instantiates a repair job from an accepted quote.
- **Auth**: Request owner or ADMIN
- **Request Body**: `{ "quoteId": "cuid..." }`
- **Response `201 Created`**: RepairJob object with status `ACCEPTED`.

### `GET /api/repair-jobs/:id`
Retrieves repair job status, timeline, assigned specialist, and parts.
- **Auth**: Customer, Assigned Repairer, or ADMIN
- **Response `200 OK`**: Single repair job object.

### `PUT /api/repair-jobs/:id`
Updates repair job status (`DIAGNOSING`, `WAITING_FOR_PART`, `REPAIRING`, `TESTING`, `COMPLETED`).
- **Auth**: **Only the assigned repairer** (or ADMIN)
- **Request Body**:
  ```json
  {
    "status": "COMPLETED",
    "actualCost": 3800,
    "notes": "Bench stress test passed. Temperatures stable at 65°C."
  }
  ```
- **Note**: Transitioning to `COMPLETED` automatically logs a `RepairHistory` record (Repair Passport) and increments `repairer.totalJobs`.
- **Response `200 OK`**: Updated repair job object.

---

## 7. Repairer Directory Endpoints

### `GET /api/repairers`
Lists verified repair workshops and specialists.
- **Auth**: Public
- **Query Params**: `page`, `limit`, `verificationStatus`
- **Response `200 OK`**: Paginated array of repairers with specializations.

### `POST /api/repairers`
Creates a repairer business profile for a user with the `REPAIRER` role.
- **Auth**: `REPAIRER` or `ADMIN`
- **Request Body**:
  ```json
  {
    "businessName": "Precision Silicon Labs",
    "description": "Component-level laptop repair specialists",
    "address": "Indiranagar, Bengaluru",
    "latitude": 12.9784,
    "longitude": 77.6408,
    "specializations": [
      {
        "deviceCategory": "LAPTOP",
        "brand": "Lenovo",
        "serviceType": "Thermal Module Replacement"
      }
    ]
  }
  ```
- **Response `201 Created`**: Created repairer profile.

### `GET /api/repairers/:id`
Retrieves public profile, specializations, aggregate rating, and recent reviews.
- **Auth**: Public
- **Response `200 OK`**: Single repairer profile.

---

## 8. Review Endpoints

### `POST /api/reviews`
Submits a rating and comment for a completed repair job.
- **Auth**: Authenticated (Customer of job only)
- **Request Body**:
  ```json
  {
    "repairJobId": "cuid...",
    "rating": 5,
    "comment": "Quick service and genuine parts installed."
  }
  ```
- **Business Invariants**:
  - Repair job must be `COMPLETED` (`400 Bad Request` otherwise).
  - Only the customer who owns the job can review (`403 Forbidden` otherwise).
  - Only one review allowed per job (`409 Conflict` on duplicate).
  - Automatically recalculates repairer's average `rating`.
- **Response `201 Created`**: Review object.

### `GET /api/repairers/:id/reviews`
Lists paginated reviews for a specific repairer.
- **Auth**: Public
- **Query Params**: `page`, `limit`
- **Response `200 OK`**: Paginated review records.
