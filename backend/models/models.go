package models

import "time"

type Category struct {
	ID            int       `json:"id"`
	Name          string    `json:"name"`
	UserID        int       `json:"user_id"`
	CreatorName   string    `json:"creator_name"`
	HasPermission bool      `json:"has_permission"`
	RequestStatus string    `json:"request_status"`
	CreatedAt     time.Time `json:"created_at"`
}

type Question struct {
	ID         int       `json:"id"`
	CategoryID int       `json:"category_id"`
	Question   string    `json:"question"`
	Answer     string    `json:"answer"`
	Context    string    `json:"context"`
	Difficulty string    `json:"difficulty"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type Keyword struct {
	ID         int       `json:"id"`
	UserID     int       `json:"user_id"`
	Word       string    `json:"word"`
	Definition string    `json:"definition"`
	CreatedAt  time.Time `json:"created_at"`
}
type Contribution struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

type UserProfile struct {
	User           User           `json:"user"`
	Contributions  []Contribution `json:"contributions"`
	TotalQuestions int            `json:"total_questions"`
}
