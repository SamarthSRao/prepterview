package routes

import (
	"database/sql"
	"interview-prep/controllers"
	"interview-prep/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, db *sql.DB) {
	uc := &controllers.UserController{DB: db}

	router.POST("/signup", uc.Signup)
	router.POST("/login", uc.Login)

	protected := router.Group("/")
	protected.Use(middleware.AuthMiddleware())
	{
		protected.GET("/users", uc.GetUsers)
		protected.GET("/users/:id", uc.GetUser)
	}
}
