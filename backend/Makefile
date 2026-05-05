.PHONY: run build test lint

run:
	go run ./cmd/server

build:
	go build -o bin/avachat-api ./cmd/server

test:
	go test ./... -v

lint:
	golangci-lint run ./...

db-up:
	docker run -d --name avachat-postgres -p 5432:5432 \
		-e POSTGRES_USER=avachat \
		-e POSTGRES_PASSWORD=avachat \
		-e POSTGRES_DB=avachat \
		postgres:16-alpine

db-down:
	docker rm -f avachat-postgres
