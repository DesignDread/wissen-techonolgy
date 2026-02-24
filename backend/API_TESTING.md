# API Testing Guide

## Base URL
```
http://localhost:5000
```

## Authentication
Include JWT token in Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📋 Testing Order

1. **Register** - Create new user
2. **Login** - Get JWT token
3. **Get Profile** - Test protected route
4. **Create Holiday** - Test admin route
5. **Check Batch Schedule** - Verify schedule
6. **Trigger Manual Auto-Booking** - Test booking flow
7. **Check Seat Status** - View availability
8. **Book Spare Seat** - After 12 PM
9. **Release Seat** - Test release
10. **Check Seat Status** - Verify availability updated

---

## 📋 Sample API Calls

### 1. Health Check
```bash
curl -X GET http://localhost:5000/api/health
```

---

### 2. Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "password": "password123",
    "squatNumber": 1,
    "batchNumber": 1
  }'
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "squatNumber": 1,
      "batchNumber": 1,
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6ImFsaWNlQGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MDg3ODc0MDAsImV4cCI6MTcwOTM5MjIwMH0.signature"
  }
}
```

**Save the token for next requests**:
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 3. Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123"
  }'
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "squatNumber": 1,
      "batchNumber": 1,
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 4. Get User Profile (Protected)
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "squatNumber": 1,
    "batchNumber": 1,
    "role": "user",
    "isActive": true,
    "createdAt": "2025-02-24T10:00:00.000Z"
  }
}
```

---

### 5. Update Profile (Protected)
```bash
curl -X PUT http://localhost:5000/api/auth/update-profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Updated",
    "batchNumber": 2
  }'
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Alice Updated",
    "email": "alice@example.com",
    "squatNumber": 1,
    "batchNumber": 2,
    "role": "user"
  }
}
```

---

### 6. Change Password (Protected)
```bash
curl -X PUT http://localhost:5000/api/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "password123",
    "newPassword": "newPassword456"
  }'
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### 7. Health Check
```bash
curl -X GET http://localhost:5000/api/health
```

---

### 8. Create Holiday (Admin Only)

**First, register an admin user or use test token**:
```bash
# For testing, manually create admin user in database:
db.users.insertOne({
  name: "Admin User",
  email: "admin@example.com",
  password: "hashed_password",
  squatNumber: 1,
  batchNumber: 1,
  role: "admin"
})
```

```bash
# Login as admin first
ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "adminPassword123"
  }' | jq -r '.data.token')

# Now create holiday with admin token
curl -X POST http://localhost:5000/api/holidays \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-02-24",
    "reason": "National Holiday"
  }'
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Holiday created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "date": "2025-02-24T00:00:00.000Z",
    "reason": "National Holiday",
    "createdAt": "2025-02-24T10:00:00.000Z",
    "updatedAt": "2025-02-24T10:00:00.000Z"
  }
}
```

**Error (Non-Admin User Tries)**:
```bash
# Using regular user token
curl -X POST http://localhost:5000/api/holidays \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-02-25",
    "reason": "Test"
  }'
