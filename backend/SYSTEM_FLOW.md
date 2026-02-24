# 🔄 System Flow & Architecture

## Complete Seat Booking System Flow

```
┌────────────────────────────────────────────────────────────────┐
│                    SEAT BOOKING SYSTEM                         │
│                                                                │
│  50 Total Seats                                               │
│  ├─ 40 Scheduled (Auto-booked daily at 12:01 AM)            │
│  └─ 10 Spare (Available from 12 PM)                           │
└────────────────────────────────────────────────────────────────┘
```

---

## 📅 Daily Schedule

### **Midnight - 12:00 AM**
```
User sleeps ✓
System ready
```

### **12:01 AM - AUTO-BOOKING TRIGGER** 🚀
```
┌─ CRON Job Starts
│
├─ Check: Is today a weekend?
│  └─ YES → Skip, no bookings
│  └─ NO → Continue
│
├─ Detect: Which batch is scheduled today?
│  ├─ Batch 1 (Mon-Wed, Week1) OR (Thu-Fri, Week2)
│  ├─ Batch 2 (Thu-Fri, Week1) OR (Mon-Wed, Week2)
│  └─ None → Skip
│
├─ Get: Load 40 active users from scheduled batch
│  ├─ Query: User.find({ batchNumber, isActive: true }).limit(40)
│  └─ Connect to: Database
│
├─ For Each User (40 iterations):
│  │
│  ├─ Find: First available seat (1-50)
│  │  ├─ Query existing bookings for today
│  │  ├─ Skip occupied seats
│  │  └─ Return first free: e.g., Seat 5
│  │
│  ├─ Create: Booking document
│  │  ├─ userId: User ID
│  │  ├─ date: Today
│  │  ├─ seatNumber: 5
│  │  ├─ bookingType: "scheduled"
│  │  ├─ status: "active"
│  │  └─ Save to database
│  │
│  ├─ Handle Race Condition:
│  │  ├─ If duplicate error (seat taken)
│  │  ├─ Retry: Find next available seat
│  │  ├─ Max retries: 3
│  │  └─ If all fail → Log error, continue to next user
│  
├─ Log Results:
│  ├─ ✓ 38 successful bookings
│  ├─ ✗ 2 failed bookings
│  └─ Report sent to server logs
│
└─ End: Scheduled bookings complete
   Seats occupied: 40
   Spare seats available: 10 (after 12 PM)
```

### **1:00 AM - 2:59 PM**
```
Users cannot book spare seats
  ├─ WHY? Validation rule: currentHour >= 12 (12 PM)
  └─ RESULT? API returns 400: "Booking opens at 12 PM"
```

### **3:00 PM - SPARE BOOKING OPENS** 🎯
```
┌─ User wants to book a spare seat
│
├─ Send: POST /api/bookings/spare
│  └─ Headers: Authorization: Bearer <TOKEN>
│  └─ Body: { date: "2025-02-25" }
│
├─ Validation Chain:
│  │
│  ├─ Step 1: Is it a holiday?
│  │  ├─ Query: Holiday.findOne({ date })
│  │  ├─ YES → Reject: 400 "Cannot book on holiday"
│  │  └─ NO → Continue
│  │
│  ├─ Step 2: Does user already have booking today?
│  │  ├─ Query: Booking.findOne({ userId, date, status: 'active' })
│  │  ├─ YES → Reject: 400 "Already booked for this date"
│  │  └─ NO → Continue
│  │
│  ├─ Step 3: Is it after 12 PM?
│  │  ├─ Current time: 3:05 PM → YES ✓
│  │  ├─ Current time: 11:50 AM → NO → Reject: 400 "Opens at 12 PM"
│  │  └─ NO → Reject
│  │
│  ├─ Step 4: Are spare slots available?
│  │  ├─ Query: Booking.count({ date, bookingType: 'spare', status: 'active' })
│  │  ├─ Count < 10 → Continue
│  │  ├─ Count >= 10 → Reject: 400 "All spare seats booked"
│  │  └─ MAX: 10 spare bookings per day
│  │
│  └─ All Validations Pass ✓
│
├─ Allocate Seat (Atomic):
│  │
│  ├─ Find: First available seat
│  │  ├─ Query: Bookings with seatNumber in range 1-50
│  │  ├─ Filter: status: 'active'
│  │  ├─ Return: First unoccupied seat (e.g., Seat 23)
│  │  └─ Loop: Try to find free seat
│  │
│  ├─ Create: Booking with unique index protection
│  │  ├─ MongoDB Index: (seatNumber + date) UNIQUE (when active)
│  │  ├─ Insert: New booking
│  │  ├─ If Duplicate Error → Retry (Race condition)
│  │  │  └─ Retries: 3 attempts
│  │  ├─ Success → Return booking
│  │  └─ All retries fail → Error: 409 Conflict
│  │
│  └─ Result:
│     ├─ bookingType: "spare"
│     ├─ status: "active"
│     └─ seatNumber: 23
│
├─ Response 201:
│  └─ { bookingId, date, seatNumber, bookingType, status }
│
└─ User has spare seat booked from 3 PM!
```

