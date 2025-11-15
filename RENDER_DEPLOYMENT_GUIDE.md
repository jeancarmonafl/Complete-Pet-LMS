# 🚀 Render + Netlify Deployment Guide

## Current Status

✅ **Backend**: Deployed and running on Render  
✅ **Database**: PostgreSQL running on Render  
✅ **Frontend**: Configured for Netlify  
❌ **Login Issue**: Database needs migrations and test users  

---

## 🔧 Quick Fix - Get Login Working NOW

### Step 1: Run Database Migrations

Go to your Render dashboard and open a Shell for your backend service:

1. Visit: https://dashboard.render.com/web/srv-d4ahrac9c44c738i2sog
2. Click **"Shell"** tab
3. Run these commands:

```bash
cd backend
node scripts/migrate.js
```

Expected output:
```
🔄 Running database migrations...
✅ Migration 001_init.sql completed
✅ Migration 002_add_joined_date.sql completed
... etc
```

### Step 2: Seed Test Users

In the same Render Shell:

```bash
cd backend
node scripts/seed-dev-data.js
```

Expected output:
```
🌱 Seeding development data...
✅ Organization created
✅ Locations created (FL, VT)
✅ 6 test users created
```

### Step 3: Test Login

Now try logging in at your Netlify frontend with:

- **Email**: `jeancarmona@complete-pet.com`
- **Password**: `12345`
- **Location**: `FL`

---

## 📋 What Just Happened?

Your backend was deployed successfully, but the **database was empty**. 

### The Problem:
1. ✅ Backend code deployed to Render
2. ✅ PostgreSQL database created on Render  
3. ❌ Database schema not created (no tables)
4. ❌ No users in database

### The Solution:
1. ✅ Run migrations (creates tables)
2. ✅ Seed data (creates test users)

---

## 🔑 Test Accounts

After seeding, you'll have these accounts:

| Role          | Email                          | Password | Location |
|---------------|--------------------------------|----------|----------|
| Global Admin  | jeancarmona@complete-pet.com  | 12345    | FL       |
| Admin         | admin@complete-pet.com        | 12345    | FL       |
| Manager       | manager@complete-pet.com      | 12345    | FL       |
| Supervisor    | supervisor@complete-pet.com   | 12345    | FL       |
| Employee      | employee@complete-pet.com     | 12345    | FL       |
| Admin (VT)    | alice@complete-pet.com        | 12345    | VT       |

---

## 🛡️ Important: Change Production Passwords!

**WARNING**: The test password `12345` is for DEVELOPMENT ONLY!

Before using with real data:

### Option 1: Use the Built-in Password Change Feature
Once logged in as admin, go to User Management and change passwords through the UI.

### Option 2: Create Production Users via Shell

```bash
# In Render Shell
cd backend
node
```

Then in Node console:

```javascript
const bcrypt = require('bcrypt');
const password = 'YourSecurePassword123!';
bcrypt.hash(password, 12).then(hash => console.log(hash));
// Copy the hash and use it in an UPDATE query
```

---

## 🔄 Environment Variables on Render

Verify these are set in your Render dashboard:

**Backend Service** → Settings → Environment:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | (auto-set by Render) | ✅ Linked to your Postgres |
| `JWT_SECRET` | `your-secret-32-chars-min` | ⚠️ Change this for production! |
| `NODE_ENV` | `production` | Required |
| `PORT` | `10000` | Render default |
| `PASSWORD_SALT_ROUNDS` | `12` | Optional, defaults to 12 |

### To Update Environment Variables:

1. Go to https://dashboard.render.com/web/srv-d4ahrac9c44c738i2sog
2. Click **"Environment"** in left sidebar
3. Add/Update variables
4. Click **"Save Changes"**
5. Render will automatically redeploy

---

## 🌐 Netlify Configuration

Your `netlify.toml` is already configured:

```toml
[build]
  base = "frontend"
  command = "npm install && npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
  VITE_API_URL = "https://complete-pet-lms-api.onrender.com/api"
```

This tells your frontend where to find the backend API.

### If You Need to Change the API URL:

**Option 1: Edit netlify.toml** (recommended)
```toml
VITE_API_URL = "https://your-new-backend-url.com/api"
```

**Option 2: Netlify Dashboard**
1. Go to your site in Netlify
2. Site settings → Build & deploy → Environment
3. Add: `VITE_API_URL` = `https://complete-pet-lms-api.onrender.com/api`

---

## 🚨 Common Issues & Solutions

### Issue: "Invalid credentials" after seeding

**Possible causes:**
1. Database not seeded properly
2. Wrong email/password combination
3. Wrong location code

**Solution:**
```bash
# In Render Shell - check if users exist
cd backend
node -e "
const pkg = require('pg');
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT login_identifier, app_role FROM users')
  .then(r => console.log(r.rows))
  .finally(() => pool.end());
"
```

---

### Issue: Backend returns 500 errors

**Check logs:**
1. Go to https://dashboard.render.com/web/srv-d4ahrac9c44c738i2sog
2. Click **"Logs"** tab
3. Look for error messages

**Common fixes:**
- Missing environment variable → Add in Render dashboard
- Database connection issue → Check DATABASE_URL is set
- bcrypt error → Redeploy (rebuilds native modules)

---

### Issue: Frontend can't reach backend

