const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'crm.json');

const STAGE_LABELS = {
  new: 'جديد (من الإعلان)',
  contacted: 'تم التواصل الأول',
  discovery: 'استكشاف المتطلبات',
  proposal: 'إرسال العرض المالي والفني',
  negotiation: 'مفاوضات وتعديل العرض',
  won: 'تم الإغلاق بنجاح ✓',
  lost: 'خسارة / تأجيل'
};

const WEBSITE_TYPE_LABELS = {
  unspecified: 'غير محدد بعد / قيد التأكيد',
  ecommerce: 'متجر إلكتروني',
  corporate: 'موقع تعريفي لشركة',
  landing: 'صفحة هبوط تسويقية',
  booking: 'موقع حجز ومواعيد',
  custom: 'برمجة خاصة / منصة مخصصة'
};

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function generateInitialSeed() {
  const now = Date.now();
  const hour = 3600 * 1000;
  const day = 24 * hour;

  // 3 due followups in the past / today
  const dueYesterday = new Date(now - 18 * hour).toISOString();
  const dueThisMorning = new Date(now - 4 * hour).toISOString();
  const dueJustNow = new Date(now - 1 * hour).toISOString();

  // Future followups
  const future2Days = new Date(now + 2 * day).toISOString();
  const future3Days = new Date(now + 3 * day).toISOString();
  const future4Days = new Date(now + 4 * day).toISOString();

  const leads = [
    {
      id: "lead_1",
      name: "أحمد محمود الشرقاوي",
      phone: "201012345678",
      email: "ahmed.sharkawy@gmail.com",
      business_name: "براند أزياء كاجوال (Sharkawy Wear)",
      website_type: "ecommerce",
      stage: "new",
      priority: "high",
      campaign_name: "حملة متاجر إلكترونية - ميتا",
      ad_source: "meta_form",
      budget: 15000,
      deal_value: 18000,
      deposit_paid: 0,
      requirements: ["domain_hosting", "payment_gateway", "meta_pixel", "shipping_integration"],
      notes: "يرغب في متجر متكامل مربوط ببوابة دفع فيزا وماستركارد وفودافون كاش وشركة شحن بوسطة",
      next_followup_at: dueThisMorning,
      last_contacted_at: new Date(now - 3 * hour).toISOString(),
      lost_reason: "",
      created_at: new Date(now - 12 * hour).toISOString(),
      updated_at: new Date(now - 3 * hour).toISOString()
    },
    {
      id: "lead_2",
      name: "سارة عبد الرحمن",
      phone: "201198765432",
      email: "sara.beauty@outlook.com",
      business_name: "مركز سارة كوزمتكس وسبا",
      website_type: "landing",
      stage: "new",
      priority: "medium",
      campaign_name: "حملة صفحات هبوط سريعة - ميتا",
      ad_source: "instagram_dm",
      budget: 6000,
      deal_value: 7000,
      deposit_paid: 0,
      requirements: ["domain_hosting", "contact_form", "meta_pixel"],
      notes: "صفحة هبوط لعروض نهاية العام مع نموذج حجز وربط واتساب وبيكسل إنستغرام",
      next_followup_at: dueYesterday,
      last_contacted_at: new Date(now - 16 * hour).toISOString(),
      lost_reason: "",
      created_at: new Date(now - 20 * hour).toISOString(),
      updated_at: new Date(now - 16 * hour).toISOString()
    },
    {
      id: "lead_3",
      name: "المهندس شريف فاروق",
      phone: "201234567890",
      email: "sherif@farouk-consulting.com",
      business_name: "فاروق للاستشارات الهندسية والمقاولات",
      website_type: "corporate",
      stage: "contacted",
      priority: "medium",
      campaign_name: "حملة الشركات والمؤسسات - ميتا",
      ad_source: "meta_form",
      budget: 12000,
      deal_value: 15000,
      deposit_paid: 0,
      requirements: ["domain_hosting", "multilingual", "portfolio_gallery", "corporate_email"],
      notes: "موقع تعريفي ثنائي اللغة (عربي وإنجليزي) مع معرض سابقة أعمال وإيميلات رسمية",
      next_followup_at: dueJustNow,
      last_contacted_at: new Date(now - 5 * hour).toISOString(),
      lost_reason: "",
      created_at: new Date(now - 28 * hour).toISOString(),
      updated_at: new Date(now - 5 * hour).toISOString()
    },
    {
      id: "lead_4",
      name: "الدكتور كريم الحسيني",
      phone: "201099887766",
      email: "dr.karim@dentalcare-eg.com",
      business_name: "عيادات النخبة لطب وتجميل الأسنان",
      website_type: "booking",
      stage: "discovery",
      priority: "high",
      campaign_name: "حملة العيادات والحجوزات - ميتا",
      ad_source: "whatsapp_ad",
      budget: 10000,
      deal_value: 12000,
      deposit_paid: 0,
      requirements: ["domain_hosting", "booking_system", "whatsapp_chat", "google_reviews"],
      notes: "نظام حجز مواعيد للأطباء وربط فروع الشيخ زايد والتجمع الخامس وتأكيد الحجز عبر واتساب",
      next_followup_at: future2Days,
      last_contacted_at: new Date(now - 8 * hour).toISOString(),
      lost_reason: "",
      created_at: new Date(now - 48 * hour).toISOString(),
      updated_at: new Date(now - 8 * hour).toISOString()
    },
    {
      id: "lead_5",
      name: "طارق زياد",
      phone: "201501234987",
      email: "tarek@oudroyale.com",
      business_name: "رويال للعود والعطور الشرقية",
      website_type: "ecommerce",
      stage: "proposal",
      priority: "high",
      campaign_name: "حملة متاجر إلكترونية - ميتا",
      ad_source: "meta_form",
      budget: 18000,
      deal_value: 20000,
      deposit_paid: 0,
      requirements: ["domain_hosting", "payment_gateway", "shipping_integration", "inventory_sync", "meta_pixel"],
      notes: "تم تجهيز وإرسال العرض الفني والمالي مع خطة التسليم خلال 14 يوم عمل",
      next_followup_at: future3Days,
      last_contacted_at: new Date(now - 6 * hour).toISOString(),
      lost_reason: "",
      created_at: new Date(now - 72 * hour).toISOString(),
      updated_at: new Date(now - 6 * hour).toISOString()
    },
    {
      id: "lead_6",
      name: "عمر خالد الدسوقي",
      phone: "201122334455",
      email: "omar@edunext-eg.org",
      business_name: "منصة إديونكست للتدريب والأكورسات",
      website_type: "custom",
      stage: "negotiation",
      priority: "high",
      campaign_name: "حملة الحلول البرمجية والمواقع الخاصة",
      ad_source: "whatsapp_ad",
      budget: 15000,
      deal_value: 13000,
      deposit_paid: 0,
      requirements: ["domain_hosting", "custom_backend", "payment_gateway", "video_protection", "certificates"],
      notes: "مفاوضات بخصوص خطة الدفع على دفعتين وتضمين حماية الفيديوهات وإصدار الشهادات التلقائية",
      next_followup_at: future4Days,
      last_contacted_at: new Date(now - 2 * hour).toISOString(),
      lost_reason: "",
      created_at: new Date(now - 96 * hour).toISOString(),
      updated_at: new Date(now - 2 * hour).toISOString()
    },
    {
      id: "lead_7",
      name: "مصطفى إبراهيم الغامدي",
      phone: "201087654321",
      email: "mostafa@alghamdihome.com",
      business_name: "مفروشات وأثاث الغامدي هوم",
      website_type: "ecommerce",
      stage: "won",
      priority: "high",
      campaign_name: "حملة متاجر إلكترونية - ميتا",
      ad_source: "meta_form",
      budget: 20000,
      deal_value: 22000,
      deposit_paid: 11000,
      requirements: ["domain_hosting", "payment_gateway", "shipping_integration", "erp_integration", "meta_pixel"],
      notes: "تم التعاقد ودفع عربون 50% (11,000 ج.م). العمل جاري على تصميم الواجهات الأولية",
      next_followup_at: null,
      last_contacted_at: new Date(now - 10 * hour).toISOString(),
      lost_reason: "",
      created_at: new Date(now - 120 * hour).toISOString(),
      updated_at: new Date(now - 10 * hour).toISOString()
    },
    {
      id: "lead_8",
      name: "حسام الدين سمير",
      phone: "201200112233",
      email: "hossam@alrawad-logistics.com",
      business_name: "الرواد لخدمات الشحن الدولي والتخليص",
      website_type: "corporate",
      stage: "lost",
      priority: "low",
      campaign_name: "حملة الشركات والمؤسسات - ميتا",
      ad_source: "meta_form",
      budget: 8000,
      deal_value: 14000,
      deposit_paid: 0,
      requirements: ["domain_hosting", "corporate_email", "tracking_system"],
      notes: "طلب نظام تتبع شحنات متكامل مع موقع تعريفي بميزانية منخفضة جداً",
      next_followup_at: null,
      last_contacted_at: new Date(now - 24 * hour).toISOString(),
      lost_reason: "الميزانية غير كافية وقرر تأجيل المشروع للربع القادم",
      created_at: new Date(now - 144 * hour).toISOString(),
      updated_at: new Date(now - 24 * hour).toISOString()
    }
  ];

  const activities = [
    // Lead 1
    {
      id: "act_1_1",
      lead_id: "lead_1",
      type: "system",
      summary: "وصل العميل تلقائياً من إعلان ميتا (Meta Lead Ads Webhook)",
      created_at: new Date(now - 12 * hour).toISOString()
    },
    {
      id: "act_1_2",
      lead_id: "lead_1",
      type: "whatsapp",
      summary: "تم إرسال رسالة ترحيبية عبر واتساب تتضمن نماذج متاجر ملابس سابقة ومميزات الربط مع شركات الشحن",
      created_at: new Date(now - 3 * hour).toISOString()
    },

    // Lead 2
    {
      id: "act_2_1",
      lead_id: "lead_2",
      type: "system",
      summary: "تم استلام الطلب عبر رسائل إنستغرام الخاصة بالإعلان",
      created_at: new Date(now - 20 * hour).toISOString()
    },
    {
      id: "act_2_2",
      lead_id: "lead_2",
      type: "note",
      summary: "العميلة ترغب بإطلاق صفحة الهبوط قبل نهاية الشهر وتطلب التركيز على سرعة التحميل وتكامل الموبايل",
      created_at: new Date(now - 16 * hour).toISOString()
    },

    // Lead 3
    {
      id: "act_3_1",
      lead_id: "lead_3",
      type: "system",
      summary: "تم إضافة العميل من نموذج إعلانات ميتا",
      created_at: new Date(now - 28 * hour).toISOString()
    },
    {
      id: "act_3_2",
      lead_id: "lead_3",
      type: "call",
      summary: "مكالمة هاتفية أولى لمناقشة هوية الشركة والمشاريع المعمارية السابقة المطلوب عرضها",
      created_at: new Date(now - 5 * hour).toISOString()
    },
    {
      id: "act_3_3",
      lead_id: "lead_3",
      type: "stage_change",
      summary: "تم تغيير مرحلة العميل إلى: تم التواصل الأول",
      created_at: new Date(now - 5 * hour).toISOString()
    },

    // Lead 4
    {
      id: "act_4_1",
      lead_id: "lead_4",
      type: "system",
      summary: "بدء المحادثة عبر إعلان واتساب لحملة العيادات",
      created_at: new Date(now - 48 * hour).toISOString()
    },
    {
      id: "act_4_2",
      lead_id: "lead_4",
      type: "meeting",
      summary: "اجتماع زووم لاستعراض آلية حجز المواعيد وإرسال إشعارات التذكير التلقائية للمرضى",
      created_at: new Date(now - 8 * hour).toISOString()
    },
    {
      id: "act_4_3",
      lead_id: "lead_4",
      type: "stage_change",
      summary: "تم تغيير مرحلة العميل إلى: استكشاف المتطلبات",
      created_at: new Date(now - 8 * hour).toISOString()
    },

    // Lead 5
    {
      id: "act_5_1",
      lead_id: "lead_5",
      type: "system",
      summary: "تسجيل العميل عبر إعلان ميتا لحملة المتاجر",
      created_at: new Date(now - 72 * hour).toISOString()
    },
    {
      id: "act_5_2",
      lead_id: "lead_5",
      type: "call",
      summary: "مكالمة تفصيلية لحصر عدد المنتجات وخيارات الشحن والتغليف المخصصة للعطور",
      created_at: new Date(now - 24 * hour).toISOString()
    },
    {
      id: "act_5_3",
      lead_id: "lead_5",
      type: "proposal",
      summary: "إرسال ملف عرض السعر الفني والمالي (PDF) بقيمة 20,000 ج.م يشمل بوابات الدفع وسياسة الشحن",
      created_at: new Date(now - 6 * hour).toISOString()
    },
    {
      id: "act_5_4",
      lead_id: "lead_5",
      type: "stage_change",
      summary: "تم تغيير مرحلة العميل إلى: إرسال العرض المالي والفني",
      created_at: new Date(now - 6 * hour).toISOString()
    },

    // Lead 6
    {
      id: "act_6_1",
      lead_id: "lead_6",
      type: "system",
      summary: "طلب وارد من حملة المنصات المتخصصة عبر واتساب",
      created_at: new Date(now - 96 * hour).toISOString()
    },
    {
      id: "act_6_2",
      lead_id: "lead_6",
      type: "proposal",
      summary: "تقديم عرض السعر المبدئي بقيمة 15,000 ج.م مع خطة التسليم",
      created_at: new Date(now - 30 * hour).toISOString()
    },
    {
      id: "act_6_3",
      lead_id: "lead_6",
      type: "call",
      summary: "تفاوض على الخصم وتقديم عرض خاص معتمد بقيمة 13,000 ج.م مقابل التعاقد هذا الأسبوع",
      created_at: new Date(now - 2 * hour).toISOString()
    },
    {
      id: "act_6_4",
      lead_id: "lead_6",
      type: "stage_change",
      summary: "تم تغيير مرحلة العميل إلى: مفاوضات وتعديل العرض",
      created_at: new Date(now - 2 * hour).toISOString()
    },

    // Lead 7
    {
      id: "act_7_1",
      lead_id: "lead_7",
      type: "system",
      summary: "تسجيل العميل عبر نموذج إعلان ميتا",
      created_at: new Date(now - 120 * hour).toISOString()
    },
    {
      id: "act_7_2",
      lead_id: "lead_7",
      type: "proposal",
      summary: "إرسال العقد وعرض السعر المعتمد بقيمة 22,000 ج.م",
      created_at: new Date(now - 48 * hour).toISOString()
    },
    {
      id: "act_7_3",
      lead_id: "lead_7",
      type: "whatsapp",
      summary: "تأكيد استلام تحويل العربون البنكي (11,000 ج.م) والبدء في التصاميم الأولية",
      created_at: new Date(now - 10 * hour).toISOString()
    },
    {
      id: "act_7_4",
      lead_id: "lead_7",
      type: "stage_change",
      summary: "تم إغلاق الصفقة بنجاح وتم تحصيل عربون بقيمة 11,000 ج.م",
      created_at: new Date(now - 10 * hour).toISOString()
    },

    // Lead 8
    {
      id: "act_8_1",
      lead_id: "lead_8",
      type: "system",
      summary: "تسجيل العميل عبر إعلان ميتا",
      created_at: new Date(now - 144 * hour).toISOString()
    },
    {
      id: "act_8_2",
      lead_id: "lead_8",
      type: "call",
      summary: "مكالمة هاتفية لمناقشة المتطلبات والميزانية المتاحة للمشروع",
      created_at: new Date(now - 40 * hour).toISOString()
    },
    {
      id: "act_8_3",
      lead_id: "lead_8",
      type: "stage_change",
      summary: "تم نقل العميل إلى مرحلة خاسرة/مؤجلة. السبب: الميزانية غير كافية وقرر تأجيل المشروع للربع القادم",
      created_at: new Date(now - 24 * hour).toISOString()
    }
  ];

  return { leads, activities };
}

