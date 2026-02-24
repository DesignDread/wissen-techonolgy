# Seat Booking System - Complete Guide

## 📋 Table of Contents
1. [Batch Schedule Logic](#batch-schedule-logic)
2. [Daily Auto-Booking](#daily-auto-booking)
3. [Spare Seat Booking](#spare-seat-booking)
4. [Release Seat](#release-seat)
5. [API Endpoints](#api-endpoints)
6. [Examples](#examples)

---

## 🎯 Batch Schedule Logic

### Overview
Users are divided into **2 batches** with a rotating schedule based on the week of the month.

### Schedule Pattern

#### **Batch 1**
- **Week 1** (Days 1-14): **Monday to Wednesday**
- **Week 2** (Days 15-31): **Thursday to Friday**

#### **Batch 2**
- **Week 1** (Days 1-14): **Thursday to Friday**
- **Week 2** (Days 15-31): **Monday to Wednesday**

### Week Definition
- **Week 1**: Days 1-14 of the month
- **Week 2**: Days 15-31 of the month

### Example Schedule

```
February 2025:

Week 1 (Feb 1-14):
  - Batch 1: Mon, Tue, Wed (Feb 3-5)
  - Batch 2: Thu, Fri (Feb 6-7)

Week 2 (Feb 15-28):
  - Batch 1: Thu, Fri (Feb 20-21)
  - Batch 2: Mon, Tue, Wed (Feb 24-26)
```

### Utility Functions

Located in `src/utils/batchSchedule.js`:

```javascript
// Check if a date is a scheduled day for a user
isScheduledDay(user, date)
// Returns: boolean

// Get the next scheduled date for a user
getNextScheduledDate(user, startDate)
// Returns: Date | null

// Get which batch is scheduled for a specific date
getScheduledBatchForDate(date)
// Returns: 1 | 2 | null
```

---

## 🤖 Daily Auto-Booking

### Overview
Automatically books 40 seats at **12:01 AM** every day for the scheduled batch.

### Process Flow

```
12:01 AM (Daily)
    ↓
Detect scheduled batch for today
    ↓
Get 40 active users from that batch
    ↓
For each user:
  - Find first available seat
  - Create booking with bookingType = "scheduled"
  - Retry up to 3 times if seat conflict
    ↓
Log results (successes/failures)
```

### Implementation

**File**: `src/utils/cronJobs.js`

**Functions**:
- `runDailyAutoBooking()` - Executes the auto-booking process
- `initializeAutobookingCron(cron)` - Starts the CRON job at 12:01 AM
- `triggerManualAutobooking(date)` - Manually trigger for testing

### Features

✅ **Automatic Retry**: 3 retry attempts if seat allocation conflicts  
✅ **Logging**: Detailed logs of successes/failures  
✅ **Batch Detection**: Automatically determines correct batch  
✅ **Graceful Handling**: Continues even if some bookings fail  

### Response Example

```javascript
{
  success: true,
  date: "2025-02-24",
  batch: 1,
  totalProcessed: 40,
  successful: 38,
  failed: 2,
  failures: [
    { userId: "...", error: "No available seats" }
  ]
}
```

---

## 🎉 Spare Seat Booking

### Overview
Users can book spare seats starting from **12 PM** on any day (max 10 spare bookings per day).

### Validation Order

1. ✅ **Not a Holiday** - Reject if it's a declared holiday
2. ✅ **Not Already Booked** - User can only have 1 active booking per day
3. ✅ **After 12 PM** - Spare booking only opens at 12:00 PM
4. ✅ **Spare Slots Available** - Max 10 spare bookings per day

### Booking Flow

```
User requests spare seat for date
    ↓
Validate all conditions
    ↓
Find first available seat
    ↓
Create booking with:
  - bookingType = "spare"
  - status = "active"
    ↓
Return booking confirmation
```

### Atomic Seat Allocation

Uses MongoDB unique index with retry logic:

```javascript
// Unique compound index on (seatNumber + date) + status filter
db.bookings.createIndex(
  { seatNumber: 1, date: 1 },
  { 
    unique: true,
    sparse: true,
    partialFilterExpression: { status: "active" }
  }
)
```

If duplicate error occurs (race condition), the system automatically retries up to 3 times.

### API Endpoint

```
POST /api/bookings/spare
Authorization: Bearer <JWT_TOKEN>

Body:
{
  "date": "2025-02-25"
}
```

### Error Responses

```javascript
// Holiday
{
  success: false,
  message: "Cannot book on a holiday"
}

// Already booked
{
  success: false,
  message: "You already have a booking for this date"
}

// Before 3 PM
{
  success: false,
  message: "Spare seat booking opens at 12 PM. Please try again later"
}

// No spare slots
{
  success: false,
  message: "All spare seats have been booked"
}
```

---

## 🔄 Release Seat

### Overview
Users can release their booking, making the seat available for others.

### Process Flow

```
User requests to release seat
    ↓
Find active booking for date
    ↓
Change status to "released"
    ↓
Seat becomes available
    ↓
Spare pool increases (if applicable)
```

### API Endpoint

```
POST /api/bookings/release
Authorization: Bearer <JWT_TOKEN>

Body:
{
  "date": "2025-02-25"
}
```

### Response

```javascript
{
  success: true,
  message: "Seat released successfully",
  data: {
    bookingId: "...",
    date: "2025-02-25",
    seatNumber: 15,
    status: "released"
  }
}
```

---

## 📡 API Endpoints

### 1. Book Spare Seat
```
POST /api/bookings/spare
Authorization: Required
```

**Request**:
```json
{
  "date": "2025-02-25"
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Spare seat booked successfully",
  "data": {
    "bookingId": "507f1f77bcf86cd799439011",
    "date": "2025-02-25",
    "seatNumber": 7,
    "bookingType": "spare",
    "status": "active"
  }
}
```

---

### 2. Release Seat
```
POST /api/bookings/release
Authorization: Required
```

**Request**:
```json
{
  "date": "2025-02-25"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Seat released successfully",
  "data": {
    "bookingId": "507f1f77bcf86cd799439011",
    "date": "2025-02-25",
    "seatNumber": 7,
    "status": "released"
  }
}
```

---

### 3. Get My Bookings
```
GET /api/bookings/my-bookings
Authorization: Required
Query Params: ?fromDate=2025-02-01&toDate=2025-02-28&status=active
```

**Response (200)**:
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": { "name": "John Doe", "email": "john@example.com" },
      "date": "2025-02-25",
      "seatNumber": 7,
      "bookingType": "spare",
      "status": "active",
      "createdAt": "2025-02-24T15:30:00Z"
    }
  ]
}
```

---

### 4. Get Bookings for Date
```
GET /api/bookings/date/:date
Authorization: Optional
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "date": "2025-02-25",
    "bookings": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "userId": { "name": "John Doe", "email": "john@example.com" },
        "seatNumber": 7,
        "bookingType": "spare",
        "status": "active"
      }
    ],
    "statistics": {
      "totalSeats": 50,
      "occupiedSeats": 42,
      "availableSeats": 8,
      "scheduledBookings": 40,
      "spareBookings": 2
    }
  }
}
```

---

### 5. Get Seat Status
```
GET /api/bookings/seat-status/:date
Authorization: Optional
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "date": "2025-02-25",
    "seats": [
      { "seatNumber": 1, "status": "occupied", "bookingType": "scheduled" },
      { "seatNumber": 2, "status": "occupied", "bookingType": "spare" },
      { "seatNumber": 3, "status": "available", "bookingType": null },
      { "seatNumber": 4, "status": "occupied", "bookingType": "scheduled" }
    ]
  }
}
```

---

## 📝 Examples

### Scenario 1: Scheduled Booking (Auto)

**User Details**:
- Batch: 1
- Email: john@example.com

**February 2025 Schedule**:
- Week 1 (Feb 1-14): Mon-Wed → Feb 3, 4, 5
- Week 2 (Feb 15-28): Thu-Fri → Feb 20, 21, 27, 28

**What Happens**:
- Feb 3 at 12:01 AM: 40 users from Batch 1 automatically booked for Feb 3
- Feb 4, 5: Batch 1 users can only use scheduled seats (booked yesterday)
- Feb 20, 21: Auto-booking happens on these dates
- Feb 24-26: No scheduled bookings (not in schedule)

---

### Scenario 2: Spare Seat Booking

**User Details**:
- Batch: 1
- Already has scheduled booking for Feb 5

**Request at 2:50 PM on Feb 5**:
```bash
curl -X POST http://localhost:5000/api/bookings/spare \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-02-05"}'
```

**Response**:
```json
{
  "success": false,
  "message": "Spare seat booking opens at 3 PM. Please try again later"
}
```

**Request at 3:05 PM**:
```bash
curl -X POST http://localhost:5000/api/bookings/spare \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-02-06"}'  // Different day
```

**Response**:
```json
{
  "success": true,
  "message": "Spare seat booked successfully",
  "data": {
    "bookingId": "507f1f77bcf86cd799439011",
    "date": "2025-02-06",
    "seatNumber": 23,
    "bookingType": "spare",
    "status": "active"
  }
}
```

---

### Scenario 3: Release Seat

**User has booking for Feb 5**:

```bash
curl -X POST http://localhost:5000/api/bookings/release \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-02-05"}'
```

**Response**:
```json
{
  "success": true,
  "message": "Seat released successfully",
  "data": {
    "bookingId": "507f1f77bcf86cd799439011",
    "date": "2025-02-05",
    "seatNumber": 5,
    "status": "released"
  }
}
```

**Result**: Seat 5 on Feb 5 is now available for new spare bookings.

---

## 🔧 Database Indexes

### Booking Indexes

```javascript
// Unique index for preventing double-booking (active bookings only)
db.bookings.createIndex(
  { seatNumber: 1, date: 1 },
  { 
    unique: true,
    sparse: true,
    partialFilterExpression: { status: "active" }
  }
)

