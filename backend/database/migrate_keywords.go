package database

import (
	"database/sql"
	"fmt"
)

func MigrateKeywordsTable(db *sql.DB) error {
	createTableSQL := `
		CREATE TABLE IF NOT EXISTS keywords (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
			keyword VARCHAR(255) NOT NULL,
			definition TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
		
		CREATE UNIQUE INDEX IF NOT EXISTS idx_keywords_user_keyword ON keywords(user_id, keyword);
	`

	_, err := db.Exec(createTableSQL)
	if err != nil {
		return fmt.Errorf("error creating keywords table: %v", err)
	}

	fmt.Println("Keywords table migrated successfully")
	return nil
}