function getDb() {
  ensureDir();
  if (!fs.existsSync(DB_PATH)) {
    const seed = generateInitialSeed();
    saveDb(seed);
    return seed;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const data = JSON.parse(raw);
    if (!data.leads || !Array.isArray(data.leads)) {
      const seed = generateInitialSeed();
      saveDb(seed);
      return seed;
    }
    return data;
  } catch (err) {
    console.error('Error reading DB, re-seeding:', err.message);
    const seed = generateInitialSeed();
    saveDb(seed);
    return seed;
  }
}

function saveDb(data) {
  ensureDir();
  const tmpPath = `${DB_PATH}.tmp.${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpPath, DB_PATH);
}

function getLeads(filters = {}) {
  const db = getDb();
  let list = [...(db.leads || [])];

  if (filters.stage) {
    list = list.filter(l => l.stage === filters.stage);
  }
  if (filters.campaign) {
    list = list.filter(l => l.campaign_name === filters.campaign);
  }
  if (filters.website_type) {
    list = list.filter(l => l.website_type === filters.website_type);
  }
  if (filters.priority) {
    list = list.filter(l => l.priority === filters.priority);
  }
  if (filters.ad_source) {
    list = list.filter(l => l.ad_source === filters.ad_source);
  }
  if (filters.search) {
    const term = String(filters.search).trim().toLowerCase();
    list = list.filter(l => {
      const name = (l.name || '').toLowerCase();
      const phone = (l.phone || '').toLowerCase();
      const social = (l.social_handle || '').toLowerCase();
      const bname = (l.business_name || '').toLowerCase();
      const cname = (l.campaign_name || '').toLowerCase();
      const notes = (l.notes || '').toLowerCase();
      return name.includes(term) || phone.includes(term) || social.includes(term) || bname.includes(term) || cname.includes(term) || notes.includes(term);
    });
  }
  if (filters.followup) {
    const now = new Date();
    list = list.filter(l => {
      if (l.stage === 'won' || l.stage === 'lost') return false;
      if (!l.next_followup_at) return false;
      const target = new Date(l.next_followup_at);
      if (isNaN(target.getTime())) return false;

      if (filters.followup === 'overdue') {
        return target < now;
      }
      if (filters.followup === 'today') {
        const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
        const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return targetDay.getTime() === nowDay.getTime();
      }
      if (filters.followup === 'due') {
        return target <= now || target.toDateString() === now.toDateString();
      }
      return true;
    });
  }

  // Sort by updated_at descending
  list.sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));
  return list;
}

function getLeadById(id) {
  const db = getDb();
  return db.leads.find(l => l.id === id) || null;
}

function getActivitiesForLead(leadId) {
  const db = getDb();
  const list = (db.activities || []).filter(a => a.lead_id === leadId);
  list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  return list;
}

function createLead(leadData) {
  const db = getDb();
  const now = new Date().toISOString();
  const id = leadData.id || `lead_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  const newLead = {
    id,
    name: leadData.name ? String(leadData.name).trim() : 'عميل جديد',
    phone: leadData.phone ? String(leadData.phone).trim() : '',
    social_handle: leadData.social_handle ? String(leadData.social_handle).trim() : '',
    email: leadData.email ? String(leadData.email).trim() : '',
    business_name: leadData.business_name ? String(leadData.business_name).trim() : '',
    website_type: leadData.website_type || 'unspecified',
    stage: leadData.stage || 'new',
    priority: leadData.priority || 'medium',
    campaign_name: leadData.campaign_name ? String(leadData.campaign_name).trim() : 'حملة إعلانات ميتا - طلب موقع',
    ad_source: leadData.ad_source || 'meta_form',
    budget: Number(leadData.budget) || 0,
    deal_value: Number(leadData.deal_value) || 0,
    deposit_paid: Number(leadData.deposit_paid) || 0,
    requirements: Array.isArray(leadData.requirements) ? leadData.requirements : [],
    notes: leadData.notes ? String(leadData.notes).trim() : '',
    next_followup_at: leadData.next_followup_at || null,
    last_contacted_at: leadData.last_contacted_at || null,
    lost_reason: leadData.lost_reason || '',
    created_at: leadData.created_at || now,
    updated_at: leadData.updated_at || now
  };

  db.leads.unshift(newLead);

  // Auto-log creation activity
  const systemActivity = {
    id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    lead_id: id,
    type: 'system',
    summary: leadData._activitySummary || 'تم إضافة العميل إلى النظام',
    created_at: now
  };
  db.activities = db.activities || [];
  db.activities.unshift(systemActivity);

  saveDb(db);
  return newLead;
}

