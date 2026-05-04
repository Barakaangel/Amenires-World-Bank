# 🚀 Start the Amenires World Bank Server

## Quick Start (Windows)

### Option 1: Start with Auto-Restart (Recommended)
```bash
# Double-click this file in File Explorer
start.bat

# Or run in terminal:
start.bat --seed
```

### Option 2: Start with npm
```bash
# Standard start
npm start

# Or start with auto-restart
npm run start:auto
```

### Option 3: Start with node directly
```bash
node start.js
```

---

## Quick Start (Mac/Linux)

### Option 1: Start with Auto-Restart (Recommended)
```bash
# Make script executable
chmod +x start.sh

# Start server
./start.sh

# Start with seed data
./start.sh --seed
```

### Option 2: Start with npm
```bash
# Standard start
npm start

# Or start with auto-restart
npm run start:auto
```

### Option 3: Start with node directly
```bash
node start.js
```

---

## Development Mode (with auto-reload)

```bash
npm run dev
```

---

## What Happens When You Start

### 1. ✅ Environment Check
- Checks if `.env` file exists
- Creates it from `.env.example` if needed

### 2. ✅ Dependencies
- Installs npm packages if `node_modules` doesn't exist

### 3. ✅ Database Setup
- Creates MongoDB indexes
- Seeds sample data (if `--seed` flag is used)

### 4. ✅ Server Start
- Starts Node.js server on port 3000
- Auto-restarts on failure
- Logs all activities

---

## Access the Application

Once the server is running:

### 🌐 Web Interface
```
http://localhost:3000
```

### 🔐 Login with Test Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@bank.com | password123 |
| **Staff** | john.staff@bank.com | password123 |
| **Staff** | sarah.staff@bank.com | password123 |
| **Customer** | alice@example.com | password123 |
| **Customer** | bob@example.com | password123 |
| **Customer** | charlie@example.com | password123 |

### 📊 API Endpoints
```
Health Check:    http://localhost:3000/api/health
System Status:   http://localhost:3000/api/system/status
Bank Identity:   http://localhost:3000/api/bank/identity
```

---

## Server Features

### ✅ Auto-Restart
The server will automatically restart if it crashes, ensuring continuous operation.

### ✅ Keep-Alive
The startup scripts prevent the server from stopping, keeping it running indefinitely.

### ✅ Error Handling
All errors are logged with clear messages for debugging.

### ✅ Database Connection
Automatically connects to MongoDB and handles connection errors gracefully.

---

## Troubleshooting

### Port Already in Use
If you see "Port 3000 is already in use":

**Windows:**
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change port in .env
PORT=3001 npm start
```

**Mac/Linux:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=3001 npm start
```

### MongoDB Connection Error
If MongoDB is not running:

**Windows:**
```bash
# Start MongoDB (if installed as service)
net start MongoDB

# Or start mongod manually
mongod --dbpath C:\data\db
```

**Mac/Linux:**
```bash
# Start MongoDB
mongod --dbpath /path/to/data
```

**Or use MongoDB Atlas (Cloud):**
1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Update `.env` file:
```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/amenires-bank
```

### Dependencies Not Installed
```bash
cd c:\Users\Knm Editors\CodeBuddy\bank
npm install
```

### Permission Denied (Mac/Linux)
```bash
# Make start script executable
chmod +x start.sh

# Or run with sudo
sudo ./start.sh
```

---

## Stopping the Server

### Windows
- Press `Ctrl+C` in the terminal
- Or close the terminal window

### Mac/Linux
- Press `Ctrl+C` in the terminal

The server will gracefully shutdown and save all data.

---

## Running in Background

### Windows
```bash
# Run in background
start /B npm start

# Or use PM2
npm install -g pm2
pm2 start server.js --name amenires-bank
pm2 logs amenires-bank
```

### Mac/Linux
```bash
# Run in background with nohup
nohup npm start > server.log 2>&1 &

# Or use PM2
npm install -g pm2
pm2 start server.js --name amenires-bank
pm2 logs amenires-bank
```

---

## Monitoring the Server

### Check Server Status
```bash
# Health check
curl http://localhost:3000/api/health

# System status
curl http://localhost:3000/api/system/status
```

### View Logs
```bash
# If running with PM2
pm2 logs amenires-bank

# If running in background
tail -f server.log
```

---

## Production Deployment

For production deployment, see:
- `DEPLOYMENT_GUIDE.md` - Complete deployment instructions
- `PROJECT_COMPLETION_SUMMARY.md` - Project overview

### Quick Production Start
```bash
# Using PM2 (recommended)
pm2 start ecosystem.config.js

# Using Docker
docker-compose up -d

# Using Kubernetes
kubectl apply -f k8s/
```

---

## Next Steps After Starting

1. ✅ **Open in Browser**
   ```
   http://localhost:3000
   ```

2. ✅ **Login**
   - Use `admin@bank.com` / `password123`
   - Or any other test credentials

3. ✅ **Explore Features**
   - Dashboard overview
   - Account management
   - Transaction history
   - Portfolio tracking
   - Trading platform
   - AI assistant (150+ languages)

4. ✅ **Test API Endpoints**
   - Use Postman or curl
   - See `API_DOCUMENTATION.md` for all endpoints

---

## Support

If you encounter any issues:

1. Check the terminal error messages
2. Review the troubleshooting section above
3. Check `DEPLOYMENT_GUIDE.md`
4. Verify `.env` file has correct settings

---

**🎉 Once started, your banking system will be available at:**
**http://localhost:3000**

**Keep this terminal window open to keep the server running!**