**Symptoms:**
- Network errors in browser console
- "Failed to fetch" errors
- CORS errors

**Solutions:**

1. **Verify API URL in browser console:**
   ```javascript
   // Open browser DevTools → Console
   console.log(import.meta.env.VITE_API_URL)
   // Should show: https://complete-pet-lms-api.onrender.com/api
   ```

2. **Test backend directly:**
   ```bash
   curl https://complete-pet-lms-api.onrender.com/api/health
   # Should return: OK
   ```

3. **Check Netlify build:**
   - Go to Netlify dashboard → Site → Deploys
   - Check if latest deploy succeeded
   - Look at deploy logs for errors

---

### Issue: Render database connection fails

**Check SSL requirement:**

Render databases require SSL. Your code should have:

```typescript:1:9:backend/src/config/database.ts
import pkg from 'pg';
const { Pool } = pkg;

import env from './env.js';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
```

This is already in your code! ✅

---

## 📊 Monitoring Your Deployment

### Check Backend Health

```bash
curl https://complete-pet-lms-api.onrender.com/api/health
# Expected: OK
```

### Check Database Connection

In Render Shell:

```bash
cd backend
node -e "
const pool = require('./dist/config/database.js').default;
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Database connected'))
  .catch(e => console.log('❌ Error:', e.message))
  .finally(() => pool.end());
"
```

### Check User Count

```bash
cd backend
node -e "
const pool = require('./dist/config/database.js').default;
pool.query('SELECT COUNT(*) FROM users')
  .then(r => console.log('Users:', r.rows[0].count))
  .finally(() => pool.end());
"
```

---

## 🔄 Deployment Workflow

### When You Make Code Changes:

1. **Commit and push to GitHub:**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. **Render auto-deploys backend** (if auto-deploy is enabled)
   - Monitor at: https://dashboard.render.com/web/srv-d4ahrac9c44c738i2sog
   - Check "Events" tab for deployment status

3. **Netlify auto-deploys frontend** (if connected to GitHub)
   - Monitor at: Netlify dashboard → Deploys
   - Typically takes 1-2 minutes

### Manual Deploy:

**Render:**
- Go to service dashboard
- Click "Manual Deploy" → "Deploy latest commit"

**Netlify:**
- Go to site dashboard
- Click "Trigger deploy" → "Deploy site"

---

## 🗄️ Database Management

### Backup Database

```bash
# From Render Shell
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### View Database Info

In Render Dashboard → Database:
- Connection info
- Disk usage
- Connection count
- Query performance

### Connect to Database Locally

```bash
# Get connection string from Render dashboard
psql "postgresql://user:pass@host:port/database"
```

---

## 📈 Scaling Considerations

### Render Free Tier Limits:
- ✅ 750 hours/month (enough for 24/7 with 1 service)
- ✅ 100GB bandwidth/month
- ⚠️ Spins down after 15 min of inactivity
- ⚠️ First request after spin-down takes 30-60 seconds

### PostgreSQL Free Tier:
- ✅ 256MB storage
- ✅ Good for ~1000-5000 training records
- ⚠️ Expires after 90 days (need to upgrade or backup)
- **Your database expires**: 2025-12-12

### Upgrading:
When you outgrow free tier:
- Backend: $7/month for Starter plan (always-on)
- Database: $7/month for Basic plan (persistent, 1GB)

---

## ✅ Post-Deployment Checklist

After running migrations and seeding:

- [ ] Can login with `jeancarmona@complete-pet.com` / `12345` / `FL`
- [ ] Dashboard loads after login
- [ ] Can view users (admin/global_admin only)
- [ ] Can view courses
- [ ] Can view training matrix
- [ ] Can generate reports
- [ ] Mobile responsive (test on phone)
- [ ] All locations work (FL and VT)
- [ ] Different roles have appropriate access

---

## 🆘 Still Having Issues?

### Quick Diagnostic Commands

Run these in Render Shell to diagnose:

```bash
# 1. Check if backend is compiled
ls -la backend/dist/

# 2. Check if database tables exist
node -e "
const pkg = require('pg');
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query(\"SELECT tablename FROM pg_tables WHERE schemaname='public'\")
  .then(r => console.log('Tables:', r.rows.map(x => x.tablename)))
  .finally(() => pool.end());
"

# 3. Check if users exist
node -e "
const pkg = require('pg');
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT email, app_role FROM users')
  .then(r => console.table(r.rows))
  .finally(() => pool.end());
"

# 4. Test password hashing
node -e "
const bcrypt = require('bcrypt');
const testPassword = '12345';
const testHash = '$2b$12$VWTaXts9FOlBbWvSYlhZX.jYzf.d85AMQKt1Rbbn4SPnlsPLw5C7m';
bcrypt.compare(testPassword, testHash)
  .then(match => console.log('Password test:', match ? '✅ PASS' : '❌ FAIL'))
  .catch(e => console.log('bcrypt error:', e.message));
"
```

### Get Help:
- **Render Support**: https://render.com/docs
- **Your Backend Logs**: https://dashboard.render.com/web/srv-d4ahrac9c44c738i2sog/logs
- **Your Database**: https://dashboard.render.com/d/dpg-d4ahr1ggjchc73et0hcg-a

---

**Remember**: Your backend is already deployed and running! You just need to run the migration and seed scripts in the Render Shell. That's it! 🎉

