package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/avachat/backend/internal/middleware"
	"github.com/avachat/backend/internal/model"
	"github.com/avachat/backend/internal/repository"
	"github.com/avachat/backend/internal/websocket"
	"github.com/go-chi/chi/v5"
)

type ConversationHandler struct {
	db  *repository.Postgres
	hub *websocket.Hub
}

func NewConversationHandler(db *repository.Postgres, hub *websocket.Hub) *ConversationHandler {
	return &ConversationHandler{db: db, hub: hub}
}

func (h *ConversationHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserFromContext(r.Context())
	status := r.URL.Query().Get("status")
	assigned := r.URL.Query().Get("assigned")

	convs, err := h.db.ListConversations(r.Context(), claims.TenantID, status, assigned)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, convs)
}

func (h *ConversationHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	claims := middleware.GetUserFromContext(r.Context())

	conv, err := h.db.GetConversation(r.Context(), id, claims.TenantID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "conversation not found"})
		return
	}
	writeJSON(w, http.StatusOK, conv)
}

func (h *ConversationHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	claims := middleware.GetUserFromContext(r.Context())

	var req struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request"})
		return
	}

	if err := h.db.UpdateConversationStatus(r.Context(), id, claims.TenantID, req.Status); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	h.broadcastConversationUpdate(id, claims.TenantID, map[string]interface{}{
		"type":   "status_change",
		"status": req.Status,
	})

	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *ConversationHandler) Assign(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	claims := middleware.GetUserFromContext(r.Context())

	var req struct {
		AgentID string `json:"agent_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request"})
		return
	}

	if err := h.db.AssignConversation(r.Context(), id, claims.TenantID, req.AgentID); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	h.broadcastConversationUpdate(id, claims.TenantID, map[string]interface{}{
		"type":      "assignment",
		"assigned_to": req.AgentID,
	})

	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *ConversationHandler) AddNote(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	claims := middleware.GetUserFromContext(r.Context())

	var req struct {
		Content string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request"})
		return
	}

	note, err := h.db.AddNote(r.Context(), id, claims.UserID, claims.Email, req.Content)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	h.hub.Broadcast(claims.TenantID, id, map[string]interface{}{
		"type": "new_note",
		"note": note,
	})

	writeJSON(w, http.StatusCreated, note)
}

func (h *ConversationHandler) Analytics(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserFromContext(r.Context())
	days := r.URL.Query().Get("days")
	if days == "" {
		days = "7"
	}

	summary, err := h.db.GetAnalytics(r.Context(), claims.TenantID, days)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, summary)
}

func (h *ConversationHandler) broadcastConversationUpdate(convID, tenantID string, payload map[string]interface{}) {
	payload["conversation_id"] = convID
	payload["timestamp"] = time.Now().UTC()
	h.hub.Broadcast(tenantID, convID, payload)
}