function updateLead(id, updates) {
  const db = getDb();
  const index = db.leads.findIndex(l => l.id === id);
  if (index === -1) return null;

  const current = db.leads[index];
  const now = new Date().toISOString();
  const stageChanged = updates.stage && updates.stage !== current.stage;
  const oldStage = current.stage;

  // Apply updates
  const updatedLead = {
    ...current,
    ...updates,
    id: current.id, // prevent id overwrite
    created_at: current.created_at,
    updated_at: now
  };

  if (updates.budget !== undefined) updatedLead.budget = Number(updates.budget) || 0;
  if (updates.deal_value !== undefined) updatedLead.deal_value = Number(updates.deal_value) || 0;
  if (updates.deposit_paid !== undefined) updatedLead.deposit_paid = Number(updates.deposit_paid) || 0;
  if (updates.requirements !== undefined) {
    updatedLead.requirements = Array.isArray(updates.requirements) ? updates.requirements : [];
  }

  db.leads[index] = updatedLead;

  // Auto-log stage change if stage changed
  if (stageChanged) {
    const oldLabel = STAGE_LABELS[oldStage] || oldStage;
    const newLabel = STAGE_LABELS[updatedLead.stage] || updatedLead.stage;
    let summary = `تم تغيير المرحلة من "${oldLabel}" إلى "${newLabel}"`;

    if (updatedLead.stage === 'won' && updatedLead.deposit_paid > 0) {
      summary = `تم إغلاق الصفقة بنجاح وتم استلام عربون بقيمة ${updatedLead.deposit_paid.toLocaleString('ar-EG')} ج.م`;
    } else if (updatedLead.stage === 'lost' && updatedLead.lost_reason) {
      summary = `تم نقل العميل إلى مرحلة خاسرة/مؤجلة. السبب: ${updatedLead.lost_reason}`;
    }

    const stageActivity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      lead_id: id,
      type: 'stage_change',
      summary,
      created_at: now
    };
    db.activities = db.activities || [];
    db.activities.unshift(stageActivity);
  }

  saveDb(db);
  return updatedLead;
}

