package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/avachat/backend/internal/config"
	"github.com/avachat/backend/internal/handler"
	"github.com/avachat/backend/internal/middleware"
	"github.com/avachat/backend/internal/repository"
	"github.com/avachat/backend/internal/websocket"
	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	cfg := config.Load()

	db, err := repository.NewPostgres(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := repository.RunMigrations(db); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	hub := websocket.NewHub()
	go hub.Run()

	authHandler := handler.NewAuthHandler(db, cfg.JWTSecret)
	convHandler := handler.NewConversationHandler(db, hub)
	msgHandler := handler.NewMessageHandler(db)
	wsHandler := handler.NewWSHandler(hub)

	r := chi.NewRouter()

	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Timeout(30 * time.Second))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{cfg.CORSOrigin},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Route("/api/v1", func(r chi.Router) {
		r.Post("/auth/login", authHandler.Login)
		r.Post("/auth/register", authHandler.Register)

		r.Group(func(r chi.Router) {
			r.Use(middleware.JWTAuth(cfg.JWTSecret))

			r.Get("/auth/me", authHandler.Me)

			r.Route("/conversations", func(r chi.Router) {
				r.Get("/", convHandler.List)
				r.Get("/{id}", convHandler.Get)
				r.Put("/{id}/status", convHandler.UpdateStatus)
				r.Put("/{id}/assign", convHandler.Assign)
				r.Post("/{id}/notes", convHandler.AddNote)
			})

			r.Route("/conversations/{convId}/messages", func(r chi.Router) {
				r.Get("/", msgHandler.List)
				r.Post("/", msgHandler.Send)
			})

			r.Get("/ws", wsHandler.Serve)

			r.Get("/analytics/summary", convHandler.Analytics)
		})
	})

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		fmt.Printf("🚀 AvaChat API running on port %s\n", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server failed: %v", err)
		}
	}()

	<-quit
	log.Println("shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("server forced to shutdown: %v", err)
	}
	log.Println("server exited gracefully")
}
