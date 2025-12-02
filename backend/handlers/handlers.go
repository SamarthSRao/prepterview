package handlers

import (
	"database/sql"
	"fmt"
	"interview-prep/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	DB *sql.DB
}

// Categories
func (h *Handler) GetCategories(c *gin.Context) {
	rows, err := h.DB.Query("SELECT id, name, created_at FROM categories ORDER BY name")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var categories []models.Category
	for rows.Next() {
		var cat models.Category
		if err := rows.Scan(&cat.ID, &cat.Name, &cat.CreatedAt); err != nil {
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

	err := h.DB.QueryRow(
		"INSERT INTO categories (name) VALUES ($1) RETURNING id, created_at",
		cat.Name,
	).Scan(&cat.ID, &cat.CreatedAt)

	if err != nil {
		fmt.Println("Error inserting category:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, cat)
}

func (h *Handler) DeleteCategory(c *gin.Context) {
	id := c.Param("id")
	_, err := h.DB.Exec("DELETE FROM categories WHERE id=$1", id)
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

	err := h.DB.QueryRow(
		"INSERT INTO questions (category_id, question, answer,context, difficulty) VALUES ($1, $2, $3, $4,$5) RETURNING id, created_at, updated_at",
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
