# 🔐 Authentication & Authorization Guide

## Overview

The system uses JWT (JSON Web Tokens) for authentication and role-based access control for authorization.

---

## 🎯 Authentication Flow

### 1. User Registration
```
User submits: name, email, password, squatNumber (1-10), batchNumber (1 or 2)
    ↓
Server validates all fields
    ↓
Email is unique check
    ↓
Squat number is unique check
    ↓
Password is hashed (bcryptjs)
    ↓
User created in database
    ↓
JWT token generated
    ↓
Client receives: user data + token
```

### 2. User Login
```
User submits: email, password
    ↓
Server finds user by email
    ↓
Compare password with hash
    ↓
Verify user is active
    ↓
JWT token generated
    ↓
Client receives: user data + token
```

### 3. Subsequent Requests
```
Client sends: Authorization: Bearer <TOKEN>
    ↓
Server verifies JWT signature
    ↓
Extract user ID, email, role from token
    ↓
Set req.user with decoded data
    ↓
Route handler executes with user context
```

---

## 🔑 JWT Structure

```javascript
{
  userId: "507f1f77bcf86cd799439011",
  email: "john@example.com",
  role: "user" | "admin",
  iat: 1708787400,  // issued at
  exp: 1709392200   // expires at (7 days)
}
```

**Key Configuration**:
- Secret: `process.env.JWT_SECRET`
- Expiration: `process.env.JWT_EXPIRE` (default: 7 days)
- Algorithm: HS256

---

## 👤 User Roles

### **User Role** (Default)
- Can book seats
- Can release seats
- Can view their own profile
- Can view public booking info
- Can view holidays

### **Admin Role**
- All user permissions
- Can create/update/delete holidays
- Can access admin endpoints
- Can trigger manual auto-booking
- Can view system status

---

## 🔒 Middleware

### **protect** - Authentication Required
Checks for valid JWT token in Authorization header.

```javascript
app.use('/api/bookings/spare', protect, bookSpareController)
```

Usage:
```
Header: Authorization: Bearer eyJhbGciOiJIUzI1NiI...
```

**Response if missing/invalid**:
```json
{
  "success": false,
  "message": "No token provided. Authorization denied"
}
```

---

### **requireAdmin** - Admin Role Required
Extends `protect` - requires admin role.

```javascript
app.use('/api/holidays', requireAdmin, createHolidayController)
```

**Response if not admin**:
```json
{
  "success": false,
  "message": "Admin access required"
}
```

---

### **protectAdmin** - Combined Middleware
Middleware chain that applies both `protect` and `requireAdmin`.

```javascript
// Equivalent to: [protect, requireAdmin]
app.use('/api/holidays', protectAdmin, createHolidayController)
```

---

### **optionalAuth** - Token Optional
Extracts user if token provided, but doesn't fail if missing.

```javascript
app.use('/api/bookings/date/:date', optionalAuth, getBookingByDateController)
```

---

## 📡 API Endpoints

### Authentication Routes

#### **POST /api/auth/register**
Register a new user.

**Request**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "squatNumber": 5,
  "batchNumber": 1
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "squatNumber": 5,
      "batchNumber": 1,
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors**:
- 400: Missing fields, email already exists, invalid batch/squat
- 409: Squat number or email already taken

---

#### **POST /api/auth/login**
Login user.

**Request**:
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "squatNumber": 5,
      "batchNumber": 1,
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors**:
- 401: Invalid email or password
- 403: Account deactivated

---

#### **GET /api/auth/me**
Get current user profile (protected).

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiI...
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "squatNumber": 5,
    "batchNumber": 1,
    "role": "user",
    "isActive": true,
    "createdAt": "2025-02-24T10:00:00.000Z"
  }
}
```

**Errors**:
- 401: Invalid or missing token
- 404: User not found

---

#### **PUT /api/auth/update-profile**
Update user profile (protected).

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiI...
Content-Type: application/json
```

**Request**:
```json
{
  "name": "Jane Doe",
  "batchNumber": 2
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Jane Doe",
    "email": "john@example.com",
    "squatNumber": 5,
    "batchNumber": 2,
    "role": "user"
  }
}
```

**Notes**:
- `squatNumber` cannot be changed after registration
- Only `name` and `batchNumber` can be updated

---

#### **PUT /api/auth/change-password**
Change password (protected).

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiI...
```

**Request**:
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Errors**:
- 401: Current password is incorrect
- 400: Missing current or new password

---

#### **POST /api/auth/logout**
Logout user.

**Response (200)**:
```json
{
  "success": true,
  "message": "Logout successful. Please delete token from client."
}
```

**Note**: Token invalidation happens on client-side by deleting the stored token. Server doesn't maintain a token blacklist in this implementation.

---

## 🎫 Token Management

### Storing Token (Client-side)

**localStorage** (Persistent):
```javascript
localStorage.setItem('token', response.data.token);
```

**sessionStorage** (Session-only):
```javascript
sessionStorage.setItem('token', response.data.token);
```

**Memory** (Most secure, lost on refresh):
```javascript
let authToken = response.data.token;
```

### Sending Token (Client-side)

```javascript
const token = localStorage.getItem('token');

