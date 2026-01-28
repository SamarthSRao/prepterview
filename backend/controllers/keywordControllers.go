package controllers

import (
	"database/sql"
	"interview-prep/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type KeywordController struct {
	DB *sql.DB
}

// CreateKeyword creates a new keyword for the authenticated user
func (kc *KeywordController) CreateKeyword(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		Keyword    string `json:"keyword" binding:"required"`
		Definition string `json:"definition" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if keyword already exists for this user
	var existingID int
	err := kc.DB.QueryRow("SELECT id FROM keywords WHERE user_id = $1 AND keyword = $2", userID, req.Keyword).Scan(&existingID)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Keyword already exists"})
		return
	} else if err != sql.ErrNoRows {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check existing keyword"})
		return
	}

	// Create the keyword
	var keywordID int
	err = kc.DB.QueryRow(
		`INSERT INTO keywords (user_id, keyword, definition, created_at, updated_at) 
		 VALUES ($1, $2, $3, $4, $5) 
		 RETURNING id`,
		userID, req.Keyword, req.Definition, time.Now(), time.Now(),
	).Scan(&keywordID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create keyword"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Keyword created successfully",
		"id":      keywordID,
	})
}

// GetKeywords retrieves all keywords for the authenticated user
func (kc *KeywordController) GetKeywords(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	rows, err := kc.DB.Query(`
		SELECT id, keyword, definition, created_at, updated_at 
		FROM keywords 
		WHERE user_id = $1 
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve keywords"})
		return
	}
	defer rows.Close()

	var keywords []models.Keyword
	for rows.Next() {
		var keyword models.Keyword
		if err := rows.Scan(&keyword.ID, &keyword.Keyword, &keyword.Definition, &keyword.CreatedAt, &keyword.UpdatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan keyword"})
			return
		}
		keywords = append(keywords, keyword)
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error reading keywords"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"keywords": keywords})
}

// UpdateKeyword updates an existing keyword for the authenticated user
func (kc *KeywordController) UpdateKeyword(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		Keyword    string `json:"keyword"`
		Definition string `json:"definition"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id := c.Param("id")

	// Check if the keyword exists and belongs to the user
	var existingUserID int
	err := kc.DB.QueryRow("SELECT user_id FROM keywords WHERE id = $1", id).Scan(&existingUserID)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Keyword not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check keyword ownership"})
		return
	}

	if existingUserID != userID.(int) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Keyword does not belong to user"})
		return
	}

	// Update the keyword
	_, err = kc.DB.Exec(
		`UPDATE keywords SET 
			keyword = COALESCE(NULLIF($1, ''), keyword), 
			definition = COALESCE(NULLIF($2, ''), definition), 
			updated_at = $3 
		WHERE id = $4`,
		req.Keyword, req.Definition, time.Now(), id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update keyword"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Keyword updated successfully"})
}

// DeleteKeyword deletes a keyword for the authenticated user
func (kc *KeywordController) DeleteKeyword(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	id := c.Param("id")

	// Check if the keyword exists and belongs to the user
	var existingUserID int
	err := kc.DB.QueryRow("SELECT user_id FROM keywords WHERE id = $1", id).Scan(&existingUserID)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Keyword not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check keyword ownership"})
		return
	}

	if existingUserID != userID.(int) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Keyword does not belong to user"})
		return
	}

	_, err = kc.DB.Exec("DELETE FROM keywords WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete keyword"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Keyword deleted successfully"})
}
