.PHONY: dev dev-prod build test frontend-build install

GO_CACHE := $(CURDIR)/.tmp-go-cache

dev:
	ALLREAL_CONFIG_PROFILE=dev wails dev

dev-prod:
	wails dev

build:
	wails build

test:
	GOCACHE=$(GO_CACHE) go test -count=1 ./...

frontend-build:
	cd frontend && bun run build

install:
	cd frontend && bun install
