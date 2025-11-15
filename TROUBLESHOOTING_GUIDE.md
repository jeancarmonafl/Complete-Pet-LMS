# 🔧 Complete-Pet LMS Troubleshooting Guide

## 📋 What Happened?

Your login issue was caused by **missing environment configuration files** (`.env` files). These files contain critical information like database connection strings and security keys that the application needs to run.

### Root Cause Analysis

1. **Missing `backend/.env`** - Without this file, the backend couldn't:
   - Connect to the database
   - Verify JWT tokens
   - Hash/verify passwords properly

2. **Missing `frontend/.env`** - The frontend didn't know where to send API requests

3. **Docker Not Installed** - The development environment uses Docker to run PostgreSQL

## ✅ What Has Been Fixed

I've created the following recovery tools and files:

### 1. Environment Files Created ✅

**`backend/.env`** - Contains:
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://devuser:devpass123@localhost:5432/complete_pet_lms_dev
JWT_SECRET=local-development-secret-key-min-32-chars-long-for-testing
PASSWORD_SALT_ROUNDS=12
```

**`frontend/.env`** - Contains:
```env
VITE_API_URL=http://localhost:4000/api
```

### 2. Recovery Scripts Created ✅

- **`scripts/fix-login-issue.sh`** - Automated recovery script
- **`scripts/diagnose-and-fix.js`** - Comprehensive diagnostic tool
- **`scripts/setup-localhost-dev.sh`** - Complete setup script (already existed)

## 🚀 How to Get Back Up and Running

### Option 1: Using Docker (Recommended)

Docker provides an isolated PostgreSQL database that's easy to set up and manage.

#### Step 1: Install Docker Desktop

**For macOS:**
1. Download from: https://docs.docker.com/desktop/install/mac-install/
2. Install and start Docker Desktop
3. Wait for Docker to fully start (whale icon in menu bar should be stable)

#### Step 2: Run the Recovery Script

```bash
cd "/Users/carmona/Documents/Complete PET LMS 11-15/Complete-Pet-LMS"
./scripts/fix-login-issue.sh
```

This script will:
- ✅ Verify .env files (already created)
- ✅ Start PostgreSQL database container
- ✅ Run database migrations
- ✅ Seed test data
- ✅ Display test credentials

#### Step 3: Start the Servers

**Terminal 1 (Backend):**
```bash
cd backend
npm install  # If you haven't already
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install  # If you haven't already
npm run dev
```

#### Step 4: Test Login

Open http://localhost:5173 and login with:
- **Email:** `jeancarmona@complete-pet.com`
- **Password:** `12345`
- **Location:** `FL`

---

### Option 2: Using Existing PostgreSQL

If you have PostgreSQL installed locally or want to use a cloud database:

#### Step 1: Update Database URL

Edit `backend/.env` and change the `DATABASE_URL` to your PostgreSQL connection string:

```env
DATABASE_URL=postgresql://your_user:your_password@your_host:5432/your_database
```

#### Step 2: Run Migrations and Seed

```bash
cd backend
npm run migrate
npm run seed
```

#### Step 3: Start Servers

Same as Option 1, Step 3 above.

---

### Option 3: Quick Diagnostic Check

Want to see what's working and what's not? Run:

```bash
node scripts/diagnose-and-fix.js
```

This will show you:
- ✅ Docker status
- ✅ Database connection status
- ✅ Migration status
- ✅ User accounts status
- ✅ Login authentication test

---

## 🔑 Test Credentials

After setup is complete, you can login with these accounts (password for all: `12345`):

| Role          | Email                          | Location | Description        |
|---------------|--------------------------------|----------|--------------------|
| Global Admin  | jeancarmona@complete-pet.com  | FL       | Full system access |
| Admin         | admin@complete-pet.com        | FL       | Location admin     |
| Manager       | manager@complete-pet.com      | FL       | Department manager |
| Supervisor    | supervisor@complete-pet.com   | FL       | Team supervisor    |
| Employee      | employee@complete-pet.com     | FL       | Regular employee   |
| Admin (VT)    | alice@complete-pet.com        | VT       | Vermont location   |

---

## 🐛 Common Issues & Solutions

### Issue: "Invalid credentials" error

**Causes:**
- Backend not running
- Database not running
- Wrong email/password/location combination
- User not seeded in database

**Solutions:**
1. Ensure backend is running: `cd backend && npm run dev`
2. Check database is running: `docker ps` (should show complete-pet-lms-dev-db)
3. Verify you're using correct credentials (see table above)
4. Re-seed database: `cd backend && npm run seed`

---

### Issue: "Cannot connect to database"

**Causes:**
- Database container not running
- Wrong DATABASE_URL in .env file
- Docker not started

**Solutions:**
1. Start Docker Desktop
2. Start database: `docker-compose -f docker-compose.dev.yml up -d`
3. Wait 10 seconds for database to be ready
4. Run migrations: `cd backend && npm run migrate`

---

### Issue: Backend won't start

**Causes:**
- Missing .env file
- Port 4000 already in use
- Missing dependencies

**Solutions:**
1. Verify `backend/.env` exists (should be there now)
2. Check if port is in use: `lsof -i :4000` and kill the process
3. Install dependencies: `cd backend && npm install`
4. Rebuild bcrypt: `cd backend && npm rebuild bcrypt --build-from-source`

---

### Issue: Frontend won't start

**Causes:**
- Port 5173 already in use
- Missing dependencies

**Solutions:**
1. Check if port is in use: `lsof -i :5173` and kill the process
2. Install dependencies: `cd frontend && npm install`

---

### Issue: "502 Bad Gateway" or Network errors

**Causes:**
- Frontend trying to reach backend at wrong URL
- Backend not running

**Solutions:**
1. Verify `frontend/.env` has: `VITE_API_URL=http://localhost:4000/api`
2. Ensure backend is running on port 4000
3. Check browser console for specific error
4. Try: `curl http://localhost:4000/api/health` (should return OK)

