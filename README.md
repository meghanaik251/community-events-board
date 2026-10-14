# EventSphere — Community Events Board

A responsive event discovery platform built with **Next.js, TypeScript, and SQLite**. EventSphere helps users discover events, personalize their feeds, save reminders, customize event cards, and manage events through protected admin controls.

## Features

- **Event Discovery:** Browse upcoming events with pagination and event detail pages.
- **Combined Filters:** Filter events by category, city, and search query.
- **Personalized Feed:** Discover upcoming events based on saved categories.
- **Saved Reminders:** Save reminders for events and update them instantly.
- **Event Card Designer:** Customize event cards with themes and stickers.
- **Authentication:** Sign up, log in, and manage authenticated sessions.
- **Admin Dashboard:** Create events, view all events, and activate or deactivate events.
- **Responsive UI:** Designed for desktop and mobile screens.
- **Secure API:** Server-side authorization, input validation, and protected admin operations.

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js App Router | Application routing and server-side rendering |
| React and TypeScript | UI development and type safety |
| SQLite | Persistent relational database |
| Zod | Request and data validation |
| JSON API | Client-server communication |
| JWT | Authentication tokens |
| bcrypt | Password hashing |
| Pino | Structured application logging |
| Lucide | UI icons |
| CSS | Responsive styling |

## Getting Started

### Prerequisites

- **Node.js 24 LTS**
- npm

Run all commands from the project root, where `package.json` and `package-lock.json` are located.

### 1. Install dependencies

```bash
npm ci
```

### 2. Initialize the application

```bash
npm run setup
```

The setup command initializes the local environment, generates a random JWT secret in `.env.local`, creates the SQLite database, and seeds 15 sample events.

The sample data includes:
- 11 upcoming or active events
- 2 inactive events
- 2 past events

Event dates are relative to the initial setup. Running setup again preserves existing data.

### 3. Start the development server

```bash
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

### 4. Run a production build locally

```bash
npm run build
npm start
```

## Demo Accounts

### Admin

- **Route:** `/admin`
- **Email:** `admin@community.local`
- **Password:** `CommunityAdmin123!`

These are public demo credentials for local development. Change them before deploying the application.

### Visitor

Create a regular user account at `/signup`.

Passwords must contain at least 10 characters.

## Project Structure

```text
community-events-board/
├── scripts/             # Setup and seed scripts
├── src/
│   ├── app/             # App Router pages and API routes
│   ├── components/      # Reusable React components
│   ├── server/          # Database, authentication and server policies
│   └── lib/             # Types, validation, API client and formatters
├── .env.example         # Environment configuration template
├── package.json
├── package-lock.json
└── README.md
```

## API Documentation

All API endpoints use the `/api` base path.

### Authentication

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/signup` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/logout` | Authenticated session |
| GET | `/api/auth/me` | Current session |

Login and signup return a user object, a token, and its expiration duration.

Web clients use an HttpOnly session cookie. Clients that need bearer-token authentication can send:

```http
Authorization: Bearer <token>
```

Tokens expire after 24 hours and are revoked on logout.

### Events

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/events` | List upcoming public events |
| GET | `/api/events/:id` | Retrieve event details |
| GET | `/api/events/meta` | Retrieve event metadata, including cities |
| GET | `/api/feed` | Personalized upcoming event feed |
| GET | `/api/favourites` | Get saved categories |
| PUT | `/api/favourites` | Update saved categories |
| PUT | `/api/events/:id/reminder` | Save an event reminder |
| GET | `/api/events/:id/design` | Retrieve an event card design |
| PUT | `/api/events/:id/design` | Save an event card design |

Personalized feeds and user-specific actions require authentication.

