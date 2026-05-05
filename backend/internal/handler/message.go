package handler

import (
	"encoding/json"
	"net/http"

	"github.com/avachat/backend/internal/middleware"
	"github.com/avachat/backend/internal/model"
	"github.com/avachat/backend/internal/repository"
	"github.com/go-chi/chi/v5"
)

type MessageHandler struct {
	db *repository.Postgres
}

func NewMessageHandler(db *repository.Postgres) *MessageHandler {
	return &MessageHandler{db: db}
}

func (h *MessageHandler) List(w http.ResponseWriter, r *http.Request) {
	convID := chi.URLParam(r, "convId")
	claims := middleware.GetUserFromContext(r.Context())

	messages, err := h.db.ListMessages(r.Context(), convID, claims.TenantID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, messages)
}

func (h *MessageHandler) Send(w http.ResponseWriter, r *http.Request) {
	convID := chi.URLParam(r, "convId")
	claims := middleware.GetUserFromContext(r.Context())

	var req struct {
		Content string `json:"content"`
		Type    string `json:"type"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request"})
		return
	}

	if req.Type == "" {
		req.Type = "text"
	}

	msg := &model.Message{
		ConversationID: convID,
		Sender:         "agent",
		SenderName:     claims.Email,
		Content:        req.Content,
		Type:           req.Type,
	}

	if err := h.db.InsertMessage(r.Context(), msg, claims.TenantID); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusCreated, msg)
}
