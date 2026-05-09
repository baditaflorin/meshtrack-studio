.PHONY: help install-hooks hooks-pre-commit hooks-commit-msg hooks-pre-push hooks-post-merge hooks-post-checkout dev build test test-integration smoke lint fmt pages-preview clean perf-fixtures

help:
	@awk 'BEGIN {FS = ":.*## "}; /^[a-zA-Z_-]+:.*## / {printf "%-18s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install-hooks: ## Wire local git hooks
	git config core.hooksPath .githooks

hooks-pre-commit: ## Run the pre-commit hook manually
	.githooks/pre-commit

hooks-commit-msg: ## Run the commit-msg hook with a sample message
	printf "chore: sample\n" > /tmp/meshtrack-commit-msg && .githooks/commit-msg /tmp/meshtrack-commit-msg

hooks-pre-push: ## Run the pre-push hook manually
	.githooks/pre-push

hooks-post-merge: ## Run the post-merge hook manually
	.githooks/post-merge

hooks-post-checkout: ## Run the post-checkout hook manually
	.githooks/post-checkout

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

perf-fixtures: ## Measure fixture import and export performance
	npm run perf:fixtures

lint: ## Run linters and type checks
	npm run lint
	npm run typecheck

fmt: ## Autoformat files
	npx prettier --write .

pages-preview: build ## Serve docs/ locally like GitHub Pages
	npx vite preview --host 127.0.0.1

clean: ## Remove generated files
	rm -rf docs coverage tmp
