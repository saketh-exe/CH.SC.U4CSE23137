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
  "type": "EVENT | RESULT | PLACEMENT",
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

# Stage 2

## 1. Storage Choice: MongoDB
I recommend **MongoDB** because notification systems get a lot of reads and writes. A NoSQL approach easily stores different notification formats (like Events vs. Results) without strict schema changes. It also supports TTL (Time-to-Live) indexes to automatically delete old, unneeded notifications, saving storage space.

## 2. Basic Schema
**Collection: `users`**
```javascript
{
  "_id": "1042",
  "name": "Saketh",
  "email": "saketh@example.com",
  "role": "STUDENT", 
  "department": "CSE"
}
```

**Collection: `notifications`**
```javascript
{
  "_id": ObjectId("..."),
  "userId": "1042",
  "type": "ALERT",
  "title": "Semester Results",
  "message": "Your results are out.",
  "isRead": false,
  "createdAt": ISODate("2026-05-06T08:35:12.000Z")
}
```
*We should add a compound index on `(userId, createdAt)` and `(userId, isRead)` to make filtering fast.*

## 3. Mongoose Query Examples

**Fetch recent notifications for a user:**
```javascript
await Notification.find({ userId: '1042' })
  .sort({ createdAt: -1 })
  .limit(20);
```

**Get unread count:**
```javascript
await Notification.countDocuments({ userId: '1042', isRead: false });
```

**Mark a notification as read:**
```javascript
await Notification.updateOne(
  { _id: "...", userId: "1042" },
  { $set: { isRead: true } }
);
```

# Stage 3

## 1. Query Analysis

**The Query:**
```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```
Yes, it works and it gets back unread notifications from the studentID 1042,
BUT
```sql
select * from notifications
```
still searches the whole DB for the user and it's waste of memory and network bandwidth. 

## 2. Improvements & Cost
**Fix:**
Create a composite index on `(studentID, isRead, createdAt)` and change `SELECT *` to only the fields you need (like `SELECT id, title`).

**Cost:**
Without an index, it's roughly $O(N)$ (where N is 5 million rows) plus sorting time. With the index, it drops to $O(\log N + K)$ (where K is the matched rows). The index stores the data pre-sorted, so the database skips the heavy sorting step entirely.

## 3. Feedback: Indexing Every Column
If we index every coloumn it becomes slow to add or update the data in the coloumn,
this is because everytime there is a change the whole coloumn must be hashed and reindexed.

## 4. Query: Placement notifications in the last 7 days

```sql
SELECT DISTINCT studentID
FROM notifications
WHERE notificationType = 'Placement'
  AND createdAt >= NOW() - INTERVAL '7 days';
```

# Stage 4

## 1. Problem: DB Overwhelmed on Page Load
Fetching notifications on every single page load is highly inefficient. We need to reduce the number of times the frontend asks the backend for data.

## 2. Solutions to Improve Performance

### Strategy A: Caching with Redis (Backend Fix)
Instead of hitting MongoDB every time, store the user's unread count and latest notifications in an in-memory cache like **Redis**. 
* **How:** On the first request, fetch from Mongo and save to Redis. On subsequent page loads, serve directly from Redis. When a new notification arrives or a user reads one, update the cache.
* **Tradeoffs:** 
  * *Pros:* Drastically reduces DB CPU and I/O usage.
  * *Cons:* Extra infrastructure complexity and cost.

### Strategy B: Client-Side State Management (Frontend Fix)
The frontend shouldn't request notifications on every page navigation. 
* **How:** Fetch notifications once on initial app load and store them in global state (like Redux or Zustand). As the user navigates, just read from the local state. Use the WebSocket connection to push new notifications or status changes directly into that state.
* **Tradeoffs:**
  * *Pros:* Drops most of the API calls since most of the data is local now. UX is instant.
  * *Cons:* Requires managing state across multiple browser tabs (e.g., if you mark as read in Tab A, Tab B needs to know, which might require syncing via `localStorage`).

# Stage 5

## 1. Shortcomings of current approach
* **Blocking**: Sending sequentially will freeze the server for hours.
* **No Fault Tolerance**: One email failure breaks the loop and skips the rest.
* **Tight Coupling**: If the email API crashes, the DB insert fails too.

## 2. Handling the 200 Email Failures
* Currently, you have to manually parse logs to find failed IDs and script a retry.
* Moving forward, use a message queue so failed tasks auto-retry safely.

## 3. Should DB Saves and Emails happen together?
* No. DB writes are fast, but emails are slow and unreliable.
* Tying them together means external network timeouts will break your internal app flow.

## 4. Redesign strategy
* Process the DB saves in a single bulk insert.
* Use an async Message Queue (like RabbitMQ) to offload the slow email tasks to background workers.

### Revised Pseudocode
```python
function notify_all_v2(student_ids, message):
    batch_save_to_db(student_ids, message) # Fast bulk DB insert
    for user_id in student_ids:
        PushToQueue("EMAIL_QUEUE", { id: user_id, msg: message })
        PushToQueue("APP_PUSH_QUEUE", { id: user_id, msg: message })

# Background worker (runs separately)
function process_email_queue(task):
    try: 
        send_email(task.id, task.msg)
    except: 
        RetryTask(task) # Automatically retries if it fails
```


