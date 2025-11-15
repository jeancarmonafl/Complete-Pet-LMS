# 🚀 Quick Start Guide - Complete-Pet LMS

## ⚡ TL;DR - Get Running in 5 Minutes

### Prerequisites
- ✅ Node.js 18+ installed
- ✅ Docker Desktop installed and running

### Quick Setup

```bash
# 1. Run the automated setup script
./scripts/fix-login-issue.sh

# 2. Start backend (Terminal 1)
cd backend && npm run dev

# 3. Start frontend (Terminal 2)
cd frontend && npm run dev

# 4. Open browser
open http://localhost:5173
```

### Test Login Credentials

**Email:** `jeancarmona@complete-pet.com`  
**Password:** `12345`  
**Location:** `FL`

---

## 📋 What Just Happened?

The setup script:
1. ✅ Created `.env` files for backend and frontend
2. ✅ Started PostgreSQL database in Docker
3. ✅ Ran database migrations (created tables)
4. ✅ Seeded test data (6 users, 5 courses)

---

## 🔑 All Test Accounts

| Role          | Email                          | Password | Location |
|---------------|--------------------------------|----------|----------|
| Global Admin  | jeancarmona@complete-pet.com  | 12345    | FL       |
| Admin         | admin@complete-pet.com        | 12345    | FL       |
| Manager       | manager@complete-pet.com      | 12345    | FL       |
| Supervisor    | supervisor@complete-pet.com   | 12345    | FL       |
| Employee      | employee@complete-pet.com     | 12345    | FL       |
| Admin (VT)    | alice@complete-pet.com        | 12345    | VT       |

---

## 🛠️ Common Commands

### Check System Health
```bash
node scripts/diagnose-and-fix.js
```

### Reset Everything (Fresh Start)
```bash
docker-compose -f docker-compose.dev.yml down -v
./scripts/setup-localhost-dev.sh
```

### View Database
```bash
docker exec -it complete-pet-lms-dev-db psql -U devuser -d complete_pet_lms_dev
```

### Stop Database
```bash
docker-compose -f docker-compose.dev.yml down
```

---

## ❌ Having Issues?

1. **Can't login?** → Run `node scripts/diagnose-and-fix.js`
2. **Database error?** → Check Docker is running
3. **Port in use?** → Kill process: `lsof -i :4000` or `lsof -i :5173`

**Full troubleshooting guide:** See `TROUBLESHOOTING_GUIDE.md`

---

## 🎯 Next Steps

1. ✅ Login with test account
2. ✅ Explore the dashboard
3. ✅ View training matrix
4. ✅ Check user management (admin/global_admin only)
5. ✅ Try course management
6. ✅ Generate reports

---

## 📁 Project Structure

```
Complete-Pet-LMS/
├── backend/              # Node.js/Express API
│   ├── src/             # TypeScript source code
│   ├── dist/            # Compiled JavaScript
│   ├── scripts/         # Database & utility scripts
│   ├── .env             # ⚠️ Environment config (DON'T commit!)
│   └── .env.example     # Template for .env
├── frontend/            # React/Vite UI
│   ├── src/            # React components
│   ├── .env            # ⚠️ Environment config (DON'T commit!)
│   └── .env.example    # Template for .env
└── scripts/            # Setup & maintenance scripts
    ├── fix-login-issue.sh      # Quick recovery
    ├── setup-localhost-dev.sh  # Full setup
    └── diagnose-and-fix.js     # Health check
```

---

## 🔒 Security Notes

### Development vs Production

**Development (current):**
- Simple passwords (12345)
- Local database
- Debug mode enabled
- No SSL/TLS

**Production (when deploying):**
- ⚠️ Change all passwords!
- ⚠️ Use secure JWT_SECRET (random 64+ chars)
- ⚠️ Use production database
- ⚠️ Enable SSL/TLS
- ⚠️ Set NODE_ENV=production

### Never Commit These Files:
- `backend/.env`
- `frontend/.env`
- `node_modules/`
- Database backups with real data

---

## 🆘 Emergency Recovery

If something breaks:

```bash
# Nuclear option - complete reset
cd "/Users/carmona/Documents/Complete PET LMS 11-15/Complete-Pet-LMS"

# Stop everything
docker-compose -f docker-compose.dev.yml down -v
pkill -f "npm run dev"

# Clean install
rm -rf backend/node_modules frontend/node_modules
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Fresh setup
./scripts/fix-login-issue.sh

# Start again
cd backend && npm run dev  # Terminal 1
cd frontend && npm run dev # Terminal 2
```

---

**You're all set! 🎉**

Questions? Check `TROUBLESHOOTING_GUIDE.md` for detailed help.