### **Any Time - RELEASE SEAT** 🔄
```
┌─ User wants to release their booking
│
├─ Send: POST /api/bookings/release
│  └─ Headers: Authorization: Bearer <TOKEN>
│  └─ Body: { date: "2025-02-25" }
│
├─ Find: User's active booking for that date
│  ├─ Query: Booking.findOne({ userId, date, status: 'active' })
│  ├─ Found → Continue
│  └─ Not found → Error: 404 Booking not found
│
├─ Update: Change status (instead of delete - for auditing)
│  ├─ Old status: "active"
│  ├─ New status: "released"
│  └─ Save: Updated booking
│
├─ Result:
│  ├─ Seat becomes AVAILABLE immediately
│  ├─ Other users can now book this seat
│  └─ Spare pool increases
│
├─ How Others Can Use It:
│  ├─ If after 12 PM → Can book as spare
│  ├─ If before 3 PM → Auto-booking might use it (if scheduled)
│  └─ Status: "released" booking doesn't block new bookings
│
└─ Audit Trail Maintained ✓
   (Booking record exists with status: "released")
```

---

## 🔐 Authentication Flow

### **Step 1: Registration**
```
┌─ POST /api/auth/register
│
├─ Request Data:
│  ├─ name: "Alice Johnson"
│  ├─ email: "alice@example.com"
│  ├─ password: "securePass123"
│  ├─ squatNumber: 5 (1-10)
│  └─ batchNumber: 1 (1 or 2)
│
├─ Server Validates:
│  ├─ All fields present ✓
│  ├─ Email unique ✓
│  ├─ Squat unique ✓
│  ├─ Batch number valid ✓
│  └─ Squat number valid ✓
│
├─ Hashing:
│  ├─ Password → bcryptjs (salt: 10)
│  └─ Hashed: $2a$10$........
│
├─ Database:
│  └─ Insert User document
│
├─ Token Generation:
│  ├─ Payload: { userId, email, role: "user" }
│  ├─ Secret: process.env.JWT_SECRET
│  ├─ Expiry: 7 days
│  └─ Token: eyJhbGc...
│
└─ Response 201:
   ├─ user: { id, name, email, squatNumber, batchNumber, role }
   └─ token: "eyJhbGc..."
```

### **Step 2: Login**
```
┌─ POST /api/auth/login
│
├─ Request Data:
│  ├─ email: "alice@example.com"
│  └─ password: "securePass123"
│
├─ Server:
│  ├─ Find user by email
│  ├─ Compare password with hash (bcryptjs.compare)
│  │  ├─ Match → Continue
│  │  └─ No match → Error: 401
│  ├─ Check: isActive = true
│  │  ├─ TRUE → Continue
│  │  └─ FALSE → Error: 403 "Account deactivated"
│  └─ Generate token (same as registration)
│
└─ Response 200:
   ├─ user: { id, name, email, ... }
   └─ token: "eyJhbGc..."
```

### **Step 3: Protected Request**
```
┌─ GET /api/auth/me
│  Headers: Authorization: Bearer eyJhbGc...
│
├─ Middleware (protect):
│  ├─ Extract token from header
│  ├─ Verify JWT signature
│  ├─ Decode: { userId, email, role }
│  ├─ Valid → Set req.user = decoded
│  └─ Invalid → Error: 401
│
├─ Route Handler:
│  ├─ Access: req.user.userId
│  ├─ Query database
│  └─ Return user profile
│
└─ Response 200:
   └─ user data
```