const response = await fetch('/api/bookings/spare', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ date: '2025-02-25' })
});
```

### Removing Token (Logout)

```javascript
localStorage.removeItem('token');
sessionStorage.removeItem('token');
authToken = null;
// Redirect to login page
window.location.href = '/login';
```

---

## 🔐 Security Best Practices

### 1. **HTTPS Only**
- Use HTTPS in production
- Set token cookie with `Secure` flag

### 2. **Token Expiration**
- Default: 7 days
- Shorter for sensitive operations (e.g., 1 hour)
- Implement refresh token pattern for long sessions

### 3. **CORS Configuration**
```javascript
// Only allowed origins can access API
app.use(cors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true
}));
```

### 4. **Rate Limiting** (Optional)
Prevent brute force attacks:
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 attempts
});

app.use('/api/auth/login', loginLimiter);
```

### 5. **Password Strategy**
- Minimum 6 characters (enforce 8+ in production)
- Hashed with bcryptjs (salt rounds: 10)
- Never transmitted in plain text
- Never logged or stored

### 6. **Environment Variables**
```env
JWT_SECRET=your_very_long_random_secret_key_here_min_32_chars
JWT_EXPIRE=7d
```

---

## 📋 Protected Routes Reference

### User Routes (Authentication Required)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/bookings/spare` | ✅ | Book spare seat |
| POST | `/api/bookings/release` | ✅ | Release booking |
| GET | `/api/bookings/my-bookings` | ✅ | Get user bookings |
| GET | `/api/auth/me` | ✅ | Get profile |
| PUT | `/api/auth/update-profile` | ✅ | Update profile |
| PUT | `/api/auth/change-password` | ✅ | Change password |

### Admin Routes (Authentication + Admin Role Required)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/holidays` | ✅ | Create holiday |
| PUT | `/api/holidays/:id` | ✅ | Update holiday |
| DELETE | `/api/holidays/:id` | ✅ | Delete holiday |
| POST | `/api/admin/trigger-autobooking` | ✅ | Manual booking trigger |

### Public Routes (No Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/bookings/date/:date` | Get bookings for date |
| GET | `/api/bookings/seat-status/:date` | Get seat availability |
| GET | `/api/holidays` | Get all holidays |

---

## 🧪 Testing Authentication

### 1. Register User
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

### 2. Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Use Token in Protected Request
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Book Spare Seat (Protected)
```bash
curl -X POST http://localhost:5000/api/bookings/spare \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-02-25"}'
```

### 5. Try Admin Operation (Non-Admin User)
```bash
curl -X POST http://localhost:5000/api/holidays \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-02-28", "reason": "Test"}'
```

Response: 403 Forbidden - Admin access required

---

## 🔄 Token Refresh (Optional Implementation)

For better security, implement refresh token pattern:

```javascript
// Generate both access and refresh tokens
const accessToken = generateToken(user._id, user.email, user.role, '1h');
const refreshToken = generateToken(user._id, user.email, user.role, '7d');

// Store refresh token in database or cache
await RefreshToken.create({ userId: user._id, token: refreshToken });

// Return both tokens
res.json({ accessToken, refreshToken });
```

Refresh endpoint:
```javascript
POST /api/auth/refresh
Body: { refreshToken: "..." }
Response: { accessToken: "..." }
```

---

## ⚠️ Common Errors

### "No token provided"
```
Status: 401
Cause: Missing Authorization header
Solution: Include Authorization header with Bearer token
```

### "Invalid or expired token"
```
Status: 401
Cause: Token signature invalid or expired
Solution: Login again to get new token
```

### "Admin access required"
```
Status: 403
Cause: User role is not 'admin'
Solution: Use admin account or request admin privileges
```

### "Invalid email or password"
```
Status: 401
Cause: Email doesn't exist or password incorrect
Solution: Check credentials and try again
```

### "Email already registered"
```
Status: 400
Cause: Email already exists in database
Solution: Use different email or login if already registered
```

### "This squat number is already taken"
```
Status: 400
Cause: Another user already assigned this squat number
Solution: Choose squat number between 1-10 that's available
```

---

## 📊 System Flow Integration

### Complete User Journey

```
1. User Registration (Public)
   POST /api/auth/register
   ↓
2. Receive JWT Token
   ↓
3. Check Batch Schedule
   GET /api/admin/batch-schedule/2025-02-25
   ↓
4. At 12:01 AM - Auto-Booking Triggers
   Batch 1 users auto-booked to 40 seats
   ↓
5. User checks their booking (Protected)
   GET /api/bookings/my-bookings (Token required)
   ↓
6. At 3:00 PM - Spare Booking Opens
   POST /api/bookings/spare (Token required)
   ↓
7. User can release if needed
   POST /api/bookings/release (Token required)
   ↓
8. Admin can manage holidays
   POST /api/holidays (Admin Token required)
```

---

## 🚀 Frontend Integration Example

```javascript
// React Example

const [token, setToken] = useState(localStorage.getItem('token'));

// Login
const handleLogin = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  if (data.success) {
    localStorage.setItem('token', data.data.token);
    setToken(data.data.token);
  }
};

// Protected API Call
const bookSpareSeat = async (date) => {
  const response = await fetch('/api/bookings/spare', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ date })
  });
  
  return await response.json();
};

// Logout
const handleLogout = () => {
  localStorage.removeItem('token');
  setToken(null);
};
```

---

Generated: February 24, 2025