### Admin Events

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/admin/events` | List all events |
| POST | `/api/admin/events` | Create an event |
| PATCH | `/api/admin/events/:id` | Update an event's active status |

All admin endpoints require an authenticated user with the admin role.

### Filtering and Pagination

The event listing endpoint supports:

- `category` — filter by event category
- `city` — filter by city
- `q` — search event titles and descriptions
- `page` — page number, default `1`
- `pageSize` — number of events per page, default `6`, maximum `24`

Filters can be combined. Responses contain an `events` array and pagination metadata.

Supported categories: `Music`, `Workshop`, `Food`, `Sports`, `Kids`.

### Event Creation

An event accepts the following fields:

- `title`
- `category`
- `city`
- `startsAt` — ISO date-time
- `pricePaise` — integer price in paise
- `description`
- `imageUrl` — HTTPS image URL

### Event Card Designer

Supported themes:

- `sage`
- `lilac`
- `sunset`

Supported stickers:

- `spark`
- `heart`
- `music`
- `flower`
- `bolt`

A maximum of three stickers can be selected per design.

### API Response and Security Behavior

- API responses are not cached.
- Errors follow the structure `{ error: { code, message, requestId } }`.
- Browser write requests require the same origin.
- Request validation is enforced on the server.
- Credentials, request bodies, and search text are excluded from application logs.

## Database Design

The application uses SQLite with foreign-key constraints and a versioned schema.

| Table | Purpose |
|---|---|
| `users` | User accounts and roles |
| `sessions` | Persistent authentication sessions |
| `events` | Event details and active status |
| `favourite_categories` | Categories saved by each user |
| `reminders` | User-specific event reminders |
| `card_designs` | User-specific event card customizations |

### Why SQLite?

SQLite is appropriate for a small, single-server application because it is lightweight, persistent, and requires no separate database server.

Composite primary keys on user-event relationships prevent duplicate reminders and card designs. Foreign keys maintain referential integrity.

The database schema uses `PRAGMA user_version` for schema versioning.

## Search and Query Optimization

Event queries always filter for active events with future start dates. Optional category, city, and search filters are combined with the base conditions.

- Parameterized SQL queries help prevent SQL injection.
- Wildcard characters such as `%` and `_` are escaped for literal text searches.
- Results are ordered by start date and event ID for stable pagination.
- Indexes support active-event date queries and combined category/city filtering.

For larger datasets, SQLite FTS5 with an appropriate tokenizer or trigram configuration can improve substring-search performance.

## Authentication and Security

- Passwords are hashed using bcrypt with a cost factor of 12.
- Password input is subject to a 72-byte limit.
- Public signup creates ordinary user accounts, not administrators.
- JWT validation checks signature, issuer, audience, and expiry.
- Database-backed sessions and current user roles are checked server-side.
- Admin pages and admin API routes require the admin role.
- HttpOnly and SameSite cookies help protect browser sessions.
- Origin checks, request validation, and persistent per-email authentication rate limits add protection.

### Production Configuration

Before hosting the application:

1. Configure a strong admin password and a unique JWT secret.
2. Set `COOKIE_SECURE=true` when serving over HTTPS.
3. Set `APP_ORIGIN` to the exact HTTPS application origin.
4. Use a persistent disk for the SQLite database.
5. Run a single application server, as required by the current storage architecture.
6. Never commit `.env.local`, credentials, or database files.

Use `.env.example` as the configuration template.

## Logging

Pino produces structured logs containing:

- Request ID
- HTTP method
- Request path
- Response status
- Request duration
- Unexpected errors

Configure the logging verbosity with `LOG_LEVEL` in `.env.local`.

Sensitive credentials, request bodies, and search text are excluded from logs.


## Assignment Discussion

### 1. Why was this database structure chosen?

The schema separates users, events, sessions, preferences, reminders, and card designs. This avoids duplicating user and event information while keeping each user's saved choices private.

Foreign keys preserve relationships, and composite primary keys prevent duplicate user-event records.

### 2. How does filtering work?

The event query first restricts results to active events with future start dates. It then applies optional category, city, and text-search filters.

Parameterized queries protect against SQL injection, escaped wildcard characters preserve literal search behavior, and deterministic sorting supports stable pagination.

### 3. How are passwords and admin routes protected?

Passwords are hashed with bcrypt. Authentication tokens and database-backed sessions are validated on the server, and the user's current role is checked before protected admin operations execute.

HttpOnly cookies, same-origin checks, validation, and authentication rate limits provide additional safeguards.

## Scope and Limitations

The current implementation supports saved reminder flags rather than email or push notifications. Email verification and password recovery are outside the current scope.

The application requires persistent SQLite storage and is designed for a single application server.


---

**EventSphere** — Discover events. Personalize your experience. Stay connected with your community.
