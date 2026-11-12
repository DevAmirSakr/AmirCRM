const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');

function getActivitiesHandler(req, res) {
  try {
    const leadId = req.params.id || req.params.leadId;
    if (!leadId) {
      return res.status(400).json({ error: 'معرف العميل مطلوب' });
    }
    const lead = db.getLeadById(leadId);
    if (!lead) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }
    const activities = db.getActivitiesForLead(leadId);
    return res.json({ activities });
  } catch (err) {
    console.error('Error fetching activities:', err);
    return res.status(500).json({ error: 'فشل في جلب سجل المتابعات والنشاطات', details: err.message });
  }
}

function createActivityHandler(req, res) {
  try {
    const leadId = req.params.id || req.params.leadId;
    if (!leadId) {
      return res.status(400).json({ error: 'معرف العميل مطلوب' });
    }

    const { type, summary, next_followup_at, deal_value } = req.body || {};
    if (!summary || String(summary).trim() === '') {
      return res.status(400).json({ error: 'تفاصيل النشاط أو المتابعة (summary) مطلوبة' });
    }

    const result = db.createActivity(leadId, {
      type: type || 'note',
      summary: String(summary).trim(),
      next_followup_at,
      deal_value
    });

    if (!result) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }

    const isLegacyBrowserTab =
      req &&
      req.headers &&
      req.headers['x-crm-version'] !== '2' &&
      typeof req.headers['user-agent'] === 'string' &&
      req.headers['user-agent'].includes('Mozilla/');
    if (isLegacyBrowserTab && result.lead && result.lead.next_followup_at && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(result.lead.next_followup_at)) {
      result.lead = {
        ...result.lead,
        next_followup_at: `${result.lead.next_followup_at}Z`
      };
    }

    return res.status(201).json(result);
  } catch (err) {
    console.error('Error logging activity:', err);
    return res.status(500).json({ error: 'فشل في توثيق النشاط', details: err.message });
  }
}

// Handle GET & POST /api/leads/:id/activities (when mounted on /api/leads)
router.get('/:id/activities', getActivitiesHandler);
router.post('/:id/activities', createActivityHandler);

// Handle GET & POST / (when mounted directly on /api/leads/:id/activities)
router.get('/', getActivitiesHandler);
router.post('/', createActivityHandler);

module.exports = router;