### **Step 4: Admin Operation**
```
┌─ POST /api/holidays
│  Headers: Authorization: Bearer eyJhbGc...
│  Body: { date, reason }
│
├─ Middleware (protectAdmin):
│  ├─ Run protect middleware first
│  ├─ Check: req.user.role === "admin"
│  ├─ ADMIN → Continue
│  └─ USER → Error: 403 "Admin access required"
│
├─ Controller:
│  └─ Create holiday (allowed)
│
└─ Response 201:
   └─ holiday created
```

---

## 📊 Data Flow Diagrams

### **Auto-Booking Process**

```
┌─────────────────────────────────────────────────────────────┐
│                    12:01 AM CRON JOB                        │
└─────────────────────────────────────────────────────────────┘
           │
           ▼
    ┌──────────────────────┐
    │ Get Scheduled Batch  │  Batch 1 or 2
    │ for Today            │
    └──────────────────────┘
           │
           ▼
    ┌──────────────────────┐
    │ User.find({          │  40 Users
    │   batchNumber,       │
    │   isActive: true     │  Connected
    │ }).limit(40)         │  from DB
    └──────────────────────┘
           │
           ▼
    ┌──────────────────────┐
    │  For Each User:      │◄─────────┐
    │  ┌────────────────┐  │          │
    │  │ Find Seat      │  │       3x Retry
    │  │ ┌────────────┐ │  │       on conflict
    │  │ │1 2 3 4 5   │ │  │
    │  │ │6 7 8 9 10  │ │  │
    │  │ │X X X X X   │ │  │
    │  │ │1 2 3 4 5   │ │  │
    │  │ │FIND EMPTY  │ │  │
    │  │ └────────────┘ │  │
    │  │ Return: Seat 5 │  │
    │  └────────────────┘  │
    │               │       │
    │               ▼       │
    │  ┌────────────────────┐
    │  │ Create Booking     │
    │  │(Atomic, Indexed)   │
    │  │ seatNumber: 5      │◄─────────┘
    │  │ bookingType:       │
    │  │   "scheduled"      │
    │  │ status: "active"   │
    │  └────────────────────┘
    │               │
    │               ▼
    │        Save DB ✓
    │
    └─────────────────┘
           │
           ▼
    ┌──────────────────────┐
    │ Next 40 Users Done   │
    │ ✓ 38 successful      │
    │ ✗ 2 failed           │
    │ Log & Report         │
    └──────────────────────┘
```

### **Spare Booking Process**

```
┌─────────────────────────────────────────────┐
│  User: POST /api/bookings/spare             │
│        {date: "2025-02-25"}                 │
└─────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────┐
│  VALIDATION 1: Holiday Check?               │
│  ├─ Holiday.find({date})                    │
│  ├─ YES → Reject 400                        │
│  └─ NO → Continue                           │
└─────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────┐
│  VALIDATION 2: User Already Booked?         │
│  ├─ Booking.find({userId, date, active})   │
│  ├─ YES → Reject 400                        │
│  └─ NO → Continue                           │
└─────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────┐
│  VALIDATION 3: After 12 PM?                  │
│  ├─ currentHour >= 12                       │
│  ├─ YES → Continue                          │
│  └─ NO → Reject 400                         │
└─────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────┐
│  VALIDATION 4: Spare Slots Available?       │
│  ├─ Booking.count({                         │
│  │    date, bookingType: spare, active     │
│  │ })                                       │
│  ├─ Count < 10 → Continue                   │
│  └─ Count >= 10 → Reject 400                │
└─────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────┐
│  ALLOCATION: Find Free Seat                 │
│  ├─ Query booked seats for date             │
│  ├─ Find first available: Seat 23           │
│  └─ Return Seat 23                          │
└─────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────┐
│  CREATE: Booking with Retry (3x)            │
│  ├─ Create booking                          │
│  │  ├─ MongoDB unique index on              │
│  │  │  (seatNumber, date, status)           │
│  │  ├─ If duplicate → Retry                 │
│  │  └─ Max retries: 3                       │
│  ├─ Success → Return booking                │
│  └─ All retries fail → Reject 409           │
└─────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────┐
│  RESPONSE 201                               │
│  ├─ bookingId                               │
│  ├─ date                                    │
│  ├─ seatNumber: 23                          │
│  ├─ bookingType: "spare"                    │
│  └─ status: "active"                        │
└─────────────────────────────────────────────┘
```

---

## 🌍 Complete API Endpoint Map

