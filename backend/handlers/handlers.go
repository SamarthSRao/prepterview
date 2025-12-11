package handlers

import (
	"database/sql"
	"fmt"
	"interview-prep/models"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	DB *sql.DB
}

// Categories
func (h *Handler) GetCategories(c *gin.Context) {
	userID, _ := c.Get("user_id")

	query := `
		SELECT 
			c.id, 
			c.name, 
			COALESCE(c.user_id, 0), 
			COALESCE(u.first_name || ' ' || u.last_name, 'Unknown'), 
			c.created_at,
			CASE WHEN c.user_id = $1 OR EXISTS(SELECT 1 FROM category_permissions WHERE category_id=c.id AND user_id=$1 AND status='APPROVED') THEN true ELSE false END as has_permission,
			COALESCE((SELECT status FROM category_permissions WHERE category_id=c.id AND user_id=$1), '') as request_status
		FROM categories c 
		LEFT JOIN users u ON c.user_id = u.id 
		ORDER BY c.name
	`
	rows, err := h.DB.Query(query, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	categories := []models.Category{}
	for rows.Next() {
		var cat models.Category
		if err := rows.Scan(&cat.ID, &cat.Name, &cat.UserID, &cat.CreatorName, &cat.CreatedAt, &cat.HasPermission, &cat.RequestStatus); err != nil {
			fmt.Println("Scan error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		categories = append(categories, cat)
	}

	c.JSON(http.StatusOK, categories)
}

func (h *Handler) CreateCategory(c *gin.Context) {
	var cat models.Category
	if err := c.BindJSON(&cat); err != nil {
		fmt.Println("Error binding JSON:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	err := h.DB.QueryRow(
		"INSERT INTO categories (name, user_id) VALUES ($1, $2) RETURNING id, created_at",
		cat.Name, userID,
	).Scan(&cat.ID, &cat.CreatedAt)

	if err != nil {
		fmt.Println("Error inserting category:", err)
		if strings.Contains(err.Error(), "unique constraint") {
			c.JSON(http.StatusConflict, gin.H{"error": "Category name already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Fill in creator info for response
	cat.UserID = userID.(int)
	// Fetch creator name if needed, or just return basic info

	c.JSON(http.StatusCreated, cat)
}

func (h *Handler) DeleteCategory(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")

	// Check ownership
	var ownerID int
	err := h.DB.QueryRow("SELECT user_id FROM categories WHERE id=$1", id).Scan(&ownerID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}

	if ownerID != userID.(int) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete categories you created"})
		return
	}

	_, err = h.DB.Exec("DELETE FROM categories WHERE id=$1", id)
	if err != nil {
		fmt.Println("Error deleting category:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted successfully"})
}

// Questions
func (h *Handler) GetQuestions(c *gin.Context) {
	categoryID := c.Query("category_id")

	var rows *sql.Rows
	var err error

	if categoryID != "" {
		rows, err = h.DB.Query(
			"SELECT id, category_id, question, answer, COALESCE(context, ''), difficulty, created_at, updated_at FROM questions WHERE category_id = $1 ORDER BY created_at DESC",
			categoryID,
		)
	} else {
		rows, err = h.DB.Query(
			"SELECT id, category_id, question, answer, COALESCE(context, ''), difficulty, created_at, updated_at FROM questions ORDER BY created_at DESC",
		)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var questions []models.Question
	for rows.Next() {
		var q models.Question
		if err := rows.Scan(&q.ID, &q.CategoryID, &q.Question, &q.Answer, &q.Context, &q.Difficulty, &q.CreatedAt, &q.UpdatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		questions = append(questions, q)
	}

	c.JSON(http.StatusOK, questions)
}

func (h *Handler) CreateQuestion(c *gin.Context) {
	var q models.Question
	if err := c.BindJSON(&q); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")

	// Check permission: Owner OR Approved Request
	var hasPermission bool
	err := h.DB.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM categories WHERE id = $1 AND user_id = $2
			UNION
			SELECT 1 FROM category_permissions WHERE category_id = $1 AND user_id = $2 AND status = 'APPROVED'
		)`, q.CategoryID, userID).Scan(&hasPermission)

	if err != nil || !hasPermission {
		c.JSON(http.StatusForbidden, gin.H{"error": "You do not have permission to add questions to this category"})
		return
	}

	err = h.DB.QueryRow(
		"INSERT INTO questions (category_id, question, answer, context, difficulty) VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at, updated_at",
		q.CategoryID, q.Question, q.Answer, q.Context, q.Difficulty,
	).Scan(&q.ID, &q.CreatedAt, &q.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, q)
}

func (h *Handler) UpdateQuestion(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var q models.Question
	if err := c.BindJSON(&q); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := h.DB.Exec(
		"UPDATE questions SET question=$1, answer=$2,context=$3, difficulty=$4, updated_at=CURRENT_TIMESTAMP WHERE id=$5",
		q.Question, q.Answer, q.Context, q.Difficulty, id,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "updated successfully"})
}

func (h *Handler) DeleteQuestion(c *gin.Context) {
	id := c.Param("id")
	_, err := h.DB.Exec("DELETE FROM questions WHERE id=$1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted successfully"})
}

// Permissions
func (h *Handler) RequestAccess(c *gin.Context) {
	categoryID := c.Param("id")
	userID, _ := c.Get("user_id")

	// Check if request already exists
	var exists bool
	err := h.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM category_permissions WHERE category_id=$1 AND user_id=$2)", categoryID, userID).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if exists {
		c.JSON(http.StatusConflict, gin.H{"error": "Request already exists"})
		return
	}

	_, err = h.DB.Exec("INSERT INTO category_permissions (category_id, user_id) VALUES ($1, $2)", categoryID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Request sent"})
}

func (h *Handler) GetRequests(c *gin.Context) {
	categoryID := c.Param("id")
	userID, _ := c.Get("user_id")

	// Verify ownership
	var ownerID int
	err := h.DB.QueryRow("SELECT user_id FROM categories WHERE id=$1", categoryID).Scan(&ownerID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}
	if ownerID != userID.(int) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only owner can view requests"})
		return
	}

	rows, err := h.DB.Query(`
		SELECT p.id, u.first_name, u.last_name, u.email, p.status, p.created_at
		FROM category_permissions p
		JOIN users u ON p.user_id = u.id
		WHERE p.category_id = $1 AND p.status = 'PENDING'
	`, categoryID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var requests []gin.H
	for rows.Next() {
		var r struct {
			ID        int
			FirstName string
			LastName  string
			Email     string
			Status    string
			CreatedAt string
		}
		if err := rows.Scan(&r.ID, &r.FirstName, &r.LastName, &r.Email, &r.Status, &r.CreatedAt); err != nil {
			continue
		}
		requests = append(requests, gin.H{
			"id": r.ID,
			"user": gin.H{
				"first_name": r.FirstName,
				"last_name":  r.LastName,
				"email":      r.Email,
			},
			"status":     r.Status,
			"created_at": r.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, requests)
}

func (h *Handler) RespondToRequest(c *gin.Context) {
	requestID := c.Param("requestId")
	var req struct {
		Status string `json:"status"` // APPROVED or REJECTED
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify ownership of the category this request belongs to
	userID, _ := c.Get("user_id")
	var ownerID int
	err := h.DB.QueryRow(`
		SELECT c.user_id 
		FROM category_permissions p 
		JOIN categories c ON p.category_id = c.id 
		WHERE p.id = $1
	`, requestID).Scan(&ownerID)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
		return
	}

	if ownerID != userID.(int) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized"})
		return
	}

	_, err = h.DB.Exec("UPDATE category_permissions SET status=$1 WHERE id=$2", req.Status, requestID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status updated"})
}
