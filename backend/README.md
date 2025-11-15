# Complete-Pet LMS - Backend API

Express + TypeScript REST API with PostgreSQL database.

## Setup

```bash
# Install dependencies
npm install

# Configure environment (.env file)
DATABASE_URL=postgresql://user:pass@host:port/database
JWT_SECRET=your-secret-key-min-32-characters
NODE_ENV=development
PORT=4000

# Run migrations
node scripts/migrate.js

# Start development server
npm run dev

# Build for production
npm run build

# Run production
npm start
```

## Available Scripts

- `migrate.js` - Run database migrations
- `mark-migrations-complete.js` - Mark existing migrations as applied (for Render)
- `seed-dev-data.js` - Add test data for localhost development

## Database Migrations

All migrations are in `db/migrations/` and run automatically via `migrate.js`.

### On Render (first time setup)

```bash
node scripts/mark-migrations-complete.js
node scripts/migrate.js
```

## API Endpoints

- `POST /api/auth/login` - User authentication
- `GET /api/users` - List users (authenticated)
- `POST /api/users` - Create user (admin only)
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course (admin only)
- `PUT /api/courses/:id` - Update course (admin only)
- `DELETE /api/courses/:id` - Delete course (admin only)

See source code in `src/routes/` for complete API documentation.

## Tech Stack

- Node.js + Express
- TypeScript
- PostgreSQL
- JWT authentication
- bcrypt password hashing
- Zod validation

## Production Deployment

Backend is deployed on Render with automatic deployments from `main` branch.

Environment variables are managed in Render dashboard.
