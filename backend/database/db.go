package database

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/lib/pq"
)

func Connect() (*sql.DB, error) {
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		fmt.Println("WARNING: DATABASE_URL not set, using localhost")
		connStr = "host=localhost port=5432 user=postgres password=Strawteddy12 dbname=interview_prep sslmode=disable"
	} else {
		fmt.Println("Using DATABASE_URL from environment")
	}

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}

	if err = db.Ping(); err != nil {
		return nil, err
	}

	fmt.Println("Database connected successfully")
	return db, nil
}
