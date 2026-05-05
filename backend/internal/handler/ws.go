package handler

import (
	"log"
	"net/http"

	"github.com/avachat/backend/internal/websocket"
	ws "github.com/gorilla/websocket"
)

var upgrader = ws.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type WSHandler struct {
	hub *websocket.Hub
}

func NewWSHandler(hub *websocket.Hub) *WSHandler {
	return &WSHandler{hub: hub}
}

func (h *WSHandler) Serve(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("websocket upgrade error: %v", err)
		return
	}

	client := &websocket.Client{
		Conn: conn,
		Send: make(chan []byte, 256),
	}

	h.hub.Register <- client

	go client.WritePump()
	go client.ReadPump(h.hub)
}