```

**Response (403)**:
```json
{
  "success": false,
  "message": "Admin access required"
}
```

---

### 10. Create Holiday
```bash
curl -X POST http://localhost:5000/api/holidays \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-02-24",
    "reason": "National Holiday"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Holiday created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "date": "2025-02-24T00:00:00.000Z",
    "reason": "National Holiday",
    "createdAt": "2025-02-24T10:00:00.000Z",
    "updatedAt": "2025-02-24T10:00:00.000Z"
  }
}
```

---

### 11. Get All Holidays
```bash
curl -X GET "http://localhost:5000/api/holidays?fromDate=2025-02-01&toDate=2025-02-28"
```

---

### 12. Get Batch Schedule Info
```bash
curl -X GET http://localhost:5000/api/admin/batch-schedule/2025-02-25
```

**Response**:
```json
{
  "success": true,
  "data": {
    "date": "2025-02-25",
    "dayOfWeek": "Tue",
    "weekOfMonth": 2,
    "isWeekday": true,
    "scheduledBatch": 2,
    "message": "Batch 2 is scheduled for this date"
  }
}
```

---

### 13. Trigger Manual Auto-Booking
```bash
curl -X POST http://localhost:5000/api/admin/trigger-autobooking \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-02-25"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Auto-booking triggered successfully",
  "data": {
    "success": true,
    "date": "2025-02-25T00:00:00.000Z",
    "batch": 2,
    "totalProcessed": 40,
    "successful": 38,
    "failed": 2,
    "failures": [
      {
        "userId": "507f1f77bcf86cd799439012",
        "error": "No available seats"
      }
    ]
  }
}
```

---

### 14. Get Seat Status for a Date
```bash
curl -X GET http://localhost:5000/api/bookings/seat-status/2025-02-25
```

**Response**:
```json
{
  "success": true,
  "data": {
    "date": "2025-02-25T00:00:00.000Z",
    "seats": [
      {
        "seatNumber": 1,
        "status": "occupied",
        "bookingType": "scheduled"
      },
      {
        "seatNumber": 2,
        "status": "occupied",
        "bookingType": "scheduled"
      },
      {
        "seatNumber": 3,
        "status": "available",
        "bookingType": null
      },
      {
        "seatNumber": 4,
        "status": "occupied",
        "bookingType": "spare"
      },
      ...
    ]
  }
}
```

---

### 15. Book Spare Seat (12 PM or Later)
```bash
curl -X POST http://localhost:5000/api/bookings/spare \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-02-26"
  }'
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Spare seat booked successfully",
  "data": {
    "bookingId": "507f1f77bcf86cd799439011",
    "date": "2025-02-26T00:00:00.000Z",
    "seatNumber": 23,
    "bookingType": "spare",
    "status": "active"
  }
}
```

**Response (Error - Before 3 PM)**:
```json
{
  "success": false,
  "message": "Spare seat booking opens at 12 PM. Please try again later"
}
```

**Response (Error - Already Booked)**:
```json
{
  "success": false,
  "message": "You already have a booking for this date"
}
```

---

### 16. Get My Bookings
```bash
curl -X GET "http://localhost:5000/api/bookings/my-bookings?status=active" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response**:
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": {
        "_id": "507f1f77bcf86cd799439000",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "date": "2025-02-25T00:00:00.000Z",
      "seatNumber": 5,
      "bookingType": "scheduled",
      "status": "active",
      "createdAt": "2025-02-25T00:01:30.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "userId": {...},
      "date": "2025-02-26T00:00:00.000Z",
      "seatNumber": 23,
      "bookingType": "spare",
      "status": "active",
      "createdAt": "2025-02-26T15:30:45.000Z"
    }
  ]
}
```

---

### 17. Get Bookings for a Date
```bash
curl -X GET http://localhost:5000/api/bookings/date/2025-02-25
```

**Response**:
```json
{
  "success": true,
  "data": {
    "date": "2025-02-25T00:00:00.000Z",
    "bookings": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "userId": {
          "_id": "507f1f77bcf86cd799439000",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "seatNumber": 5,
        "bookingType": "scheduled",
        "status": "active"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "userId": {...},
        "seatNumber": 23,
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

### 18. Release Seat
```bash
curl -X POST http://localhost:5000/api/bookings/release \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-02-26"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Seat released successfully",
  "data": {
    "bookingId": "507f1f77bcf86cd799439012",
    "date": "2025-02-26T00:00:00.000Z",
    "seatNumber": 23,
    "status": "released"
  }
}
```

---

### 19. Update Holiday
```bash
curl -X PUT http://localhost:5000/api/holidays/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Updated Holiday Reason"
  }'
```

---

### 20. Delete Holiday
```bash
curl -X DELETE http://localhost:5000/api/holidays/507f1f77bcf86cd799439011
```

---

### 21. Get System Status
```bash
curl -X GET http://localhost:5000/api/admin/system-status
```

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "running",
    "uptime": "2h 35m",
    "environment": "development",
    "memory": {
      "rss": "120 MB",
      "heapUsed": "65 MB",
      "heapTotal": "85 MB"
    },
    "timestamp": "2025-02-24T10:30:00.000Z"
  }
}
```

---

### 22. Reset All Bookings (Test Only)
```bash
curl -X POST http://localhost:5000/api/admin/reset-bookings
```

**Response**:
```json
{
  "success": true,
  "message": "All bookings deleted",
  "deletedCount": 42
}
```

---

## 🔄 Complete User Flow Example

### Step 1: User Created with Batch 1
```json
{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "password": "hashedPassword123",
  "squatNumber": 5,
  "batchNumber": 1
}
```

### Step 2: Check Schedule for Feb 5 (Tuesday, Week 1)
```bash
curl -X GET http://localhost:5000/api/admin/batch-schedule/2025-02-05
```

Result:
```
Batch 1 is scheduled Monday-Wednesday of Week 1 ✓
```

### Step 3: Auto-Booking Triggers at 12:01 AM on Feb 5
- 40 users from Batch 1 automatically booked
- Alice gets Seat 5

### Step 4: Alice checks her bookings at 2:50 PM
```bash
curl -X GET http://localhost:5000/api/bookings/my-bookings \
  -H "Authorization: Bearer <TOKEN>"
```

Shows: Seat 5 on Feb 5 (scheduled)

### Step 5: Alice tries to book spare about spares at 2:55 PM
```bash
curl -X POST http://localhost:5000/api/bookings/spare \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"date": "2025-02-06"}'
```

Response: ❌ "Spare seat booking opens at 3 PM"

### Step 6: Alice tries again at 3:05 PM on Feb 6
```bash
curl -X POST http://localhost:5000/api/bookings/spare \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"date": "2025-02-06"}'
```

Response: ✓ Booked Seat 23 (spare)

### Step 7: Check seat status on Feb 6
```bash
curl -X GET http://localhost:5000/api/bookings/seat-status/2025-02-06
```

Shows:
- 40 scheduled seats (1-40)
- 2 spare seats including Seat 23
- 8 available seats

### Step 8: Alice releases Seat 5 on Feb 5
```bash
curl -X POST http://localhost:5000/api/bookings/release \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"date": "2025-02-05"}'
```

Response: ✓ Status changed to "released"

---

## 📝 Quick Reference

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/health` | GET | ❌ | Health check |
| `/api/bookings/spare` | POST | ✅ | Book spare seat |
| `/api/bookings/release` | POST | ✅ | Release booking |
| `/api/bookings/my-bookings` | GET | ✅ | Get user bookings |
| `/api/bookings/date/:date` | GET | ❌ | Get date bookings |
| `/api/bookings/seat-status/:date` | GET | ❌ | Get seat availability |
| `/api/holidays` | GET | ❌ | List holidays |
| `/api/holidays` | POST | ❌ | Create holiday |
| `/api/holidays/:id` | GET | ❌ | Get holiday |
| `/api/holidays/:id` | PUT | ❌ | Update holiday |
| `/api/holidays/:id` | DELETE | ❌ | Delete holiday |
| `/api/admin/trigger-autobooking` | POST | ❌ | Manual trigger booking |
| `/api/admin/batch-schedule/:date` | GET | ❌ | Get schedule info |
| `/api/admin/system-status` | GET | ❌ | System stats |
| `/api/admin/reset-bookings` | POST | ❌ | Reset all bookings |

---

## 🛠️ Debugging Tips

### Get detailed logs
Enable debug mode in environment:
```env
NODE_ENV=development
```

### Check CRON job
Look for logs:
```
[CRON] Daily auto-booking scheduled for 12:01 AM every day
[AUTO-BOOKING] Starting auto-booking process for Mon Feb 24 2025
```

### Test with specific date
Use admin endpoint to test auto-booking for any date:
```bash
curl -X POST http://localhost:5000/api/admin/trigger-autobooking \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-02-25"}'
```

### Check database directly
```javascript
db.bookings.find({ date: ISODate("2025-02-25") }).count()
```

---

Generated: February 2025
