# Stage 1

## 1. Core Actions for Notification Platform
To display and manage notifications for logged-in users, the platform needs to support the following core actions:
1. **Fetch Notifications**: Retrieve a paginated list of notifications for the active user (filterable by read/unread status).
2. **Mark as Read**: Mark a specific notification as read gracefully.
3. **Mark All as Read**: To mark every notification as read.
4. **Get Unread Count**: Small fetch for UX (e.g., bell icon in the nav bar).

---

## 2. REST API Design and JSON Contracts

### Common Headers
For all endpoints, the following headers are expected:
```json
{
  "Authorization": "Bearer <JWT_TOKEN>",
  "Accept": "application/json",
  "Content-Type": "application/json"
}
```

### Notification Object Schema
```json
{
  "id": "uuid-v4",
  "type": "INFO | ALERT | PROMO | SYSTEM",
  "title": "String",
  "message": "String",
  "actionUrl": "String (Optional, link to redirect)",
  "isRead": "Boolean",
  "createdAt": "ISO 8601 Timestamp"
}
```

---

### Endpoint A: Fetch Notifications
Retrieves a paginated list of notifications for the authenticated user.

* **Method**: `GET`
* **URL**: `/api/v1/notifications`
* **Query Parameters**:
  * `status` (optional): `unread` | `read` | `all` (default: `all`)
  * `page` (optional): Integer (default: 1)
  * `limit` (optional): Integer (default: 20)

**Response (200 OK)**
```json
{
  "data": [
    {
      "id": "e44d32a0-5b58-45e3-8273-fa9db42d7e48",
      "type": "INFO",
      "title": "Placement Drive: TechCorp",
      "message": "TechCorp is visiting the campus for recruitment on May 15th.",
      "actionUrl": "/placements/techcorp",
      "isRead": false,
      "createdAt": "2026-05-06T08:15:00.000Z"
    }
  ],
  "meta": {
    "totalCount": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

### Endpoint B: Get Unread Count
A lightweight endpoint specifically for the UI Notification Badge.

* **Method**: `GET`
* **URL**: `/api/v1/notifications/unread-count`

**Response (200 OK)**
```json
{
  "data": {
    "count": 5
  }
}
```

---

### Endpoint C: Mark Notification as Read
Updates the `isRead` status of a specific notification to `true`.

* **Method**: `PATCH`
* **URL**: `/api/v1/notifications/{notificationId}/read`

**Request Body**: None required.

**Response (200 OK)**
```json
{
  "data": {
    "id": "e44d32a0-5b58-45e3-8273-fa9db42d7e48",
    "isRead": true,
    "updatedAt": "2026-05-06T08:30:00.000Z"
  }
}
```

---

### Endpoint D: Mark All Notifications as Read
A bulk operation to mark everything in the active user's inbox as read.

* **Method**: `POST`
* **URL**: `/api/v1/notifications/read-all`

**Request Body**: None required.

**Response (200 OK)**
```json
{
  "data": {
    "success": true,
    "updatedCount": 5
  }
}
```

---

## 3. Real-Time Notification Mechanism

To ensure the frontend reacts instantly to new notifications without costly polling, we will use **WebSockets**.

### Mechanism Details (WebSocket Approach)
1. **Connection Initiation**: 
   When the user logs into the SPA, the frontend establishes a secure WebSocket connection to `ws://<domain>/ws/v1/notifications?token=<JWT_TOKEN>`.
2. **Subscription/Rooms**:
   The backend authenticates the token and subscribes the user's socket session to a private room based on their unique `userId`.
3. **Event Emitting Design (Backend to Frontend)**:
   When the backend systems trigger a generic notification, it emits a `NOTIFICATION_RECEIVED` event payload through the socket.
   
```json
// Example WebSocket Payload Sent to Client
{
  "event": "NOTIFICATION_RECEIVED",
  "payload": {
    "id": "a98z76b5-1234-5678-abcd-ef0123456789",
    "type": "ALERT",
    "title": "Sem 4 Results Declared",
    "message": "Your End Semester examination results are now available.",
    "isRead": false,
    "createdAt": "2026-05-06T08:35:12.000Z"
  }
}
```

4. **Frontend Handling**:
   - Appends the payload to the internal state/context (e.g., Redux/Zustand slice) containing the notification list.
   - Triggers an immediate "Toast / Snack-bar" pop-up.
   - Increments the unread badge count by +1 dynamically without a new API request.


