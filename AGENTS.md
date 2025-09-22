# Agent Guidelines for Glean Server

## Build/Lint/Test Commands
- **Build**: `npm run build` (TypeScript compilation to `dist/`)
- **Dev server**: `npm run dev` (nodemon with ts-node)
- **Start production**: `npm run start` (runs compiled JS from `dist/`)
- **Test**: `npm test` (integration tests via `test-server.js` - requires server running)
- **Kill server**: `npm run kill` (kills process on port 3000)

No linting or single test commands configured.

## Code Style Guidelines

### Imports
- Use ES6 imports with `import`/`from`
- Group external libraries first, then local imports
- Use relative paths for local imports (e.g., `../types`)
- Type imports use `import type` syntax

### Types & Interfaces
- Define interfaces in dedicated type files (`src/types/`)
- Use PascalCase for interface/type names
- Optional properties with `?:` syntax
- Strict typing preferred but `strict: false` in tsconfig

### Naming Conventions
- **Variables/Functions**: camelCase
- **Types/Interfaces/Classes**: PascalCase
- **Constants**: UPPER_SNAKE_CASE
- **Files**: kebab-case for routes, camelCase for others

### Error Handling
- Use try-catch blocks in async functions
- Log errors with `console.error()` or `logger.warn()`
- Return generic error responses in production
- Include error details only in development mode

### Formatting
- 2-space indentation
- No semicolons
- Single quotes for strings
- Async/await over Promises
- Destructuring preferred
- Arrow functions for callbacks

### Express Patterns
- Middleware functions with `(req, res, next)` signature
- Route handlers return JSON responses
- Status codes: 200 (success), 201 (created), 400 (bad request), 401 (unauth), 404 (not found), 500 (server error)
- Request validation via OpenAPI spec

### Security
- Use helmet middleware for security headers
- CORS configured with credentials
- Environment variables for secrets (never commit)
- Input validation on all endpoints