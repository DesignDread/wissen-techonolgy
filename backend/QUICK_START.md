# 📖 Quick Start & Reference

## 🚀 Quick Start (5 Minutes)

### 1. Prerequisites
- Node.js installed
- MongoDB running
- Backend folder open

### 2. Install & Setup
```bash
cd backend
npm install
cp .env.example .env
# Update .env with MongoDB URI and JWT_SECRET
```

### 3. Start Server
```bash
npm run dev
```

You should see:
```
🚀 Server is running on http://localhost:5000
[CRON] Daily auto-booking scheduled for 12:01 AM every day
```

### 4. Test Health
```bash
curl http://localhost:5000/api/health
```

---

## 👤 User Registration Flow

### Step 1: Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "squatNumber": 5,
    "batchNumber": 1
  }'
```

**Save the returned `token` for next requests**

### Step 2: Check it works
```bash
TOKEN="your_token_here"

curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📅 Booking Workflow

### Check if today is scheduled
```bash
curl http://localhost:5000/api/admin/batch-schedule/2025-02-25
```

### View available seats (no login needed)
```bash
curl http://localhost:5000/api/bookings/seat-status/2025-02-25
```

### Book spare seat (12 PM or later, needs login)
```bash
TOKEN="your_token_here"

curl -X POST http://localhost:5000/api/bookings/spare \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-02-25"}'
```

### View my bookings
```bash
curl -X GET http://localhost:5000/api/bookings/my-bookings \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🎉 Complete Endpoint Reference

### Authentication

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/register` | POST | ❌ | Create account |
| `/api/auth/login` | POST | ❌ | Get token |
| `/api/auth/me` | GET | ✅ | Get profile |
| `/api/auth/update-profile` | PUT | ✅ | Update name/batch |
| `/api/auth/change-password` | PUT | ✅ | Change password |
| `/api/auth/logout` | POST | ✅ | Logout |

### Bookings

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/bookings/spare` | POST | ✅ | Book spare seat |
| `/api/bookings/release` | POST | ✅ | Release booking |
| `/api/bookings/my-bookings` | GET | ✅ | My bookings |
| `/api/bookings/date/:date` | GET | ❌ | Date bookings |
| `/api/bookings/seat-status/:date` | GET | ❌ | Seat availability |

### Holidays

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/holidays` | GET | ❌ | List holidays |
| `/api/holidays` | POST | 🔐 | Create (admin) |
| `/api/holidays/:id` | GET | ❌ | Get holiday |
| `/api/holidays/:id` | PUT | 🔐 | Update (admin) |
| `/api/holidays/:id` | DELETE | 🔐 | Delete (admin) |

### Admin

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/admin/trigger-autobooking` | POST | ❌ | Manual booking |
| `/api/admin/batch-schedule/:date` | GET | ❌ | Check schedule |
| `/api/admin/system-status` | GET | ❌ | System health |

**Auth Legend**: ❌ = Public | ✅ = User (login required) | 🔐 = Admin only

---

## 🔐 Authentication

### Get Token

```bash
# Save the token from login or register response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Use Token in Requests

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Or in JavaScript
fetch('/api/bookings/spare', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ date: '2025-02-25' })
})
```

---

## 📊 Batch Schedule

### Current Week Schedule

```
BATCH 1:
  Week 1 (1-14):  Mon, Tue, Wed
  Week 2 (15-31): Thu, Fri

BATCH 2:
  Week 1 (1-14):  Thu, Fri
  Week 2 (15-31): Mon, Tue, Wed
```

### Check Schedule for a Date
```bash
curl http://localhost:5000/api/admin/batch-schedule/2025-02-25
```

Response:
```json
{
  "date": "2025-02-25",
  "dayOfWeek": "Tue",
  "weekOfMonth": 2,
  "isWeekday": true,
  "scheduledBatch": 2,
  "message": "Batch 2 is scheduled for this date"
}
```

---

## ⏰ Daily Timeline

### 12:01 AM - Auto-Booking
```
✓ 40 scheduled seats automatically booked
✓ Users from today's batch assigned seats
✓ Check logs: "AUTO-BOOKING STARTED"
```

### 1:00 AM - 2:59 PM
```
❌ Cannot book spare seats yet
❌ API rejects with: "Booking opens at 12 PM"
```

### 3:00 PM - Spare Booking Opens
```
✓ Can now book available seats
✓ Max 10 spare bookings allowed
✓ Can book until 11:59 PM
```

### Anytime - Release Seat
```
✓ Can release booking
✓ Seat immediately available for others
✓ Status changed to "released"
```

---

## 🧪 Testing Examples

### Scenario 1: Auto-Booking Test
```bash
# Check if today is a scheduled day
curl http://localhost:5000/api/admin/batch-schedule/2025-02-25

