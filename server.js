const express = require('express');
const path = require('path');
const fs = require('fs');

const leadsRouter = require('./src/routes/leads');
const activitiesRouter = require('./src/routes/activities');
const analyticsRouter = require('./src/routes/analytics');
const db = require('./src/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware for parsing JSON and urlencoded data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// API Routes
app.use('/api/leads', leadsRouter);
app.use('/api/leads', activitiesRouter);
app.use('/api/analytics', analyticsRouter);

// Meta Lead Ads Webhook route
app.post('/api/webhook/meta', leadsRouter.metaWebhookHandler);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'AmirCRM API',
    time: new Date().toISOString()
  });
});

// Reset database endpoint (useful for testing and demo resets)
app.post('/api/reset', (req, res) => {
  try {
    const data = db.resetDb();
    res.json({ success: true, message: 'تمت إعادة تهيئة قاعدة البيانات بالبيانات النموذجية', total_leads: data.leads.length });
  } catch (err) {
    res.status(500).json({ error: 'فشل في إعادة التهيئة', details: err.message });
  }
});

// Fallback for non-API routes to index.html if it exists
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'نقطة النهاية المطلوبة غير موجودة' });
  }
  const indexPath = path.join(publicPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'حدث خطأ داخلي في الخادم',
    details: err.message
  });
});

// Start server if executed directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 خادم AmirCRM يعمل بنجاح على المنفذ: http://localhost:${PORT}`);
  });
}

module.exports = app;