// For user booking queries
db.bookings.createIndex({ userId: 1, date: 1 })

// For date-based queries
db.bookings.createIndex({ date: 1 })
```

---

## 🚀 Configuration

File: `src/models/Booking.js`

**Seat Limits**:
- Total seats: **50**
- Scheduled bookings: **40** (auto-booked daily)
- Spare seats: **10** (max booking allowed per day)

To modify these values, update the constants in:
- `src/controllers/bookingController.js` (spare seat count)
- `src/utils/cronJobs.js` (auto-booking count)
- `src/models/Booking.js` (seat number validation)

---

## 📊 Database Models

### Booking Schema

```javascript
{
  userId: ObjectId (ref: User, required),
  date: Date (required),
  seatNumber: Number (1-50, required),
  bookingType: "scheduled" | "spare" (required),
  status: "active" | "released" (default: "active"),
  createdAt: Date,
  updatedAt: Date
}
```

### Unique Constraints
- `(seatNumber + date)` when status = "active"

---

## ⚠️ Important Notes

1. **Weekend Exclusion**: No bookings on Saturdays/Sundays
2. **Holiday Handling**: Use `POST /api/holidays` to declare holidays
3. **Timezone**: Ensure server timezone matches expected timezone
4. **Noon Check**: Spare booking validation uses 24-hour format (12:00 = 12 PM)
5. **Race Conditions**: Handled automatically with retry logic (3 attempts)
6. **Seat Release**: Changes status to "released", doesn't delete the booking (for auditing)

---

## 🔐 Authorization

All booking modification endpoints require **JWT Token**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Read-only endpoints (get bookings, seat status) are public.

---

## 🐛 Troubleshooting

### Issue: Auto-booking not running
- Check if node-cron is installed: `npm list node-cron`
- Verify server timezone setting
- Check logs for CRON initialization message

### Issue: Duplicate booking despite retry
- Verify MongoDB unique index is created correctly
- Check network latency issues
- Increase retry count in `createBookingWithRetry()`

### Issue: User can book multiple times same day
- Verify `userHasBookingOnDate()` query logic
- Check if user booking status is "active" or "released"
- Ensure `userId` field is correctly populated

---

Generated: February 2025
