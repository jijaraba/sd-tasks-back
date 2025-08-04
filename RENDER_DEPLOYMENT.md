# Render.com Deployment Guide

## 🚀 **Backend Deployment Ready!**

The SD Tasks backend is now configured and ready for deployment on Render.com with automatic PostgreSQL database setup.

## 📋 **Pre-deployment Checklist**

✅ **render.yaml configured** - Automatic deployment configuration  
✅ **Database config updated** - SSL and environment variables support  
✅ **CORS configured** - Production-ready CORS settings  
✅ **Build scripts ready** - TypeScript compilation for production  
✅ **Health check endpoint** - `/health` for monitoring  
✅ **Environment variables** - Production-ready configuration  

## 🔧 **Deployment Steps**

### **Option 1: Deploy via GitHub (Recommended)**

#### **1. Push to GitHub**
```bash
# If not already done, create GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/sd-tasks-back.git
git branch -M main
git push -u origin main
```

#### **2. Deploy on Render**
1. **Go to**: https://render.com
2. **Sign up/Login** with GitHub account
3. **Click "New"** → **"Blueprint"**
4. **Connect Repository**: Select `sd-tasks-back`
5. **Deploy**: Render will automatically:
   - Create PostgreSQL database
   - Set up web service
   - Configure environment variables
   - Deploy the application

### **Option 2: Manual Setup**

#### **1. Create Database**
1. **Render Dashboard** → **"New"** → **"PostgreSQL"**
2. **Name**: `sd-tasks-postgres`
3. **Plan**: Free tier
4. **Create Database**

#### **2. Create Web Service**
1. **Render Dashboard** → **"New"** → **"Web Service"**
2. **Connect Repository**: `sd-tasks-back`
3. **Configure**:
   - **Name**: `sd-tasks-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free tier

#### **3. Environment Variables**
Set these in Render web service settings:
```
NODE_ENV=production
PORT=10000
JWT_SECRET=your-generated-secret-key
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_HOST=your-database-host
DB_PORT=5432
```

## 🔗 **Configuration Details**

### **render.yaml Features**
- ✅ **Automatic PostgreSQL** database creation
- ✅ **Environment variables** auto-configuration
- ✅ **Health checks** at `/health` endpoint
- ✅ **Free tier** configuration
- ✅ **Production builds** with TypeScript compilation

### **Database Configuration**
```typescript
// Supports both DATABASE_URL and individual environment variables
const DATABASE_URL = process.env.DATABASE_URL || 
  `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

// SSL enabled for production
ssl: process.env.NODE_ENV === 'production' 
  ? { require: true, rejectUnauthorized: false } 
  : false
```

### **CORS Configuration**
```typescript
// Production CORS settings
origin: process.env.NODE_ENV === 'production' 
  ? ['https://your-frontend-domain.com', 'http://localhost:8100'] 
  : ['http://localhost:8100', 'http://10.0.2.2:8100']
```

## 🌐 **After Deployment**

### **Your API will be available at:**
```
https://sd-tasks-backend.onrender.com
```

### **Test endpoints:**
```bash
# Health check
curl https://sd-tasks-backend.onrender.com/health

# API root
curl https://sd-tasks-backend.onrender.com/

# Test authentication
curl -X POST https://sd-tasks-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

## 📱 **Update Frontend Configuration**

### **For Production Ionic App:**
Update your Ionic project's `.env` file:
```bash
# Production backend URL
VITE_API_BASE_URL=https://sd-tasks-backend.onrender.com/api
```

### **For Development:**
Keep using the environment switcher:
```bash
# Local development
./switch-env.sh web

# Android emulator
./switch-env.sh android  

# Production testing
# Update .env manually with Render URL
```

## 🔧 **Render Configuration**

### **Automatic Features:**
- ✅ **Auto-scaling**: Handles traffic spikes
- ✅ **HTTPS**: Automatic SSL certificates
- ✅ **Health monitoring**: Automatic restarts if unhealthy
- ✅ **Log streaming**: Real-time application logs
- ✅ **Environment management**: Secure environment variables
- ✅ **PostgreSQL**: Managed database with backups

### **Free Tier Limits:**
- **Web Service**: 512MB RAM, sleeps after 15min inactivity
- **PostgreSQL**: 1GB storage, 97 connection limit
- **Bandwidth**: 100GB/month
- **Build time**: 500 build minutes/month

## 🐛 **Troubleshooting**

### **Common Issues:**

#### **Build Failures:**
```bash
# Check build logs in Render dashboard
# Ensure all dependencies are in package.json
# Verify TypeScript compilation works locally
npm run build
```

#### **Database Connection:**
```bash
# Check environment variables in Render dashboard
# Verify SSL configuration
# Check database logs
```

#### **CORS Issues:**
```bash
# Update CORS origins in server.ts
# Add your frontend domain to allowed origins
# Redeploy after changes
```

### **Debugging:**
1. **Check Render logs** in dashboard
2. **Test endpoints** with curl/Postman
3. **Verify environment variables** are set correctly
4. **Check database connection** in logs

## 🎯 **Next Steps**

1. ✅ **Deploy to Render** using steps above
2. 🔄 **Update Frontend** with production API URL
3. 🧪 **Test API endpoints** with production database
4. 📱 **Update mobile app** environment configuration
5. 🚀 **Deploy Frontend** (Vercel, Netlify, etc.)

## 📋 **Deployment Checklist**

- [ ] GitHub repository created and pushed
- [ ] Render account set up
- [ ] Database deployed on Render
- [ ] Web service deployed on Render
- [ ] Environment variables configured
- [ ] Health check endpoint working
- [ ] API endpoints tested
- [ ] Frontend updated with production URL
- [ ] CORS configured for frontend domain
- [ ] SSL/HTTPS working

## 🎉 **Ready for Production!**

The backend is now production-ready and configured for Render.com deployment with:
- ✅ **TypeScript compilation**
- ✅ **PostgreSQL database**
- ✅ **JWT authentication**
- ✅ **CRUD operations**
- ✅ **Health monitoring**
- ✅ **SSL/HTTPS support**
- ✅ **Environment configuration**

**Deploy now and get your backend live!** 🚀