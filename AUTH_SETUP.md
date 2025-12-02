# Authentication System - PostgreSQL Migration

## What Was Fixed

I've converted your MongoDB-based authentication code to work with PostgreSQL. Here's what was changed:

### Files Created/Updated:

1. **schema.sql** - Added users table:
   ```sql
   CREATE TABLE IF NOT EXISTS users (
       id SERIAL PRIMARY KEY,
       first_name VARCHAR(100) NOT NULL,
       last_name VARCHAR(100) NOT NULL,
       email VARCHAR(255) UNIQUE NOT NULL,
       password VARCHAR(255) NOT NULL,
       phone VARCHAR(20),
       role VARCHAR(20) DEFAULT 'USER',
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

2. **models/user.go** - PostgreSQL-compatible User model with proper validation tags

3. **helpers/token.go** - JWT token generation and validation using `golang-jwt/jwt/v5`

4. **middleware/auth.go** - Authentication middleware for protected routes

5. **controllers/userControllers.go** - User controllers with:
   - Signup (with password hashing)
   - Login (with JWT token generation)
   - GetUsers (admin only)
   - GetUser (user can see own profile, admin can see all)

6. **routes/routes.go** - Route setup with protected routes

7. **main.go** - Updated to include auth routes and Authorization header in CORS

## Required Dependencies

Run this in the backend directory:
```bash
go get github.com/golang-jwt/jwt/v5 github.com/go-playground/validator/v10 golang.org/x/crypto/bcrypt
```

## Database Setup

You need to create the users table. Use your preferred PostgreSQL client (pgAdmin, DBeaver, etc.) and run:
```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Public Routes:
- `POST /signup` - Register new user
- `POST /login` - Login and get JWT token

### Protected Routes (require Authorization header):
- `GET /users` - Get all users (ADMIN only)
- `GET /users/:id` - Get specific user (own profile or ADMIN)

## Usage Example

### Signup:
```bash
POST /signup
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890",
  "role": "USER"
}
```

### Login:
```bash
POST /login
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Protected Request:
```bash
GET /users
Headers:
  Authorization: Bearer <your_jwt_token>
```

## Next Steps

1. Create the users table in your database
2. Rebuild the backend: `go build -o main.exe`
3. Run the server: `./main.exe`
4. Test the endpoints with Postman or curl

## Security Note

The JWT secret key is currently hardcoded in `helpers/token.go`. In production, you should:
1. Use an environment variable for the secret key
2. Use a strong, randomly generated key
3. Consider implementing refresh tokens
