package main

import (
	"interview-prep/database"
	"interview-prep/handlers"
	"interview-prep/middleware"
	"interview-prep/routes"
	"log"
	"os"

	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	db, err := database.Connect()
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Run migrations to create tables
	if err := database.RunMigrations(db); err != nil {
		log.Printf("Warning: Migration failed: %v", err)
	}

	h := &handlers.Handler{DB: db}

	r := gin.Default()

	// Configure CORS
	allowedOrigins := []string{"http://localhost:5173", "http://localhost:3000"}
	if origin := os.Getenv("ALLOWED_ORIGIN"); origin != "" {
		allowedOrigins = append(allowedOrigins, origin)
	}

	log.Printf("Allowed CORS origins: %v", allowedOrigins)

	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		AllowOriginFunc: func(origin string) bool {
			return strings.HasSuffix(origin, ".vercel.app")
		},
	}))

	// Setup Auth Routes
	routes.SetupRoutes(r, db)

	// Setup API Routes
	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		api.GET("/categories", h.GetCategories)
		api.POST("/categories", h.CreateCategory)
		api.DELETE("/categories/:id", h.DeleteCategory)
		api.POST("/categories/:id/request-access", h.RequestAccess)
		api.GET("/categories/:id/requests", h.GetRequests)
		api.POST("/categories/:id/requests/:requestId/respond", h.RespondToRequest)

		api.GET("/questions", h.GetQuestions)
		api.POST("/questions", h.CreateQuestion)
		api.PUT("/questions/:id", h.UpdateQuestion)
		api.DELETE("/questions/:id", h.DeleteQuestion)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}
	r.Run(":" + port)
}
