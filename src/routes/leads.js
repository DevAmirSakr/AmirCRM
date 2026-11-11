const express = require('express');
const router = express.Router();
const db = require('../db');

const SAMPLE_NAMES = [
  'محمد عبد الفتاح القاضي',
  'مروان أشرف الصاوي',
  'نهى كمال الدين',
  'عمر فاروق الباز',
  'هند مصطفى السعدني',
  'إسلام يحيى الجيار',
  'ريهام إبراهيم عبد الغني',
  'شادي مجدي علام'
];

const SAMPLE_BUSINESSES = [
  {
    business_name: 'براند أزياء وعبايات خليجية فاخرة',
    website_type: 'ecommerce',
    budget: 16000,
    deal_value: 18000,
    notes: 'طلب متجر إلكتروني متكامل سريع مربوط بشركة شحن وبوابة دفع مع بكسل إعلانات',
    requirements: ['domain_hosting', 'payment_gateway', 'shipping_integration', 'meta_pixel']
  },
  {
    business_name: 'مكتب الرؤية للاستشارات القانونية والتحكيم',
    website_type: 'corporate',
    budget: 14000,
    deal_value: 15000,
    notes: 'موقع تعريفي احترافي للشركة باللغتين العربية والإنجليزية لتقديم الخدمات للشركات',
    requirements: ['domain_hosting', 'multilingual', 'corporate_email']
  },
  {
    business_name: 'عيادة ديرما كير للجلدية والتجميل',
    website_type: 'booking',
    budget: 12000,
    deal_value: 14000,
    notes: 'حجز مواعيد واستشارات أونلاين وتأكيد الحجز وتكامل واتساب',
    requirements: ['domain_hosting', 'booking_system', 'whatsapp_chat']
  },
  {
    business_name: 'إطلاق منتج عناية طبيعي للبشرة',
    website_type: 'landing',
    budget: 7000,
    deal_value: 8000,
    notes: 'صفحة هبوط سريعة جداً ومحسنة للتحويلات من إعلانات تيك توك وإنستغرام',
    requirements: ['domain_hosting', 'contact_form', 'meta_pixel']
  },
  {
    business_name: 'أكاديمية فيوتشر كودرز للبرمجة',
    website_type: 'custom',
    budget: 22000,
    deal_value: 25000,
    notes: 'منصة كورسات تفاعلية مع بوابات دفع واختبارات وإصدار شهادات تلقائية',
    requirements: ['domain_hosting', 'custom_backend', 'payment_gateway', 'video_protection']
  }
];

function generateRandomEgyptianPhone() {
  const prefixes = ['010', '011', '012', '015'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const digits = Math.floor(10000000 + Math.random() * 90000000);
  return `2${prefix}${digits}`.replace('201', '201'); // Ensure format 2010... or 2011...
}

// Handler for Meta Lead Ads Webhook
function metaWebhookHandler(req, res) {
  try {
    let payload = req.body || {};

    // Support nested Meta webhook payloads if Meta sends form_data or entry
    if (payload.entry && Array.isArray(payload.entry)) {
      // standard Meta webhook wrapper
      payload = payload.entry[0]?.changes?.[0]?.value || payload;
    }

    let name = payload.name || payload.full_name;
    let phone = payload.phone || payload.phone_number;
    let social_handle = payload.social_handle || payload.username || payload.ig_username || payload.messenger_id;
    let email = payload.email;
    let business_name = payload.business_name || payload.company_name;
    let website_type = payload.website_type;
    let campaign_name = payload.campaign_name || 'حملة إعلانات ميتا - طلب موقع';
    let budget = Number(payload.budget) || 0;
    let deal_value = Number(payload.deal_value) || 0;
    let notes = payload.notes || '';
    let requirements = Array.isArray(payload.requirements) ? payload.requirements : [];

    // If empty or missing name, generate realistic random lead for testing
    if (!name || String(name).trim() === '') {
      name = SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)];
      const sample = SAMPLE_BUSINESSES[Math.floor(Math.random() * SAMPLE_BUSINESSES.length)];
      business_name = sample.business_name;
      website_type = sample.website_type;
      budget = sample.budget;
      deal_value = sample.deal_value;
      notes = sample.notes;
      requirements = sample.requirements;
      phone = generateRandomEgyptianPhone();
      email = `client_${Date.now().toString().slice(-4)}@example.com`;
    }

    const lead = db.createLead({
      name,
      phone: phone ? String(phone).trim() : '',
      social_handle: social_handle ? String(social_handle).trim() : '',
      email: email || '',
      business_name: business_name || 'نشاط تجاري قيد الإنشاء',
      website_type: website_type || 'ecommerce',
      stage: 'new',
      priority: 'high',
      campaign_name,
      ad_source: 'meta_form',
      budget: budget || 15000,
      deal_value: deal_value || budget || 18000,
      deposit_paid: 0,
      requirements,
      notes,
      next_followup_at: new Date(Date.now() + 3 * 3600 * 1000).toISOString(), // due in 3 hours
      _activitySummary: 'وصل العميل تلقائياً من إعلان ميتا (Meta Lead Ads Webhook)'
    });

    return res.status(201).json({ lead });
  } catch (err) {
    console.error('Error handling meta webhook:', err);
    return res.status(500).json({ error: 'خطأ في معالجة طلب الويب هوك', details: err.message });
  }
}

