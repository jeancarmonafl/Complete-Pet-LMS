# Complete-Pet Training & Compliance LMS

Production-ready learning management system for Complete-Pet with multi-location support, role-based access, and full compliance tracking.

## 🚀 Quick Start

### Localhost Development (with test data)

```bash
# Setup database and seed test data (one command!)
./scripts/setup-localhost-dev.sh

# Start servers
./scripts/start-dev-servers.sh
```

**Test Credentials** (password: `12345`):
- `admin@complete-pet.com` (Admin - FL)
- `manager@complete-pet.com` (Manager - FL)
- `employee@complete-pet.com` (Employee - FL)

Access at: http://localhost:5173

### Production Deployment (Render)

1. **Database Migration**
   ```bash
   # In Render Shell
   cd backend
   node scripts/mark-migrations-complete.js
   node scripts/migrate.js
   ```

2. **Environment Variables** (set in Render dashboard):
   ```
   DATABASE_URL=your-postgres-connection-string
   JWT_SECRET=your-secret-key-min-32-chars
   NODE_ENV=production
   PORT=4000
   ```

## 📁 Project Structure

```
backend/          # Express + TypeScript API
  ├── src/        # TypeScript source code
  ├── dist/       # Compiled JavaScript
  ├── db/migrations/  # Database schema migrations
  └── scripts/    # Migration and seed scripts
frontend/         # React + TypeScript + Tailwind
  ├── src/
  │   ├── components/  # Reusable UI components
  │   ├── pages/       # Page components
  │   ├── contexts/    # State management (Zustand)
  │   └── utils/       # i18n, formatters, utilities
  └── public/     # Static assets
```

## ✨ Key Features

### Access Control
- **Multi-location**: Florida (FL) and Vermont (VT) with strict data separation
- **Role-based**: Global Admin, Admin, Manager, Supervisor, Employee
- **Location scoped**: Users only see data from their assigned location

### User Management
- Auto-generated employee IDs and login credentials
- Department and position tracking
- Activation/deactivation
- Training history and compliance tracking

### Course Management
- Multiple content types (Video, PDF, PowerPoint, SCORM)
- Quiz creation with 4 questions per course
- Pass percentage requirements
- Mandatory/optional course designation
- Department and position targeting
- Course activation/deactivation

### Training Compliance
- Training matrix with assignment tracking
- Quiz completion and scoring
- Supervisor approval workflow
- Signature capture
- Training record PDF generation

### Reporting
- Compliance dashboards
- Training completion reports
- User activity tracking
- Exportable data

### UX Features
- Dark/Light theme toggle
- English/Spanish language toggle
- Responsive design (mobile, tablet, desktop)
- Accessible UI (WCAG compliant)

## 🛠 Technology Stack

### Frontend
- **React 18** + TypeScript
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Query** for data fetching
- **React Router** for navigation
- **i18next** for internationalization
- **Vite** for building and dev server

### Backend
- **Node.js** + Express + TypeScript
- **PostgreSQL** database
- **JWT** authentication
- **bcrypt** password hashing
- **Zod** validation

## 📊 Database Schema

### Core Tables
- `organizations` - Top-level organization
- `locations` - FL, VT facilities
- `users` - Employees with roles and departments
- `courses` - Training content with quizzes
- `enrollments` - User course assignments
- `training_records` - Completions with signatures
- `audit_logs` - Change tracking

See `backend/db/migrations/` for complete schema.

## 🔧 Development

### Prerequisites
- Node.js 18+
- PostgreSQL 16+ (or Docker for localhost)
- Docker Desktop (for localhost development)

### Backend Setup
```bash
cd backend
npm install

# Create .env file
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
JWT_SECRET=your-secret-key-at-least-32-characters-long
NODE_ENV=development
PORT=4000

# Run migrations
node scripts/migrate.js

# Start dev server
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Database Management

**Localhost** (Docker):
```bash
# View logs
docker logs complete-pet-lms-dev-db

# Connect to database
docker exec -it complete-pet-lms-dev-db psql -U devuser -d complete_pet_lms_dev

# Reset database
docker-compose -f docker-compose.dev.yml down -v
./scripts/setup-localhost-dev.sh
```

**Production** (Render):
```bash
# Run migrations
node scripts/mark-migrations-complete.js
node scripts/migrate.js

# Seed dev data (optional, for testing)
node scripts/seed-dev-data.js
```

## 📝 Available Scripts

### Localhost Development
- `./scripts/setup-localhost-dev.sh` - One-command setup with test data
- `./scripts/start-dev-servers.sh` - Start both backend and frontend
- `./scripts/check-credentials.js` - Verify login credentials

### Database Migrations
- `node scripts/migrate.js` - Run pending migrations
- `node scripts/mark-migrations-complete.js` - Mark existing migrations as complete
- `node scripts/seed-dev-data.js` - Add test users and courses

## 🔐 Security

- JWT-based authentication with 12-hour expiration
- Bcrypt password hashing (12 rounds)
- HTTPS in production (Render automatic)
- CORS configuration
- SQL injection protection (parameterized queries)
- XSS protection (React built-in)
- Helmet.js security headers

## 📦 Deployment

### Render (Recommended)

**Backend**:
1. Connect GitHub repo
2. Set build command: `npm install && npm run build`
3. Set start command: `npm start`
4. Add environment variables
5. Run migrations in Shell

**Frontend** (Netlify):
1. Connect GitHub repo
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add `VITE_API_URL` if backend is separate domain

### Environment Variables

**Backend** (required):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key (32+ characters)
- `NODE_ENV` - Set to `production`
- `PORT` - API port (default: 4000)

**Frontend** (optional):
- `VITE_API_URL` - API endpoint (defaults to `/api` for proxy)

## 🧪 Testing

### Manual Testing
```bash
# Health check
curl http://localhost:4000/health

# Test login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@complete-pet.com","password":"12345","locationCode":"FL"}'

# Check credentials
node backend/scripts/check-credentials.js admin@complete-pet.com 12345 FL
```

## 📋 Compliance

- **21 CFR Part 11** ready (see `21_CFR_PART_11_COMPLIANCE.md`)
- Audit trails for all critical operations
- Electronic signatures with timestamps
- User authentication and access controls
- Data integrity protections

## 🤝 Support

For issues or questions:
1. Check migration scripts in `backend/scripts/`
2. Review database schema in `backend/db/migrations/`
3. Check environment variables
4. Verify database connection

## 📄 License

Proprietary - Complete-Pet Internal Use Only

---

**Last Updated**: November 2025  
**Version**: 1.0.0  
**Status**: Production Ready
