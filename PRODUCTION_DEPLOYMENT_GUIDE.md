# Amenires World Bank - Production Deployment Guide

## 🚀 Quick Deployment Guide

### Prerequisites
- Node.js 18+ installed
- MongoDB installed or Docker
- Git installed
- GitHub account

---

## 📋 Deployment Options

### Option 1: GitHub Pages (Free & Simple)

1. **Push to GitHub** (already done)
   ```bash
   git push -u origin main
   ```

2. **Enable GitHub Pages:**
   - Go to repository settings
   - Navigate to Pages
   - Source: Deploy from a branch
   - Branch: main / root
   - Click Save

3. **Access your site:**
   - URL: `https://barakaangel.github.io/Amenires-World-Bank/`

4. **Note:** GitHub Pages only serves static files. Backend API needs separate hosting.

---

### Option 2: Netlify (Free, Fast, Auto-Deploy)

1. **Sign up:** https://netlify.com

2. **Connect GitHub:**
   - Click "New site from Git"
   - Select: `Barakaangel/Amenires-World-Bank`
   - Build command: Leave empty (static files)
   - Publish directory: `public`

3. **Environment Variables:**
   - Add API URL to environment variables

4. **Deploy:** Click "Deploy site"

5. **Access:** Netlify will provide a URL like `https://your-site.netlify.app`

---

### Option 3: Vercel (Free, Fast, Auto-Deploy)

1. **Sign up:** https://vercel.com

2. **Import Project:**
   - Click "New Project"
   - Import from GitHub
   - Select: `Barakaangel/Amenires-World-Bank`
   - Framework Preset: Other

3. **Environment Variables:**
   - Add: `NODE_ENV = production`
   - Add your API URL

4. **Deploy:** Click "Deploy"

5. **Access:** Vercel will provide a URL

---

### Option 4: Docker Deployment (Complete Solution)

#### Using Docker Compose (Production)

1. **Setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

2. **Run deployment script:**
   - **Windows:**
     ```bash
     deploy-production.bat
     ```
   - **Linux/Mac:**
     ```bash
     chmod +x deploy-production.sh
     ./deploy-production.sh
     ```

3. **Access your application:**
   - Frontend: `http://localhost`
   - API: `http://localhost:3000`
   - MongoDB: `mongodb://localhost:27017`

---

### Option 5: Cloud Deployment (AWS, GCP, Azure)

#### Using Heroku (Easiest Cloud)

1. **Install Heroku CLI:**
   ```bash
   npm install -g heroku
   ```

2. **Login:**
   ```bash
   heroku login
   ```

3. **Create app:**
   ```bash
   heroku create amenires-world-bank
   ```

4. **Set environment variables:**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-secret-key
   heroku config:set MONGODB_URI=your-mongodb-uri
   ```

5. **Add MongoDB addon:**
   ```bash
   heroku addons:create mongolab
   ```

6. **Deploy:**
   ```bash
   git push heroku main
   ```

7. **Access:** `https://amenires-world-bank.herokuapp.com`

---

## 🔧 Backend API Deployment

### Using Render (Free)

1. **Sign up:** https://render.com

2. **Create Web Service:**
   - Connect GitHub repository
   - Root directory: `./`
   - Build command: `npm install`
   - Start command: `node server-full.js`

3. **Environment Variables:**
   - Add all variables from `.env.example`

4. **Deploy:** Click "Create Web Service"

### Using Railway (Free)

1. **Sign up:** https://railway.app

2. **New Project → Deploy from GitHub**

3. **Add MongoDB service**

4. **Add application service**

5. **Connect services and deploy**

---

## 🌐 Custom Domain Setup

### Netlify Custom Domain

1. Go to Domain settings
2. Add custom domain
3. Update DNS records

### Vercel Custom Domain

1. Go to Settings → Domains
2. Add custom domain
3. Update DNS records

---

## 📊 Monitoring & Analytics

### Add Analytics

#### Google Analytics

Add to `public/index.html`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

---

## 🔒 Security Best Practices

1. **Environment Variables:**
   - Never commit `.env` file
   - Use secrets management on cloud platforms

2. **HTTPS:**
   - Enable HTTPS on all deployments
   - Use SSL certificates

3. **CORS:**
   - Configure CORS properly
   - Whitelist your frontend domain

4. **Rate Limiting:**
   - Enable rate limiting on API
   - Protect against DDoS

5. **Database Security:**
   - Use strong passwords
   - Enable authentication
   - Regular backups

---

## 📈 Performance Optimization

1. **CDN:**
   - Use CDN for static assets
   - Enable compression

2. **Caching:**
   - Enable Redis caching
   - Use browser caching

3. **Minification:**
   - Minify CSS and JS
   - Optimize images

---

## 🧪 Testing Before Production

```bash
# Run local tests
npm test

# Test API endpoints
curl http://localhost:3000/api/health

# Test frontend
npm start
# Open http://localhost:3000
```

---

## 📝 Checklist

- [ ] All environment variables set
- [ ] Database configured
- [ ] HTTPS enabled
- [ ] Custom domain (optional)
- [ ] Analytics configured
- [ ] Error monitoring set up
- [ ] Backup strategy in place
- [ ] Load testing completed
- [ ] Security audit done

---

## 🆘 Troubleshooting

### Common Issues

**Issue: Build fails**
- Check Node.js version (18+)
- Verify all dependencies installed

**Issue: Database connection fails**
- Check MongoDB connection string
- Verify MongoDB is running

**Issue: API not responding**
- Check server logs
- Verify PORT environment variable

**Issue: CORS errors**
- Check CORS configuration
- Verify frontend URL is whitelisted

---

## 📞 Support

For issues and questions:
- GitHub Issues: https://github.com/Barakaangel/Amenires-World-Bank/issues
- Email: support@amenires.worldbank

---

## 📚 Additional Resources

- [Netlify Documentation](https://docs.netlify.com)
- [Vercel Documentation](https://vercel.com/docs)
- [Heroku Documentation](https://devcenter.heroku.com)
- [Docker Documentation](https://docs.docker.com)

---

**Last Updated:** May 2026  
**Version:** 1.0.0
