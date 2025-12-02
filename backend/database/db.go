package database

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"
)

func Connect() (*sql.DB, error) {
	// TODO: Update these credentials to match your local PostgreSQL setup
	connStr := "host=localhost port=5432 user=postgres password=Strawteddy12 dbname=interview_prep sslmode=disable"
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