// GET /api/leads
router.get('/', (req, res) => {
  try {
    const { stage, website_type, priority, ad_source, campaign, search, followup } = req.query;
    const leads = db.getLeads({ stage, website_type, priority, ad_source, campaign, search, followup });
    res.json({ leads });
  } catch (err) {
    console.error('Error getting leads:', err);
    res.status(500).json({ error: 'فشل في جلب العملاء', details: err.message });
  }
});

// POST /api/leads/import
router.post('/import', (req, res) => {
  try {
    const leadsData = req.body?.leads;
    if (!Array.isArray(leadsData)) {
      return res.status(400).json({ error: 'صيغة البيانات غير صحيحة، يجب إرسال مصفوفة leads' });
    }
    const result = db.importLeads(leadsData);
    res.status(201).json(result);
  } catch (err) {
    console.error('Error importing leads:', err);
    res.status(500).json({ error: 'فشل استيراد العملاء', details: err.message });
  }
});

// GET /api/leads/:id
router.get('/:id', (req, res) => {
  try {
    const lead = db.getLeadById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }
    const activities = db.getActivitiesForLead(lead.id);
    res.json({ lead, activities });
  } catch (err) {
    console.error('Error getting lead by id:', err);
    res.status(500).json({ error: 'فشل جلب تفاصيل العميل', details: err.message });
  }
});

// POST /api/leads
router.post('/', (req, res) => {
  try {
    const lead = db.createLead(req.body || {});
    res.status(201).json({ lead });
  } catch (err) {
    console.error('Error creating lead:', err);
    res.status(500).json({ error: 'فشل إنشاء العميل', details: err.message });
  }
});

// PUT /api/leads/:id
router.put('/:id', (req, res) => {
  try {
    const lead = db.updateLead(req.params.id, req.body || {});
    if (!lead) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }
    res.json({ lead });
  } catch (err) {
    console.error('Error updating lead:', err);
    res.status(500).json({ error: 'فشل تحديث بيانات العميل', details: err.message });
  }
});

// PATCH /api/leads/:id/stage
router.patch('/:id/stage', (req, res) => {
  try {
    const { stage, lost_reason, deposit_paid } = req.body || {};
    if (!stage) {
      return res.status(400).json({ error: 'حقل المرحلة (stage) مطلوب' });
    }
    const lead = db.updateLeadStage(req.params.id, { stage, lost_reason, deposit_paid });
    if (!lead) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }
    res.json({ lead });
  } catch (err) {
    console.error('Error updating lead stage:', err);
    res.status(500).json({ error: 'فشل تغيير مرحلة العميل', details: err.message });
  }
});

// DELETE /api/leads/:id
router.delete('/:id', (req, res) => {
  try {
    const success = db.deleteLead(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting lead:', err);
    res.status(500).json({ error: 'فشل حذف العميل', details: err.message });
  }
});

module.exports = router;
module.exports.metaWebhookHandler = metaWebhookHandler;
