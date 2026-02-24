# 🎨 Frontend Integration Guide

**Purpose**: Connect your Next.js frontend to the MERN backend  
**Status**: Integration guide for frontend developers  
**Backend URL**: `http://localhost:5000`

---

## 🔗 API Connection Setup

### Step 1: Create API Client (`lib/api.ts`)

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Helper to get token from localStorage
const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

// API request wrapper
export const apiCall = async (
  endpoint: string,
  options: RequestInit = {},
  requireAuth = false
) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Add authorization header if token exists
  const token = getToken();
  if (requireAuth || token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
};

// Specific API calls
export const auth = {
  register: (credentials: Any) =>
    apiCall('/api/auth/register', { method: 'POST', body: JSON.stringify(credentials) }),
  
  login: (credentials: Any) =>
    apiCall('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  
  getProfile: () =>
    apiCall('/api/auth/me', { method: 'GET' }, true),
  
  updateProfile: (data: Any) =>
    apiCall('/api/auth/update-profile', { method: 'PUT', body: JSON.stringify(data) }, true),
  
  changePassword: (data: Any) =>
    apiCall('/api/auth/change-password', { method: 'PUT', body: JSON.stringify(data) }, true),
};

export const bookings = {
  getMyBookings: (date?: string) => {
    const url = date ? `/api/bookings/my-bookings?date=${date}` : '/api/bookings/my-bookings';
    return apiCall(url, { method: 'GET' }, true);
  },
  
  bookSpare: (date: string) =>
    apiCall('/api/bookings/spare', { method: 'POST', body: JSON.stringify({ date }) }, true),
  
  releaseSeat: (date: string) =>
    apiCall('/api/bookings/release', { method: 'POST', body: JSON.stringify({ date }) }, true),
  
  getDateBookings: (date: string) =>
    apiCall(`/api/bookings/date/${date}`, { method: 'GET' }),
  
  getSeatStatus: (date: string) =>
    apiCall(`/api/bookings/seat-status/${date}`, { method: 'GET' }),
};

export const holidays = {
  list: () =>
    apiCall('/api/holidays', { method: 'GET' }),
  
  get: (id: string) =>
    apiCall(`/api/holidays/${id}`, { method: 'GET' }),
  
  create: (data: Any) =>
    apiCall('/api/holidays', { method: 'POST', body: JSON.stringify(data) }, true),
  
  update: (id: string, data: Any) =>
    apiCall(`/api/holidays/${id}`, { method: 'PUT', body: JSON.stringify(data) }, true),
  
  delete: (id: string) =>
    apiCall(`/api/holidays/${id}`, { method: 'DELETE' }, true),
};

export const admin = {
  triggerAutobooking: (date?: string) =>
    apiCall('/api/admin/trigger-autobooking', {
      method: 'POST',
      body: JSON.stringify(date ? { date } : {}),
    }),
  
  getBatchSchedule: (date: string) =>
    apiCall(`/api/admin/batch-schedule/${date}`, { method: 'GET' }),
  
  getSystemStatus: () =>
    apiCall('/api/admin/system-status', { method: 'GET' }),
};
```

---

## 🔐 Authentication Context

### Create Auth Context (`context/AuthContext.tsx`)

```typescript
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '@/lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  squatNumber: number;
  batchNumber: number;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  register: (credentials: Any) => Promise<void>;
  login: (credentials: Any) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      // Optionally fetch user profile here
    }
    setIsLoading(false);
  }, []);

  const register = async (credentials: Any) => {
    const response = await auth.register(credentials);
    setToken(response.data.token);
    setUser(response.data.user);
    localStorage.setItem('token', response.data.token);
  };

  const login = async (credentials: Any) => {
    const response = await auth.login(credentials);
    setToken(response.data.token);
    setUser(response.data.user);
    localStorage.setItem('token', response.data.token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const updateProfile = async (data: Partial<User>) => {
    const response = await auth.updateProfile(data);
    setUser(response.data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        register,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## 📝 Component Examples

### Login Component (`components/auth/LoginForm.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login({ email, password });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded-lg"
          disabled={loading}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded-lg"
          disabled={loading}
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

---

### Seat Matrix Component (`components/bookings/SeatMatrix.tsx`)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { bookings } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Seat {
  seatNumber: number;
  status: 'available' | 'scheduled' | 'spare';
  bookingType?: string;
}

export default function SeatMatrix({ date }: { date: string }) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const response = await bookings.getSeatStatus(date);
        setSeats(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [date]);

  const handleBookSeat = async () => {
    if (!token) {
      setError('Please login to book a seat');
      return;
    }

    try {
      setBooking(true);
      await bookings.bookSpare(date);
      // Refresh seats
      const response = await bookings.getSeatStatus(date);
      setSeats(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div>Loading seats...</div>;

  return (
    <div className="space-y-4">
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid grid-cols-10 gap-2">
        {seats.map((seat) => (
          <div
            key={seat.seatNumber}
            className={`
              p-3 rounded-lg text-center font-semibold cursor-pointer
              ${seat.status === 'available' ? 'bg-green-200 hover:bg-green-300' : ''}
              ${seat.status === 'scheduled' ? 'bg-blue-200' : ''}
              ${seat.status === 'spare' ? 'bg-purple-200' : ''}
            `}
          >
            {seat.seatNumber}
          </div>
        ))}
      </div>

      {token && (
        <button
          onClick={handleBookSeat}
          disabled={booking}
          className="bg-green-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
        >
          {booking ? 'Booking...' : 'Book Available Seat'}
        </button>
      )}
    </div>
  );
}
```

---

### My Bookings Component (`components/bookings/MyBookings.tsx`)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { bookings } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Booking {
  _id: string;
  date: string;
  seatNumber: number;
  bookingType: string;
  status: string;
}

export default function MyBookings() {
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    const fetchBookings = async () => {
      if (!token) return;

      try {
        const response = await bookings.getMyBookings();
        setMyBookings(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [token]);

  const handleRelease = async (date: string) => {
    try {
      await bookings.releaseSeat(date);
      setMyBookings(myBookings.filter((b) => b.date !== date));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!token) return <p>Please login to view your bookings</p>;
  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      {myBookings.length === 0 ? (
        <p>No bookings yet</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Date</th>
              <th className="text-left p-2">Seat</th>
              <th className="text-left p-2">Type</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {myBookings.map((booking) => (
              <tr key={booking._id} className="border-b">
                <td className="p-2">{booking.date}</td>
                <td className="p-2">{booking.seatNumber}</td>
                <td className="p-2">{booking.bookingType}</td>
                <td className="p-2">{booking.status}</td>
                <td className="p-2">
                  <button
                    onClick={() => handleRelease(booking.date)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Release
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

---

## 🛡️ Protected Routes

### Protected Layout (`app/dashboard/layout.tsx`)

```typescript
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
```

---

## ⚙️ Environment Variables

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### `frontend/.env.production`

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

## 🔄 State Management Options

### Option 1: React Context (Recommended for small projects)
- Included above
- No extra dependencies
- Simple to understand

### Option 2: Redux
```bash
npm install @reduxjs/toolkit react-redux
```

### Option 3: Zustand
```bash
npm install zustand
```

---

## 💾 LocalStorage Management

```typescript
// Save token
localStorage.setItem('token', token);

// Retrieve token
const token = localStorage.getItem('token');

// Clear token
localStorage.removeItem('token');

// Save user preferences
localStorage.setItem('user', JSON.stringify(user));
```

---

## 🚀 Deployment Considerations

### Backend Deployment (Vercel, Render, Railway, etc.)

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/seatbooking
JWT_SECRET=your_very_long_secret_key_change_this
NODE_ENV=production
PORT=5000
```

### Frontend Deployment (Vercel)

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

### CORS Configuration Update

When deploying frontend to different domain, update backend:

```javascript
// src/app.js
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true
}));
```

---

## 🐛 Error Handling

```typescript
try {
  await bookings.bookSpare(date);
} catch (error: any) {
  // Handle specific errors
  if (error.message.includes('3 PM')) {
    // Show: "Booking opens at 3 PM"
  } else if (error.message.includes('holiday')) {
    // Show: "No bookings allowed on holidays"
  } else if (error.message.includes('already')) {
    // Show: "You already have a booking for this date"
  } else {
    // Show generic error
  }
}
```

---

## 📱 Responsive Design Tips

```typescript
// Use Tailwind breakpoints
<div className="grid grid-cols-5 md:grid-cols-10 gap-2">
  {/* Mobile: 5 columns, Desktop: 10 columns */}
</div>
```

---

## 🎯 Component Checklist

- [ ] Login page (`/login`)
- [ ] Register page (`/register`)
- [ ] Dashboard (`/dashboard`)
- [ ] Booking page (`/dashboard/bookings`)
- [ ] My bookings (`/dashboard/my-bookings`)
- [ ] Holiday calendar (`/dashboard/holidays`)
- [ ] Profile page (`/dashboard/profile`)
- [ ] Admin panel (`/admin`) - for managing holidays
- [ ] Navbar with logout
- [ ] Loading spinners
- [ ] Error toast notifications
- [ ] Success notifications

---

## 📞 Testing Checklist

- [ ] Register → Login → View Profile flow
- [ ] Book spare seat → View in my bookings → Release
- [ ] Check seat availability for different dates
- [ ] View holidays
- [ ] Admin: Add/Edit/Delete holidays
- [ ] Logout → Access protected route (redirect to login)
- [ ] Expired token handling
- [ ] Network error handling
- [ ] Form validation

---

## 🚀 Quick Integration Checklist

1. [ ] Copy API client code (`lib/api.ts`)
2. [ ] Create Auth Context (`context/AuthContext.tsx`)
3. [ ] Add AuthProvider to root layout
4. [ ] Create Login component
5. [ ] Create Register component
6. [ ] Create Dashboard layout (protected)
7. [ ] Create Seat Matrix component
8. [ ] Create My Bookings component
9. [ ] Set environment variables
10. [ ] Test complete flow

---

## 📚 Next.js Best Practices

```typescript
// Use 'use client' for components with hooks
'use client';

// Use server components for data fetching when possible
export default async function Page() {
  const data = await fetch('...').then(r => r.json());
  return <div>{data}</div>;
}

// Use dynamic imports for better performance
const MyComponent = dynamic(() => import('./MyComponent'));
```

---

## 🎬 Getting Started Commands

```bash
# Frontend
cd frontend
npm install
npm run dev
# Open http://localhost:3000

# Backend (separate terminal)
cd backend
npm install
npm run dev
# Server runs on http://localhost:5000
```

---

**Ready to integrate?** 🚀  
Start with creating the API client and Auth Context, then build components one by one.

For questions, refer to [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md) and [API_TESTING.md](./API_TESTING.md) files.
