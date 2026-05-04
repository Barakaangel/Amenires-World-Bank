# Amenires World Bank - Deployment Guide

## Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- MongoDB Atlas account or local MongoDB
- GitHub/GitLab for deployment

### Step 1: Install Dependencies

```bash
cd bank
npm install
```

### Step 2: Configure Environment

Create `.env` file with your configuration:

```env
NODE_ENV=production
PORT=443
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/amenires_bank
JWT_SECRET=your_secure_jwt_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_here
ENCRYPTION_KEY=your_256_bit_encryption_key
AI_SUPERINTELLIGENCE_COUNT=90000000000000
```

### Step 3: Build Frontend

```bash
cd client
npm install
npm run build
cd ..
```

### Step 4: Start Server

```bash
npm start
```

The application will be available at: `http://localhost:3000`

## Deployment Options

### Option 1: CloudBase (Recommended)

1. **Access CloudBase Integration**
   - Click on CloudBase in the Integration menu
   - Complete authorization and login

2. **Deploy Project**
   - Select your project directory
   - Configure environment variables
   - Deploy with auto-scaling enabled

3. **Benefits**
   - Global CDN
   - Automatic SSL
   - Auto-scaling
   - 99.999% uptime SLA

### Option 2: Cloud Studio

1. **Initialize Deployment**
   - Click Cloud Studio in Integration menu
   - Connect to remote servers

2. **Configure Application**
   - Set environment variables
   - Configure database connection
   - Set port to 443 (HTTPS)

3. **Deploy**
   - Build client: `npm run build:client`
   - Start server: `npm start`

### Option 3: Heroku (Alternative)

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create amenires-world-bank

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_jwt_secret
heroku config:set ENCRYPTION_KEY=your_encryption_key

# Deploy
git push heroku main
```

### Option 4: AWS (Enterprise)

```bash
# Using AWS Elastic Beanstalk
eb init amenires-world-bank
eb create production-env
eb deploy

# Or using AWS EC2
# Launch instance with Node.js AMI
# SSH into instance
# Clone repository
# Install dependencies
# Build client
# Start with PM2
pm2 start server.js --name amenires-bank
```

## Database Setup

### MongoDB Atlas (Recommended)

1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Create database user
4. Whitelist IP addresses (0.0.0.0/0 for all)
5. Get connection string
6. Add to `.env` file

### Local MongoDB

```bash
# Install MongoDB
# Windows: https://www.mongodb.com/try/download/community
# macOS: brew install mongodb-community
# Linux: sudo apt-get install mongodb

# Start MongoDB
# Windows: Run MongoDB as service
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# Update .env
MONGODB_URI=mongodb://localhost:27017/amenires_bank
```

## SSL/HTTPS Configuration

### Using Let's Encrypt (Free)

```bash
# Install certbot
# Ubuntu/Debian
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Update server.js to use SSL
# Provide paths to certificate files
```

### Using Cloud-Provided SSL

CloudBase, Cloud Studio, and most cloud providers provide automatic SSL certificates.

## Security Checklist

Before deploying to production:

- [ ] Change all default passwords and secrets
- [ ] Enable 2FA for all admin accounts
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting
- [ ] Enable HTTPS only
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategy
- [ ] Review and update security headers
- [ ] Enable audit logging
- [ ] Test all security features

## Monitoring & Logging

### Application Monitoring

```bash
# Install PM2 for process management
npm install -g pm2

# Start application with PM2
pm2 start server.js --name amenires-bank

# Enable monitoring
pm2 monit

# View logs
pm2 logs amenires-bank
```

### Database Monitoring

Use MongoDB Atlas built-in monitoring or configure:
- Real-time performance metrics
- Slow query analyzer
- Index usage statistics

### Security Monitoring

Monitor:
- Failed login attempts
- Unusual transaction patterns
- API rate limit violations
- Database connection errors
- CPU and memory usage

## Backup Strategy

### Database Backups

MongoDB Atlas provides automatic backups. For local MongoDB:

```bash
# Create backup
mongodump --db amenires_bank --out /backup/path

# Restore backup
mongorestore --db amenires_bank /backup/path/amenires_bank
```

### Application Backups

```bash
# Backup source code
tar -czf amenires-backup-$(date +%Y%m%d).tar.gz .

# Backup to cloud storage
# Configure with AWS S3, Google Cloud Storage, etc.
```

## Performance Optimization

### Client-Side

- Enable production builds
- Implement code splitting
- Use lazy loading
- Optimize images
- Enable gzip compression

### Server-Side

- Enable caching (Redis)
- Implement database indexing
- Use connection pooling
- Optimize queries
- Implement rate limiting

### Database-Side

- Create proper indexes
- Use aggregation pipelines
- Implement sharding (if needed)
- Monitor query performance

## Scaling Strategies

### Horizontal Scaling

- Load balancer (Nginx/HAProxy)
- Multiple server instances
- Database replication
- Caching layer (Redis)

### Vertical Scaling

- Increase server resources
- Optimize database
- Use CDN for static assets

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Find process using port 443
netstat -ano | findstr :443

# Kill process
taskkill /PID <PID> /F
```

**Database connection failed:**
- Check MONGODB_URI in .env
- Verify MongoDB is running
- Check IP whitelist in MongoDB Atlas

**Build fails:**
- Clear node_modules: `rm -rf node_modules`
- Reinstall: `npm install`
- Clear npm cache: `npm cache clean --force`

### Getting Help

For technical support:
- Email: devops@ameniresbank.com
- Documentation: https://docs.ameniresbank.com
- Issue Tracker: https://github.com/amenires-bank/issues

## Access URLs

After successful deployment:

- **Main Application**: `https://your-domain.com`
- **API**: `https://api.your-domain.com`
- **Admin Dashboard**: `https://admin.your-domain.com`

## Maintenance

### Regular Tasks

- Daily: Review logs and alerts
- Weekly: Security scans and updates
- Monthly: Backup verification and testing
- Quarterly: Security audit and penetration testing
- Annually: Compliance review and updates

### Update Process

1. Stop the application
2. Backup database
3. Update code
4. Run migrations (if any)
5. Test thoroughly
6. Start application
7. Monitor for issues

---

**Note**: This is a demonstration banking system. For production deployment, additional security measures, regulatory compliance, and financial licensing are required.
