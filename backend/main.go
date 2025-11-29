package main

import (
	"interview-prep/database"
	"interview-prep/handlers"
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	db, err := database.Connect()
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	h := &handlers.Handler{DB: db}

	r := gin.Default()

	// Configure CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"}, // Vite default port and CRA default port
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		AllowCredentials: true,
	}))

	api := r.Group("/api")
	{
		api.GET("/categories", h.GetCategories)
		api.POST("/categories", h.CreateCategory)
		api.DELETE("/categories/:id", h.DeleteCategory)

		api.GET("/questions", h.GetQuestions)
		api.POST("/questions", h.CreateQuestion)
		api.PUT("/questions/:id", h.UpdateQuestion)
		api.DELETE("/questions/:id", h.DeleteQuestion)
	}

	r.Run(":8080")
}