function updateLeadStage(id, { stage, lost_reason, deposit_paid }) {
  const db = getDb();
  const index = db.leads.findIndex(l => l.id === id);
  if (index === -1) return null;

  const current = db.leads[index];
  const now = new Date().toISOString();
  const oldStage = current.stage;

  const updates = {
    stage: stage || current.stage,
    updated_at: now
  };

  if (lost_reason !== undefined) {
    updates.lost_reason = lost_reason ? String(lost_reason).trim() : '';
  }
  if (deposit_paid !== undefined) {
    updates.deposit_paid = Number(deposit_paid) || 0;
  }

  const updatedLead = {
    ...current,
    ...updates
  };

  db.leads[index] = updatedLead;

  // Log stage_change activity in Arabic
  const oldLabel = STAGE_LABELS[oldStage] || oldStage;
  const newLabel = STAGE_LABELS[updatedLead.stage] || updatedLead.stage;
  let summary = `تم تحديث مرحلة العميل إلى "${newLabel}"`;

  if (updatedLead.stage === 'won') {
    if (updatedLead.deposit_paid > 0) {
      summary = `تم إغلاق الصفقة بنجاح وتم استلام عربون بقيمة ${updatedLead.deposit_paid.toLocaleString('ar-EG')} ج.م`;
    } else {
      summary = `تم إغلاق الصفقة بنجاح وتحويل العميل لمرحلة الفوز`;
    }
  } else if (updatedLead.stage === 'lost') {
    const reasonText = updatedLead.lost_reason ? ` (السبب: ${updatedLead.lost_reason})` : '';
    summary = `تم نقل العميل إلى مرحلة خاسرة/مؤجلة${reasonText}`;
  } else {
    summary = `تم تغيير مرحلة العميل من "${oldLabel}" إلى "${newLabel}"`;
  }

  const activity = {
    id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    lead_id: id,
    type: 'stage_change',
    summary,
    created_at: now
  };

  db.activities = db.activities || [];
  db.activities.unshift(activity);

  saveDb(db);
  return updatedLead;
}

