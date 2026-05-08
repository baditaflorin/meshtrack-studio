.PHONY: help install-hooks dev build test test-integration smoke lint fmt pages-preview clean

help:
	@awk 'BEGIN {FS = ":.*## "}; /^[a-zA-Z_-]+:.*## / {printf "%-18s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install-hooks: ## Wire local git hooks
	git config core.hooksPath .githooks

dev: ## Run the frontend dev server
	npm run dev

build: ## Build GitHub Pages-ready static output
	npm run build:pages

test: ## Run unit tests
	npm run test

test-integration: ## Run integration tests
	@echo "No separate integration suite for Mode A v1."

smoke: ## Run static Pages smoke test
	bash scripts/smoke.sh

lint: ## Run linters and type checks
	npm run lint
	npm run typecheck

fmt: ## Autoformat files
	npx prettier --write .

pages-preview: build ## Serve docs/ locally like GitHub Pages
	npx vite preview --host 127.0.0.1

clean: ## Remove generated files
	rm -rf docs coverage tmp