```
┌─────────────────────────────────────────────────────────────┐
│                   API ENDPOINT HIERARCHY                    │
└─────────────────────────────────────────────────────────────┘

/api
├── health (GET)
│   └─ Public: Server status
│
├── auth
│   ├─ POST /register (Public)
│   ├─ POST /login (Public)
│   ├─ POST /logout (Protected)
│   ├─ GET /me (Protected)
│   ├─ PUT /update-profile (Protected)
│   └─ PUT /change-password (Protected)
│
├── bookings
│   ├─ POST /spare (Protected)
│   ├─ POST /release (Protected)
│   ├─ GET /my-bookings (Protected)
│   ├─ GET /date/:date (Public)
│   └─ GET /seat-status/:date (Public)
│
├── holidays
│   ├─ POST / (Admin-Protected)
│   ├─ GET / (Public)
│   ├─ GET /:id (Public)
│   ├─ PUT /:id (Admin-Protected)
│   └─ DELETE /:id (Admin-Protected)
│
└── admin
    ├─ POST /trigger-autobooking
    ├─ GET /batch-schedule/:date
    ├─ GET /system-status
    └─ POST /reset-bookings (Test only)
```

---

## 🎯 Key Timelines

### **Booking Availability Timeline**

```
DAY: February 25, 2025 (Tuesday)

┌─────────────────────────────────────────────────────────┐
│ 12:01 AM                                        3:00 PM  │
│ │                                                │        │
│ ▼                                                ▼        │
└─────────────────────────────────────────────────────────┘
  Auto-booking enables     Spare booking opens
  40 scheduled seats       (max 10 more)
  2 spare seats available  Max 50 total booked
```

### **Weekly Batch Rotation (Month View)**

```
FEBRUARY 2025
┌──────────────────────────────────────────────┐
│    WEEK 1 (Days 1-14)      WEEK 2 (15-28)    │
├──────────────────────────────────────────────┤
│ Mon Tue Wed Thu Fri    Mon Tue Wed Thu Fri   │
│  3   4   5   6   7      24  25  26  27  28   │
│
│ Batch 1: Mon-Wed      Batch 1: Thu-Fri
│ Batch 2: Thu-Fri      Batch 2: Mon-Wed
│
│ ✓ Batch 1 books        ✓ Batch 1 books
│   Feb 3,4,5              Feb 20,21,27,28
│ ✓ Batch 2 books        ✓ Batch 2 books
│   Feb 6,7                Feb 24,25,26
└──────────────────────────────────────────────┘
```

---

## 🔒 Security Checkpoints

```
┌────────────────────────────────────────────────────┐
│             SECURITY VALIDATION FLOW              │
└────────────────────────────────────────────────────┘

1. AUTHENTICATION
   ├─ Token present?
   ├─ Token valid/not expired?
   ├─ User exists in database?
   └─ Status: authenticated → req.user set

2. AUTHORIZATION  
   ├─ User role required?
   ├─ User role matches endpoint?
   ├─ User is admin?
   └─ Status: authorized → proceed

3. BUSINESS LOGIC
   ├─ Validation checks (holiday, duplicate, time, slot)
   ├─ Atomic database operations
   ├─ Unique index protection
   └─ Status: validated → execute

4. AUDIT
   ├─ Log: User action
   ├─ Log: Timestamp
   ├─ Log: Status (success/failure)
   └─ Data: Maintained for auditing
```

---

## 📈 Performance Optimization

### **Database Indexes**

```
Booking Collection:
├─ (seatNumber, date) → UNIQUE (when active)
│  └─ Prevents double-booking
├─ (userId, date) → Compound
│  └─ Fast user booking queries
└─ (date) → Single field
   └─ Fast date-range queries

User Collection:
├─ (email) → UNIQUE
│  └─ Fast login queries
└─ (squatNumber) → UNIQUE
   └─ Prevents duplicate squat assignment

Holiday Collection:
└─ (date) → UNIQUE
   └─ Fast holiday lookup
```

### **Query Optimization**

```
Auto-booking:
├─ Lean query: User.lean()
│  └─ Faster (no rich object)
├─ Limit: .limit(40)
│  └─ Fetch only needed users
└─ Index: batchNumber + isActive
   └─ Indexed fields for speed

Spare booking:
├─ Partial index:
│  └─ Only active bookings indexed
├─ Sparse index:
│  └─ Skip null values
└─ Atomic operations:
   └─ Single database roundtrip
```

---

Generated: February 24, 2025
