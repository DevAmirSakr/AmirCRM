const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/analytics
router.get('/', (req, res) => {
  try {
    const stats = db.getAnalytics();
    res.json(stats);
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ error: 'فشل في جلب إحصائيات النظام ومؤشرات الأداء', details: err.message });
  }
});

module.exports = router;
