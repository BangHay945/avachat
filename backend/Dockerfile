FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /avachat-api ./cmd/server

FROM alpine:3.19
RUN apk add --no-cache ca-certificates curl
COPY --from=builder /avachat-api /avachat-api
EXPOSE 8080
CMD ["/avachat-api"]
