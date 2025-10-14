## MyTracker Backend (TypeScript, Express, MongoDB)

Backend API for MyTracker: authentication, user management, daily logs, meals, goals, weights, and translation utilities.

### Features

- **TypeScript** with clean layering (routes, controllers, services)
- **MongoDB + Mongoose** data models
- **Cookie-based JWT auth** (`loginToken` HTTP-only cookie)
- **Environment-driven config** and production static serving
- **ESLint** and build pipeline with `tsc`

### Project Structure

```
src/
├── api/
│   ├── auth/       # login, signup, logout
│   ├── user/       # users CRUD and helpers
│   ├── log/        # logs CRUD
│   ├── day/        # per-day data
│   ├── meal/       # meals catalog + CRUD
│   ├── weight/     # weights CRUD
│   ├── goal/       # goals CRUD + selection
│   └── translate/  # Google Translate wrapper with LRU cache
├── middleware/     # auth, ALS, errors
├── services/       # logger, socket, utils
└── server.ts       # app bootstrap, routes, DB, static
```

## API Endpoints

Base path: `/api/*`

### Auth (`/api/auth`)

- `POST /login` – Body: `{ email, password }`. Sets `loginToken` cookie and returns the user.
- `POST /signup` – Body: `{ email, password, fullname }`. Sets `loginToken` and returns the created user (+ initial day info).
- `POST /logout` – Clears `loginToken` cookie.

### User (`/api/user`)

- `GET /` – List users (protected).
- `GET /remember/:id` – Get minimal details for remember flow (public).
- `GET /:id` – Get user by id (protected).
- `PUT /:id` – Update user (protected).
- `DELETE /:id` – Delete user (protected).

### Log (`/api/log`)

- `GET /` – List logs (public).
- `GET /:id` – Get log (public).
- `POST /` – Create log (auth required).
- `PUT /:id` – Update log (auth required).
- `DELETE /:id` – Delete log (auth required).

### Day (`/api/day`)

- `GET /` – Get current day for logged-in user (auth required).
- `POST /` – Upsert current day (auth required).
- `GET /:id` – Get day by id (auth required).
- `PUT /:id` – Update day (auth required).
- `GET /user/:userId` – List days by user (auth required).
- `GET /by-date/:userId` – Get day by date (auth required).

### Meal (`/api/meal`)

- `GET /` – List meals (public).
- `GET /:id` – Get meal (public).
- `POST /` – Create meal (auth required).
- `PUT /:id` – Update meal (auth required).
- `DELETE /:id` – Delete meal (auth required).

### Weight (`/api/weight`)

- `GET /` – List weights (auth required).
- `GET /:id` – Get weight (auth required).
- `POST /` – Create weight (auth required).
- `PUT /:id` – Update weight (auth required).
- `DELETE /:id` – Delete weight (auth required).

### Goal (`/api/goal`)

- `GET /user/:userId` – List goals by user (auth required).
- `GET /:id` – Get goal (auth required).
- `PUT /select` – Select active goal (auth required).
- `POST /` – Create goal (auth required).
- `PUT /:id` – Update goal (auth required).
- `DELETE /:id` – Delete goal (auth required).

### Translate (`/api/translate`)

- `GET /?q=TEXT&target=en` – Translate `q` to `target` (auth required). Returns the translated string. Responses are cached with an LRU cache.
