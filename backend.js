// server.js - Complete Portfolio Backend (Single File)
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-portfolio.netlify.app'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting (100 requests per 15min per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});
app.use('/api/', limiter);

// Serve static files (optional - for hosting portfolio)
app.use(express.static('public'));

// Email configuration (Gmail example - use environment variables in production)
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// 📧 Contact Form API
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Basic validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Send email
    const mailOptions = {
      from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER || 'your-email@gmail.com',
      replyTo: email,
      subject: `New Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Message from Portfolio</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p><em>Timestamp: ${new Date().toLocaleString()}</em></p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    // Log to file (optional backup)
    const logEntry = `${new Date().toISOString()} - ${name} (${email}): ${subject}\n`;
    fs.appendFileSync('contacts.log', logEntry);

    res.json({ 
      success: true, 
      message: 'Thank you! Your message has been sent.' 
    });

  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
});

// 📊 Portfolio Analytics API
app.post('/api/analytics', (req, res) => {
  const { event, page, userAgent } = req.body;
  
  const analyticsData = {
    timestamp: new Date().toISOString(),
    event,
    page,
    ip: req.ip,
    userAgent: userAgent || req.get('User-Agent')
  };

  // Log analytics
  fs.appendFileSync('analytics.log', JSON.stringify(analyticsData) + '\n');
  
  res.json({ success: true });
});

// 🗺️ Simple Admin Dashboard (GET analytics)
app.get('/api/admin/analytics', (req, res) => {
  try {
    const analytics = fs.existsSync('analytics.log') 
      ? fs.readFileSync('analytics.log', 'utf8').split('\n').filter(Boolean)
      : [];
    
    res.json({
      totalVisits: analytics.length,
      recent: analytics.slice(-10).map(line => JSON.parse(line))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Portfolio Backend running on http://localhost:${PORT}`);
  console.log(`📧 Contact API: POST http://localhost:${PORT}/api/contact`);
  console.log(`📊 Analytics: POST http://localhost:${PORT}/api/analytics`);
});