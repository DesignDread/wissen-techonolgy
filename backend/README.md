# Seat Booking Backend

A Node.js backend using Express and MongoDB for the Seat Booking application (MERN Stack).

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-Origin Resource Sharing

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/           # Request handlers
│   ├── models/                # Mongoose schemas
│   │   └── User.js           # User model
│   ├── routes/                # API routes
│   │   ├── auth.js           # Authentication routes
│   │   └── users.js          # User routes
│   ├── middleware/            # Custom middleware
│   │   └── auth.js           # JWT authentication
│   ├── services/              # Business logic
│   ├── utils/                 # Utility functions
│   │   ├── errorHandler.js   # Error handling
│   │   └── jwt.js            # JWT utilities
│   └── app.js                # Express app setup
├── server.js                  # Entry point
├── .env.example              # Environment variables template
├── package.json              # Dependencies
└── README.md                 # This file
```

## Getting Started

### Prerequisites

- Node.js >= 14
- MongoDB running locally or MongoDB Atlas URI

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
MONGODB_URI=mongodb://localhost:27017/seatbooking
PORT=5000
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

### Running the Server

**Development mode (with auto-reload):**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

The server will be available at `http://localhost:5000`

## API Endpoints

### Health Check

- `GET /api/health` - Check server status

### Authentication Routes (to be implemented)

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout user

### User Routes (to be implemented)

- `GET /api/users` - Get all users (protected)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user (protected)
- `DELETE /api/users/:id` - Delete user (protected)

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_token_here>
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `PORT` | Server port (default: 5000) |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRE` | JWT expiration time (default: 7d) |
| `NODE_ENV` | Environment (development/production) |

## Development

### File Structure Guidelines

- **controllers/** - Handle request/response logic
- **models/** - Define Mongoose schemas
- **services/** - Implement business logic
- **routes/** - Define API endpoints
- **middleware/** - Custom middleware functions
- **utils/** - Helper functions and utilities
- **config/** - Configuration files

### Adding a New Route

1. Create controller in `src/controllers/`
2. Create route in `src/routes/`
3. Import and use in `src/app.js`

Example:

```javascript
// src/routes/example.js
import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Routes here

export default router;
```

```javascript
// In src/app.js
import exampleRoutes from './routes/example.js';
app.use('/api/example', exampleRoutes);
```

## Error Handling

The application uses a global error handler. All errors are caught and returned with appropriate status codes.

## Security

- Passwords are hashed using bcryptjs
- JWT tokens are used for authentication
- CORS is enabled for secure cross-origin requests
- Environment variables are used for sensitive data

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

ISC
