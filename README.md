# Interview Prep

A full-stack interview preparation application built with Go, React, and PostgreSQL.

## Features

- 📚 Organize interview questions by categories
- ✍️ Add questions with answers and difficulty levels
- 🔍 Filter questions by category
- 🎨 Modern UI with Tailwind CSS
- 🗑️ Delete questions

## Tech Stack

- **Backend**: Go (Gin framework)
- **Frontend**: React + Vite
- **Database**: PostgreSQL
- **Styling**: Tailwind CSS

## Prerequisites

- Go 1.21+
- Node.js 18+
- PostgreSQL 14+

## Setup

### Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE interview_prep;
```

2. Run the schema:
```bash
psql -U postgres -d interview_prep -f schema.sql
```

3. Update database credentials in `backend/database/db.go`

### Backend Setup

```bash
cd backend
go mod tidy
go run main.go
```

The backend will run on `http://localhost:8080`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

## API Endpoints

- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create a category
- `GET /api/questions` - Get all questions
- `GET /api/questions?category_id=1` - Get questions by category
- `POST /api/questions` - Create a question
- `PUT /api/questions/:id` - Update a question
- `DELETE /api/questions/:id` - Delete a question

## License

MIT
