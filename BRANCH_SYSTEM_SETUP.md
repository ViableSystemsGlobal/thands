# Branch System Setup Guide

## ✅ What's Implemented (Hybrid Model)

The hybrid branch system is **fully implemented** with:

### 1. **Automatic Branch Detection** ✅
- Branch context middleware detects branch from:
  - `X-Branch-Code` header (from frontend)
  - Query parameter `?branch=UK`
  - Defaults to 'GH' if none specified

### 2. **Manual Branch Selection** ✅
- Branch selector UI component in navbar
- Users can manually switch branches
- Preference saved in localStorage

### 3. **Persistent Storage** ✅
- Branch preference stored in localStorage
- Automatically sent in API headers (`X-Branch-Code`)
- Persists across page reloads

### 4. **Branch-Specific Settings** ✅
- Database-driven branch configurations
- Branch-specific shipping origins
- Branch-specific default currencies
- Branch-specific contact information

### 5. **RBAC (Role-Based Access Control)** ✅
- Super admins can access all branches
- Regular admins restricted to assigned branches
- Orders filtered by branch access

## 🚀 Setup Steps

### Step 1: Run Database Migration

**IMPORTANT:** You need to run the database migration first!

```sql
-- Run this in your Supabase SQL Editor or PostgreSQL
-- File: backend/migrations/09_create_branch_system.sql
```

Or run it via command line:
```bash
psql -U your_user -d your_database -f backend/migrations/09_create_branch_system.sql
```

### Step 2: Restart Backend Server

The backend needs to be restarted to apply CORS changes:

```bash
cd backend
PORT=3003 npm start
```

### Step 3: Verify Setup

1. Check if branches API works:
   ```bash
   curl http://localhost:3003/api/branches
   ```

2. Check if branch context works:
   ```bash
   curl -H "X-Branch-Code: UK" http://localhost:3003/api/branches/current
   ```

## 📋 Optional: IP Geolocation Detection

Currently, the system uses **manual selection + localStorage**. 

To add **automatic IP geolocation detection** (Phase 2 enhancement):

1. Add geolocation service to frontend:
   ```javascript
   // In BranchContext.jsx
   const detectBranchFromIP = async () => {
     try {
       const response = await fetch('https://ipapi.co/json/');
       const data = await response.json();
       const countryCode = data.country_code;
       
       // Map country to branch
       const branchMap = {
         'GH': 'GH',
         'GB': 'UK',
         'US': 'US'
       };
       
       return branchMap[countryCode] || 'GH';
     } catch (error) {
       return 'GH'; // Fallback
     }
   };
   ```

2. Use on first visit:
   ```javascript
   useEffect(() => {
     const savedBranch = localStorage.getItem('branch_code');
     if (!savedBranch) {
       detectBranchFromIP().then(setBranch);
     }
   }, []);
   ```

## 🔍 Current Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Branch Context Middleware | ✅ | Detects from headers/query |
| Branch Settings API | ✅ | Database-driven |
| Branch Selector UI | ✅ | Manual selection |
| localStorage Persistence | ✅ | Auto-saves preference |
| API Header Integration | ✅ | Sends X-Branch-Code |
| Order Branch Tagging | ✅ | Orders tagged with branch_code |
| Shipping Origin | ✅ | Branch-specific |
| RBAC | ✅ | Admin branch access control |
| IP Geolocation | ⏳ | Optional enhancement |

## 🐛 Troubleshooting

### CORS Errors
- Make sure backend is running on port 3003
- Check CORS configuration in `backend/server.js`
- Restart backend after changes

### "Failed to fetch branch" Error
- **Database migration not run** - Run the migration SQL file
- Check database connection
- Verify `branch_settings` table exists

### Products Not Showing
- Usually CORS errors - restart backend
- Check browser console for specific errors
- Verify API endpoints are accessible

## 📝 Next Steps

1. ✅ Run database migration
2. ✅ Restart backend server
3. ⏳ (Optional) Add IP geolocation detection
4. ⏳ (Optional) Add branch-specific hero images
5. ⏳ (Optional) Add branch-specific product recommendations

