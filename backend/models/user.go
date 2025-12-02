package models

import "time"

type User struct {
    ID        int       `json:"id"`
    FirstName string    `json:"first_name" validate:"required,min=2,max=100"`
    LastName  string    `json:"last_name" validate:"required,min=2,max=100"`
    Email     string    `json:"email" validate:"required,email"`
    Password  string    `json:"password" validate:"required,min=6"`
    Phone     string    `json:"phone" validate:"required"`
    Role      string    `json:"role" validate:"required,eq=ADMIN|eq=USER"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}