function deleteLead(id) {
  const db = getDb();
  const beforeCount = db.leads.length;
  db.leads = db.leads.filter(l => l.id !== id);
  if (db.leads.length === beforeCount) return false;

  db.activities = (db.activities || []).filter(a => a.lead_id !== id);
  saveDb(db);
  return true;
}

function createActivity(leadId, activityData) {
  const db = getDb();
  const leadIndex = db.leads.findIndex(l => l.id === leadId);
  if (leadIndex === -1) return null;

  const now = new Date().toISOString();
  const lead = db.leads[leadIndex];

  const activity = {
    id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    lead_id: leadId,
    type: activityData.type || 'note',
    summary: activityData.summary ? String(activityData.summary).trim() : 'متابعة جديدة',
    created_at: now
  };

  db.activities = db.activities || [];
  db.activities.unshift(activity);

  // Update lead last_contacted_at & updated_at
  lead.last_contacted_at = now;
  lead.updated_at = now;

  if (activityData.next_followup_at !== undefined) {
    lead.next_followup_at = activityData.next_followup_at || null;
  }
  if (activityData.deal_value !== undefined && activityData.deal_value !== null && activityData.deal_value !== '') {
    lead.deal_value = Number(activityData.deal_value) || 0;
  }

  db.leads[leadIndex] = lead;
  saveDb(db);

  return { activity, lead };
}

