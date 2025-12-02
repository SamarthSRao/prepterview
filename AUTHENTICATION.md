# Interview Prep Application - Authentication Guide

## Overview
This application now includes a complete authentication system with user signup, login, and protected routes.

## Features

### Authentication
- **User Signup**: Create a new account with email, password, first name, and last name
- **User Login**: Sign in with email and password
- **JWT Token Management**: Secure authentication using JSON Web Tokens
- **Protected Routes**: Dashboard and interview prep features require authentication
- **Persistent Sessions**: User sessions persist across browser refreshes
- **Logout**: Secure logout that clears tokens and user data

### Frontend Routes
- `/login` - Login page
- `/signup` - Signup page
- `/` - Protected dashboard (requires authentication)

### Backend API Endpoints
- `POST /signup` - Create a new user account
- `POST /login` - Authenticate and receive JWT token
- `GET /users` - Get all users (protected)
- `GET /users/:id` - Get specific user (protected)

## Getting Started

### Prerequisites
- PostgreSQL database running
- Go backend server
- Node.js and npm

### Setup

1. **Configure Database**
   - Update `backend/database/db.go` with your PostgreSQL credentials
   - Ensure the `interview_prep` database exists
   - Run database migrations to create the `users` table

2. **Start Backend Server**
   ```bash
   cd backend
   go run main.go
   ```
   Server runs on `http://localhost:8080`

3. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`

## Usage

### Creating an Account
1. Navigate to `http://localhost:5173`
2. Click "Sign up here" or go to `/signup`
3. Fill in your details:
   - First Name
   - Last Name
   - Email
   - Password (minimum 6 characters)
   - Confirm Password
4. Click "Create Account"
5. You'll be automatically logged in and redirected to the dashboard

### Logging In
1. Navigate to `http://localhost:5173/login`
2. Enter your email and password
3. Click "Sign In"
4. You'll be redirected to the dashboard

### Using the Dashboard
Once logged in, you can:
- View your profile information in the header
- Create and manage interview categories
- Add, view, and delete interview questions
- Filter questions by category
- Logout using the logout button

## Technical Details

### Authentication Flow
1. User submits credentials (signup or login)
2. Backend validates and creates/verifies user
3. Backend generates JWT token
4. Frontend stores token in localStorage
5. Frontend includes token in Authorization header for protected requests
6. Backend middleware validates token for protected routes

### Token Storage
- Tokens are stored in `localStorage`
- User data is cached in `localStorage` for quick access
- Tokens are automatically included in axios requests via interceptors

### Protected Routes
The `PrivateRoute` component wraps protected pages and:
- Checks if user is authenticated
- Shows loading state while checking authentication
- Redirects to `/login` if not authenticated
- Renders the protected component if authenticated

## Security Notes
- Passwords are hashed using bcrypt before storage
- JWT tokens expire after a set period (configured in backend)
- Tokens are validated on every protected request
- CORS is configured to only allow requests from the frontend origin

## Troubleshooting

### "Password authentication failed for user postgres"
- Check your PostgreSQL credentials in `backend/database/db.go`
- Ensure PostgreSQL is running
- Verify the database exists

### "Cannot read properties of null"
- Clear localStorage and try logging in again
- Check that backend is running and accessible
- Verify CORS configuration

### Redirect loop on login
- Clear browser cache and localStorage
- Check that token is being properly stored
- Verify backend is returning correct response format

## File Structure
```
frontend/
├── src/
│   ├── components/
│   │   └── PrivateRoute.jsx      # Protected route wrapper
│   ├── context/
│   │   └── AuthContext.jsx       # Authentication state management
│   ├── pages/
│   │   ├── Login.jsx             # Login page
│   │   ├── Signup.jsx            # Signup page
│   │   ├── Dashboard.jsx         # Main dashboard
│   │   └── InterviewPrep.jsx     # Interview prep functionality
│   ├── App.jsx                   # Main app with routing
│   └── main.jsx                  # App entry point

backend/
├── controllers/
│   └── userControllers.go        # User authentication logic
├── middleware/
│   └── auth.go                   # JWT validation middleware
├── models/
│   └── user.go                   # User model
├── routes/
│   └── routes.go                 # Route definitions
└── helpers/
    └── token.go                  # JWT token helpers
```