---

## 🛡️ Prevention - Don't Lose Your Work Again!

### 1. **Never Manually Delete `.env` Files**

These files are gitignored for security reasons but are CRITICAL for local development.

### 2. **Keep Backup Scripts**

The scripts in the `scripts/` directory are your safety net:
- `setup-localhost-dev.sh` - Full environment setup
- `fix-login-issue.sh` - Quick recovery
- `diagnose-and-fix.js` - Health check

### 3. **Document Custom Changes**

If you modify database credentials or ports, document them!

### 4. **Regular Backups**

Consider backing up:
- `.env` files (store securely, NOT in git)
- Database dumps: `docker exec complete-pet-lms-dev-db pg_dump -U devuser complete_pet_lms_dev > backup.sql`

---

## 📚 Useful Commands

### Database Commands

```bash
# View database logs
docker logs complete-pet-lms-dev-db

# Connect to database
docker exec -it complete-pet-lms-dev-db psql -U devuser -d complete_pet_lms_dev

# Backup database
docker exec complete-pet-lms-dev-db pg_dump -U devuser complete_pet_lms_dev > backup.sql

# Restore database
docker exec -i complete-pet-lms-dev-db psql -U devuser -d complete_pet_lms_dev < backup.sql

# Reset database (CAREFUL - deletes all data!)
docker-compose -f docker-compose.dev.yml down -v
./scripts/setup-localhost-dev.sh
```

### Backend Commands

```bash
cd backend

# Development mode (auto-reload)
npm run dev

# Run migrations
npm run migrate

# Seed test data
npm run seed

# Build for production
npm run build

# Run production build
npm start
```

### Frontend Commands

```bash
cd frontend

# Development mode (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🆘 Still Having Issues?

If you're still stuck:

1. **Run the diagnostic:** `node scripts/diagnose-and-fix.js`
2. **Check the logs:**
   - Backend: Look at terminal where backend is running
   - Database: `docker logs complete-pet-lms-dev-db`
   - Frontend: Check browser console (F12)

3. **Nuclear Option - Complete Reset:**

```bash
# WARNING: This deletes ALL local data!
cd "/Users/carmona/Documents/Complete PET LMS 11-15/Complete-Pet-LMS"

# Stop and remove everything
docker-compose -f docker-compose.dev.yml down -v

# Clean node modules (optional, if you have issues)
rm -rf backend/node_modules frontend/node_modules

# Reinstall
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Run full setup
./scripts/setup-localhost-dev.sh

# Start servers
cd backend && npm run dev  # Terminal 1
cd frontend && npm run dev # Terminal 2
```

---

## 📖 Architecture Overview

Understanding how the pieces fit together:

```
┌─────────────────┐
│   Frontend      │  (React, Vite)
│  localhost:5173 │  Reads: frontend/.env
└────────┬────────┘
         │ HTTP Requests
         ↓
┌─────────────────┐
│   Backend       │  (Node.js, Express)
│  localhost:4000 │  Reads: backend/.env
└────────┬────────┘
         │ SQL Queries
         ↓
┌─────────────────┐
│   PostgreSQL    │  (Docker Container)
│  localhost:5432 │  User: devuser
└─────────────────┘  DB: complete_pet_lms_dev
```

### Key Configuration Files

1. **`backend/.env`** - Backend configuration
2. **`frontend/.env`** - Frontend configuration  
3. **`docker-compose.dev.yml`** - Database configuration
4. **`backend/db/migrations/*.sql`** - Database schema
5. **`backend/scripts/seed-dev-data.js`** - Test data

---

## ✅ Success Checklist

Use this to verify everything is working:

- [ ] Docker Desktop installed and running
- [ ] Database container running: `docker ps | grep complete-pet-lms-dev-db`
- [ ] Backend .env file exists and has correct values
- [ ] Frontend .env file exists
- [ ] Backend dependencies installed: `ls backend/node_modules`
- [ ] Frontend dependencies installed: `ls frontend/node_modules`
- [ ] Migrations completed: `node scripts/diagnose-and-fix.js`
- [ ] Test users seeded: `node scripts/diagnose-and-fix.js`
- [ ] Backend running on port 4000: `curl http://localhost:4000/api/health`
- [ ] Frontend running on port 5173: Open http://localhost:5173
- [ ] Can login with test credentials
- [ ] Dashboard loads after login

---

**Remember:** The `.env` files are now created and the scripts are in place. You just need to install Docker Desktop and run the recovery script!

Good luck! 🚀