function importLeads(leadsArray) {
  if (!Array.isArray(leadsArray)) return { imported: 0, leads: [] };

  const created = [];
  for (const item of leadsArray) {
    const lead = createLead({
      ...item,
      _activitySummary: 'تم استيراد العميل عبر ملف بيانات خارجي'
    });
    created.push(lead);
  }
  return { imported: created.length, leads: created };
}

function getAnalytics() {
  const db = getDb();
  const leads = db.leads || [];

  const total_leads = leads.length;
  let new_leads = 0;
  let active_pipeline_count = 0;
  let won_count = 0;
  let lost_count = 0;
  let expected_pipeline_value = 0;
  let won_revenue = 0;
  let deposits_collected = 0;
  let due_followups_count = 0;
  let overdue_followups_count = 0;
  let today_followups_count = 0;

  const by_stage = {
    new: 0,
    contacted: 0,
    discovery: 0,
    proposal: 0,
    negotiation: 0,
    won: 0,
    lost: 0
  };

  const by_website_type = {
    unspecified: 0,
    ecommerce: 0,
    corporate: 0,
    landing: 0,
    booking: 0,
    custom: 0
  };

  const campaignsMap = {};
  const now = new Date();

  for (const lead of leads) {
    // Stage counts
    if (by_stage[lead.stage] !== undefined) {
      by_stage[lead.stage]++;
    } else {
      by_stage[lead.stage] = (by_stage[lead.stage] || 0) + 1;
    }

    // Type counts
    if (by_website_type[lead.website_type] !== undefined) {
      by_website_type[lead.website_type]++;
    } else {
      by_website_type[lead.website_type] = (by_website_type[lead.website_type] || 0) + 1;
    }

    if (lead.stage === 'new') new_leads++;
    if (lead.stage === 'won') {
      won_count++;
      won_revenue += Number(lead.deal_value) || 0;
    } else if (lead.stage === 'lost') {
      lost_count++;
    } else {
      active_pipeline_count++;
      expected_pipeline_value += Number(lead.deal_value) || Number(lead.budget) || 0;
    }

    deposits_collected += Number(lead.deposit_paid) || 0;

    // Due followups check
    if (lead.stage !== 'won' && lead.stage !== 'lost' && lead.next_followup_at) {
      const fDate = new Date(lead.next_followup_at);
      if (!isNaN(fDate.getTime())) {
        if (fDate <= now) {
          due_followups_count++;
        }
        if (fDate < now) {
          overdue_followups_count++;
        }
        const targetDay = new Date(fDate.getFullYear(), fDate.getMonth(), fDate.getDate());
        const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (targetDay.getTime() === nowDay.getTime()) {
          today_followups_count++;
        }
      }
    }

    // Campaign aggregation
    const cName = lead.campaign_name || 'حملة غير محددة';
    if (!campaignsMap[cName]) {
      campaignsMap[cName] = {
        campaign_name: cName,
        leads_count: 0,
        won_count: 0,
        revenue: 0,
        pipeline_value: 0
      };
    }
    campaignsMap[cName].leads_count++;
    if (lead.stage === 'won') {
      campaignsMap[cName].won_count++;
      campaignsMap[cName].revenue += Number(lead.deal_value) || 0;
    } else if (lead.stage !== 'lost') {
      campaignsMap[cName].pipeline_value += Number(lead.deal_value) || Number(lead.budget) || 0;
    }
  }

  const conversion_rate = total_leads > 0
    ? Number(((won_count / total_leads) * 100).toFixed(1))
    : 0;

  const by_campaign = Object.values(campaignsMap).sort((a, b) => b.leads_count - a.leads_count);

  return {
    total_leads,
    new_leads,
    active_pipeline_count,
    won_count,
    lost_count,
    conversion_rate,
    expected_pipeline_value,
    won_revenue,
    deposits_collected,
    due_followups_count,
    overdue_followups_count,
    today_followups_count,
    by_stage,
    by_website_type,
    by_campaign
  };
}

function resetDb() {
  const seed = generateInitialSeed();
  saveDb(seed);
  return seed;
}

module.exports = {
  getDb,
  saveDb,
  getLeads,
  getLeadById,
  getActivitiesForLead,
  createLead,
  updateLead,
  updateLeadStage,
  deleteLead,
  createActivity,
  importLeads,
  getAnalytics,
  resetDb,
  STAGE_LABELS,
  WEBSITE_TYPE_LABELS
};