# Trigger manual auto-booking for testing
curl -X POST http://localhost:5000/api/admin/trigger-autobooking \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-02-25"}'

# Check seat status after booking
curl http://localhost:5000/api/bookings/seat-status/2025-02-25
```

### Scenario 2: Spare Booking Test
```bash
TOKEN="your_token"

# Check availability
curl http://localhost:5000/api/bookings/seat-status/2025-02-25

# Book spare seat (must be after 12 PM)
curl -X POST http://localhost:5000/api/bookings/spare \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-02-25"}'

# Check my bookings
curl -X GET http://localhost:5000/api/bookings/my-bookings \
  -H "Authorization: Bearer $TOKEN"

# Release seat
curl -X POST http://localhost:5000/api/bookings/release \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-02-25"}'
```

---

## 🔧 Environment Configuration

File: `.env`

```env
# Database
MONGODB_URI=mongodb://localhost:27017/seatbooking

# Server
PORT=5000
NODE_ENV=development

# Authentication
JWT_SECRET=your_very_long_secret_key_here_minimum_32_characters
JWT_EXPIRE=7d
```

---

## 📝 Common Scenarios

### "I want to book a seat"

1. Check schedule
   ```bash
   curl http://localhost:5000/api/admin/batch-schedule/TODAY
   ```

2. If scheduled (auto-booked):
   - Your seat assigned automatically at 12:01 AM
   - Check booking: `/api/bookings/my-bookings`

3. If spare slot:
   - Wait until 12 PM
   - Call `/api/bookings/spare`
   - Confirm booking returned

### "I want to see available seats"

```bash
curl http://localhost:5000/api/bookings/seat-status/2025-02-25
```

Response shows all 50 seats with status and type.

### "I want to release my seat"

```bash
TOKEN="your_token"
curl -X POST http://localhost:5000/api/bookings/release \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"date": "2025-02-25"}'
```

Seat immediately available for others.

### "I want to create a holiday"

```bash
ADMIN_TOKEN="admin_token_here"
curl -X POST http://localhost:5000/api/holidays \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-02-28",
    "reason": "Company Holiday"
  }'
```

---

## ❌ Common Errors & Solutions

### Error: "No token provided"
**Solution**: Add Authorization header with Bearer token
```bash
-H "Authorization: Bearer $TOKEN"
```

### Error: "Spare seat booking opens at 12 PM"
**Solution**: Wait until 3:00 PM or later to book spare seats

### Error: "You already have a booking for this date"
**Solution**: You can only have 1 active booking per day. Release existing or book different date.

### Error: "All spare seats have been booked"
**Solution**: Max 10 spare bookings per day. Try another date.

### Error: "Admin access required"
**Solution**: Use admin account token for holiday/admin operations

### Error: "Email already registered"
**Solution**: Use different email or login with existing account

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Project overview |
| `AUTHENTICATION_GUIDE.md` | Auth system details |
| `BOOKING_GUIDE.md` | Booking system details |
| `SYSTEM_FLOW.md` | Complete system architecture |
| `API_TESTING.md` | Full API examples |
| `IMPLEMENTATION_SUMMARY.md` | Technical reference |
| `QUICK_START.md` | This file |

---

## 🚀 Next Steps

1. **Frontend Integration**
   - Create login/register pages
   - Display seat matrix
   - Show booking status
   - Enable spare booking after 12 PM

2. **Database Seeding**
   - Add test users with different batches
   - Create test holidays
   - Pre-populate holidays for year

3. **Email Notifications**
   - Send confirmation on booking
   - Notify on seat release
   - Holiday announcements

4. **Analytics Dashboard**
   - Booking statistics
   - User engagement
   - Peak hours analysis

---

## 📞 Support

**Issues?**

1. Check relevant documentation file
2. Review error message carefully
3. Check `.env` configuration
4. Verify MongoDB connection
5. Check server logs: `npm run dev`

**Common Issues**:
- "Cannot connect to database" → Check MongoDB URI
- "Token invalid" → Token expired, login again
- "404 not found" → Check endpoint path

---

Generated: February 24, 2025  
Status: ✅ Complete & Ready
