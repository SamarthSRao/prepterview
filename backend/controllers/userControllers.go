package controllers

import (
	"database/sql"
	"interview-prep/helpers"
	"interview-prep/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type UserController struct {
	DB *sql.DB
}

var validate = validator.New()

func (uc *UserController) Signup(c *gin.Context) {
	var user models.User

	if err := c.BindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate struct
	if err := validate.Struct(user); err != nil {
		// Provide user-friendly error messages
		if validationErrors, ok := err.(validator.ValidationErrors); ok {
			for _, fieldError := range validationErrors {
				switch fieldError.Field() {
				case "FirstName":
					c.JSON(http.StatusBadRequest, gin.H{"error": "First name must be at least 2 characters long"})
					return
				case "LastName":
					c.JSON(http.StatusBadRequest, gin.H{"error": "Last name must be at least 2 characters long"})
					return
				case "Email":
					c.JSON(http.StatusBadRequest, gin.H{"error": "Please provide a valid email address"})
					return
				case "Password":
					c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 6 characters long"})
					return
				case "Phone":
					c.JSON(http.StatusBadRequest, gin.H{"error": "Phone number is required"})
					return
				case "Role":
					c.JSON(http.StatusBadRequest, gin.H{"error": "Role must be either ADMIN or USER"})
					return
				}
			}
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed"})
		return
	}

	// Check if user exists
	var count int
	err := uc.DB.QueryRow("SELECT COUNT(*) FROM users WHERE email = $1 OR phone = $2", user.Email, user.Phone).Scan(&count)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email or phone already exists"})
		return
	}

	hashedPassword, err := helpers.HashPassword(user.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error hashing password"})
		return
	}
	user.Password = hashedPassword

	err = uc.DB.QueryRow(
		"INSERT INTO users (first_name, last_name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at, updated_at",
		user.FirstName, user.LastName, user.Email, user.Password, user.Phone, user.Role,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	token, err := helpers.GenerateToken(user.Email, user.ID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error generating token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user, "token": token})
}

func (uc *UserController) Login(c *gin.Context) {
	var loginData struct {
		Email    string `json:"email" validate:"required,email"`
		Password string `json:"password" validate:"required"`
	}

	if err := c.BindJSON(&loginData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	err := uc.DB.QueryRow("SELECT id, first_name, last_name, email, password, role FROM users WHERE email = $1", loginData.Email).Scan(
		&user.ID, &user.FirstName, &user.LastName, &user.Email, &user.Password, &user.Role,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if err := helpers.VerifyPassword(user.Password, loginData.Password); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	token, err := helpers.GenerateToken(user.Email, user.ID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error generating token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token, "user": user})
}

func (uc *UserController) GetUsers(c *gin.Context) {
	// Check for admin role if needed
	role, _ := c.Get("role")
	if role != "ADMIN" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	rows, err := uc.DB.Query("SELECT id, first_name, last_name, email, phone, role, created_at FROM users")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.FirstName, &u.LastName, &u.Email, &u.Phone, &u.Role, &u.CreatedAt); err != nil {
			continue
		}
		users = append(users, u)
	}

	c.JSON(http.StatusOK, users)
}

func (uc *UserController) GetUser(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	// Allow users to see their own profile, or admins to see any profile
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")

	if role != "ADMIN" && userID != id {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var u models.User
	err = uc.DB.QueryRow("SELECT id, first_name, last_name, email, phone, role, created_at FROM users WHERE id = $1", id).Scan(
		&u.ID, &u.FirstName, &u.LastName, &u.Email, &u.Phone, &u.Role, &u.CreatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, u)
}
