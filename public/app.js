/**
 * AmirCRM - Web Development Lead Desk & Deal Closer
 * Arabic RTL Client Application
 */

// ============================================================================
// State Management
// ============================================================================
const state = {
  leads: [],
  analytics: null,
  currentView: 'kanban', // 'kanban' | 'table' | 'analytics'
  filters: {
    search: '',
    stage: '',
    campaign: '',
    website_type: '',
    priority: '',
    ad_source: '',
    followup: '' // 'overdue' | 'today' | 'due' | ''
  },
  selectedLead: null,
  selectedLeadActivities: [],
  activeDrawerTab: 'specs',
  activeScriptId: 'welcome',
  draggedLeadId: null,
  pendingStageChange: null, // { leadId, stage }
  parsedCsvLeads: []
};

// ============================================================================
// Constants & Dictionary Maps
// ============================================================================
const STAGES = {
  new: { label: 'عميل جديد (ميتا)', color: '#1877f2', dot: 'dot-new', step: 1 },
  contacted: { label: 'تواصل مبدئي', color: '#0284c7', dot: 'dot-contacted', step: 2 },
  discovery: { label: 'تحديد المتطلبات', color: '#6366f1', dot: 'dot-discovery', step: 3 },
  proposal: { label: 'إرسال عرض السعر', color: '#d97706', dot: 'dot-proposal', step: 4 },
  negotiation: { label: 'تفاوض ومراجعة', color: '#ea580c', dot: 'dot-negotiation', step: 5 },
  won: { label: 'تم الإغلاق بنجاح 🎉', color: '#059669', dot: 'dot-won', step: 6 },
  lost: { label: 'مؤجل / غير مهتم', color: '#e11d48', dot: 'dot-lost', step: 7 }
};

const WEBSITE_TYPES = {
  unspecified: 'غير محدد بعد / قيد التأكيد',
  ecommerce: 'متجر إلكتروني',
  corporate: 'موقع تعريفي لشركة',
  landing: 'صفحة هبوط (Landing Page)',
  booking: 'منصة حجز / تعليمية',
  custom: 'برمجة خاصة / ويب أب'
};

const AD_SOURCES = {
  meta_form: 'نموذج ميتا الفوري',
  whatsapp_ad: 'إعلان واتساب',
  instagram_dm: 'رسائل إنستجرام',
  messenger: 'رسائل ماسنجر',
  manual: 'إدخال يدوي / توصية'
};

const PRIORITIES = {
  high: { label: 'عالية 🔥', class: 'priority-high' },
  medium: { label: 'متوسطة', class: 'priority-medium' },
  low: { label: 'منخفضة', class: 'priority-low' }
};

const REQUIREMENTS_MAP = {
  domain_hosting: 'دومين واستضافة سحابية',
  payment_gateway: 'ربط بوابة دفع إلكتروني',
  shipping_integration: 'ربط شركات الشحن',
  meta_pixel: 'ربط Meta Pixel & CAPI',
  arabic_english: 'ثنائي اللغة (عربي / إنجليزي)',
  seo_setup: 'تهيئة محركات البحث SEO',
  admin_dashboard: 'لوحة تحكم سهلة بالعربية'
};

const SCRIPT_TEMPLATES = {
  welcome: {
    title: 'ترحيب فوري بعميل الإعلان',
    template: (lead) => `أهلاً بحضرتك أستاذ {name}! معك أمير من وكالة تصميم وتطوير المواقع. شرفتنا بطلبك بخصوص تصميم {website_type} لـ ({business_name}) عبر إعلاننا على فيسبوك/إنستجرام. حابب أعرف تفاصيل أكثر عن رؤيتك للمشروع عشان نقدملك أفضل خطة عمل وعرض سعر مناسب...`
  },
  portfolio: {
    title: 'سابقة الأعمال وموعد مكالمة',
    template: (lead) => `مرحباً أستاذ {name}، يسعدني أشارك مع حضرتك نماذج من سابقة أعمالنا في تطوير {website_type} لمشاريع مشابهة لـ ({business_name}): https://portfolio.amircrm.com. إيه رأي حضرتك نحدد مكالمة سريعة لمدة 10 دقائق غداً لمناقشة التفاصيل والبدء فوراً؟`
  },
  quote: {
    title: 'عرض السعر الفني والمالي',
    template: (lead) => `أهلاً أستاذ {name}، بناءً على متطلبات ({business_name})، جهزنا لحضرتك عرض العمل المتكامل لتطوير {website_type} بقيمة {deal_value} شاملاً كافة الميزات المطلوبة والدعم الفني وربط البوابات. يسعدني مراجعة بنود العرض مع حضرتك لتأكيد موعد الانطلاق.`
  },
  followup: {
    title: 'متابعة ذكية لتحريك العميل',
    template: (lead) => `مساء الخير أستاذ {name}، حبيت أطمئن على حضرتك وأعرف هل راجعت عرض السعر المقترح لـ ({business_name})؟ إحنا متاحين لأي استفسار أو تعديل في خطة العمل عشان ننطلق في التنفيذ هذا الأسبوع ونحجز موعد إطلاق موقعكم.`
  },
  closing: {
    title: 'تأكيد الاتفاق وطلب العربون',
    template: (lead) => `ألف مبروك أستاذ {name} على الاتفاق والبدء في مشروع {website_type} لـ ({business_name})! قيمة المشروع المتفق عليها {deal_value}، وقيمة العربون لبدء حجز فريق العمل والتنفيذ الفوري هي {deposit_suggested}. يمكنك التحويل عبر فودافون كاش / إنستاباي / الحساب البنكي. في انتظار إيصال التحويل لنبدأ فوراً!`
  }
};

// ============================================================================
// Helpers
// ============================================================================
function formatCurrency(val) {
  const num = Number(val) || 0;
  return num.toLocaleString('en-US') + ' ج.م';
}

function cleanPhoneNumber(phone) {
  if (!phone) return '';
  return phone.toString().replace(/[^0-9]/g, '');
}

function parseFollowupDate(dateStr) {
  if (!dateStr) return null;
  const str = String(dateStr).trim();
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:Z|\+02:00)?$/);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] || 0));
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(dateStr) {
  if (!dateStr) return 'غير محدد';
  try {
    const d = parseFollowupDate(dateStr) || new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);
    if (diffSec < 60) return 'الآن';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'أمس';
    if (diffDays < 30) return `منذ ${diffDays} يوم`;
    return d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

function toDateTimeLocalValue(dateInput) {
  if (!dateInput) return '';
  const str = String(dateInput).trim();
  if (!str) return '';

  // If already in wall-clock YYYY-MM-DDTHH:mm format (or with optional :ss / +02:00 / legacy 17-char Z),
  // return the wall-clock YYYY-MM-DDTHH:mm directly without any UTC conversion.
  const wallClockMatch = str.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?::\d{2})?(?:Z|\+02:00)?$/);
  if (wallClockMatch) {
    return wallClockMatch[1];
  }

  const d = new Date(str);
  if (isNaN(d.getTime())) {
    return str.length >= 16 ? str.slice(0, 16) : '';
  }
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getFollowupStatus(dateStr, stage) {
  if (!dateStr || stage === 'won' || stage === 'lost') {
    return null;
  }
  const target = parseFollowupDate(dateStr);
  const now = new Date();
  if (!target) return null;

  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const timeStr = target.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (target < now) {
    const isToday = targetDay.getTime() === nowDay.getTime();
    return {
      type: 'overdue',
      label: `متأخرة ⚠️ (${isToday ? timeStr : target.toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric' })})`,
      class: 'followup-overdue'
    };
  } else if (targetDay.getTime() === nowDay.getTime()) {
    return {
      type: 'today',
      label: `مستحقة اليوم (${timeStr})`,
      class: 'followup-today'
    };
  } else {
    return {
      type: 'future',
      label: `${target.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })} (${timeStr})`,
      class: 'followup-future'
    };
  }
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
    <span class="toast-text">${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ============================================================================
// API Client
// ============================================================================
const CRM_HEADERS = {
  'Content-Type': 'application/json',
  'X-CRM-Version': '2'
};

async function apiGetLeads() {
  const params = new URLSearchParams();
  if (state.filters.search) params.set('search', state.filters.search);
  if (state.filters.stage) params.set('stage', state.filters.stage);
  if (state.filters.campaign) params.set('campaign', state.filters.campaign);
  if (state.filters.website_type) params.set('website_type', state.filters.website_type);
  if (state.filters.priority) params.set('priority', state.filters.priority);
  if (state.filters.ad_source) params.set('ad_source', state.filters.ad_source);
  if (state.filters.followup) params.set('followup', state.filters.followup);

  const res = await fetch(`/api/leads?${params.toString()}`, {
    headers: { 'X-CRM-Version': '2' }
  });
  if (!res.ok) throw new Error('فشل جلب قائمة العملاء');
  return await res.json();
}

async function apiGetLead(id) {
  const res = await fetch(`/api/leads/${id}`, {
    headers: { 'X-CRM-Version': '2' }
  });
  if (!res.ok) throw new Error('فشل جلب تفاصيل العميل');
  return await res.json();
}

async function apiCreateLead(leadData) {
  const res = await fetch('/api/leads', {
    method: 'POST',
    headers: CRM_HEADERS,
    body: JSON.stringify(leadData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'فشل إنشاء العميل');
  }
  return await res.json();
}

async function apiUpdateLead(id, data) {
  const res = await fetch(`/api/leads/${id}`, {
    method: 'PUT',
    headers: CRM_HEADERS,
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('فشل تحديث بيانات العميل');
  return await res.json();
}

async function apiUpdateStage(id, stage, lost_reason = '', deposit_paid = undefined) {
  const body = { stage, lost_reason };
  if (deposit_paid !== undefined) body.deposit_paid = Number(deposit_paid);

  const res = await fetch(`/api/leads/${id}/stage`, {
    method: 'PATCH',
    headers: CRM_HEADERS,
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('فشل تحديث مرحلة العميل');
  return await res.json();
}

async function apiDeleteLead(id) {
  const res = await fetch(`/api/leads/${id}`, {
    method: 'DELETE',
    headers: { 'X-CRM-Version': '2' }
  });
  if (!res.ok) throw new Error('فشل حذف العميل');
  return await res.json();
}

async function apiAddActivity(leadId, activityData) {
  const res = await fetch(`/api/leads/${leadId}/activities`, {
    method: 'POST',
    headers: CRM_HEADERS,
    body: JSON.stringify(activityData)
  });
  if (!res.ok) throw new Error('فشل توثيق النشاط');
  return await res.json();
}

async function apiImportLeads(leadsArray) {
  const res = await fetch('/api/leads/import', {
    method: 'POST',
    headers: CRM_HEADERS,
    body: JSON.stringify({ leads: leadsArray })
  });
  if (!res.ok) throw new Error('فشل استيراد العملاء');
  return await res.json();
}

async function apiSimulateMetaLead() {
  const res = await fetch('/api/webhook/meta', {
    method: 'POST',
    headers: CRM_HEADERS,
    body: JSON.stringify({})
  });
  if (!res.ok) throw new Error('فشل استقبال ليد محاكاة ميتا');
  return await res.json();
}

async function apiGetAnalytics() {
  const res = await fetch('/api/analytics', {
    headers: { 'X-CRM-Version': '2' }
  });
  if (!res.ok) throw new Error('فشل جلب الإحصائيات');
  return await res.json();
}

// ============================================================================
// Core Data Loading & UI Update
// ============================================================================
async function refreshData() {
  try {
    const [leadsData, analyticsData] = await Promise.all([
      apiGetLeads(),
      apiGetAnalytics()
    ]);

    state.leads = leadsData.leads || [];
    state.analytics = analyticsData || {};

    renderKPIs();
    renderSidebarStats();

    if (state.currentView === 'kanban') {
      renderKanban();
    } else if (state.currentView === 'table') {
      renderTable();
    } else if (state.currentView === 'analytics') {
      renderAnalyticsView();
    }

    // If drawer is open, refresh selected lead
    if (state.selectedLead) {
      const updated = state.leads.find((l) => l.id === state.selectedLead.id);
      if (updated) {
        state.selectedLead = updated;
        populateLeadSpecs(updated);
      }
    }
  } catch (err) {
    console.error('Error refreshing data:', err);
    showToast(err.message, 'error');
  }
}

// ============================================================================
// Duplicate Checking & Campaign Options
// ============================================================================
let pendingDuplicateSaveCallback = null;

function findDuplicateLead(phone, socialHandle, excludeId = null) {
  const cleanPhone = cleanPhoneNumber(phone);
  const normHandle = (socialHandle || '').trim().toLowerCase().replace(/^@/, '');

  if (!cleanPhone && !normHandle) return null;

  for (const lead of state.leads) {
    if (excludeId && lead.id === excludeId) continue;

    // Check phone duplicate (at least 7 digits to avoid matching short strings)
    if (cleanPhone && cleanPhone.length >= 7) {
      const existingClean = cleanPhoneNumber(lead.phone);
      if (existingClean && existingClean === cleanPhone) {
        return {
          lead,
          field: 'phone',
          matchVal: lead.phone,
          message: `رقم الهاتف (${lead.phone}) مسجل مسبقاً للعميل: ${lead.name}`
        };
      }
    }

    // Check social handle duplicate
    if (normHandle) {
      const existingHandle = (lead.social_handle || '').trim().toLowerCase().replace(/^@/, '');
      if (existingHandle && existingHandle === normHandle) {
        return {
          lead,
          field: 'social',
          matchVal: lead.social_handle,
          message: `اسم الحساب (${lead.social_handle}) مسجل مسبقاً للعميل: ${lead.name}`
        };
      }
    }
  }
  return null;
}

function showDuplicateModal(duplicateInfo, onConfirm) {
  const modal = document.getElementById('duplicateWarningModalOverlay');
  const detailsBox = document.getElementById('duplicateLeadDetailsBox');
  const modalText = document.getElementById('duplicateModalText');
  if (!modal) {
    if (confirm(`تنبيه: يوجد عميل مسجل مسبقاً بنفس البيانات (${duplicateInfo.lead.name}). هل ترغب في المتابعة؟`)) {
      onConfirm();
    }
    return;
  }

  const reasonLabel = duplicateInfo.field === 'phone' ? 'رقم الهاتف' : 'اسم الحساب / اليوزر';
  if (modalText) modalText.textContent = `تم العثور على عميل مسجل مسبقاً بنفس ${reasonLabel}:`;
  if (detailsBox) {
    detailsBox.innerHTML = `
      <div style="font-weight: 700; margin-bottom: 4px; color: var(--ink-900);">👤 ${escapeHtml(duplicateInfo.lead.name)}</div>
      <div style="color: var(--ink-600); font-size: 0.82rem; margin-bottom: 2px;">🏢 النشاط: ${escapeHtml(duplicateInfo.lead.business_name || 'غير محدد')}</div>
      <div style="color: var(--ink-600); font-size: 0.82rem; margin-bottom: 2px;">🏷️ المرحلة: ${escapeHtml(STAGES[duplicateInfo.lead.stage]?.label || duplicateInfo.lead.stage)}</div>
      ${duplicateInfo.lead.phone ? `<div style="color: var(--ink-600); font-size: 0.82rem;">📞 الهاتف: ${escapeHtml(duplicateInfo.lead.phone)}</div>` : ''}
      ${duplicateInfo.lead.social_handle ? `<div style="color: #1877F2; font-size: 0.82rem;">💬 الحساب: ${escapeHtml(duplicateInfo.lead.social_handle)}</div>` : ''}
    `;
  }

  pendingDuplicateSaveCallback = onConfirm;
  modal.classList.add('active');
}

function setupLiveDuplicateCheck(phoneInputId, socialInputId, phoneWarnId, socialWarnId, getExcludeIdFn) {
  const phoneEl = document.getElementById(phoneInputId);
  const socialEl = document.getElementById(socialInputId);
  const phoneWarn = document.getElementById(phoneWarnId);
  const socialWarn = document.getElementById(socialWarnId);

  const check = () => {
    const excludeId = getExcludeIdFn ? getExcludeIdFn() : null;
    const phoneVal = phoneEl ? phoneEl.value.trim() : '';
    const socialVal = socialEl ? socialEl.value.trim() : '';

    if (phoneWarn) {
      const clean = cleanPhoneNumber(phoneVal);
      if (clean && clean.length >= 7) {
        const dup = findDuplicateLead(phoneVal, '', excludeId);
        if (dup) {
          phoneWarn.innerHTML = `⚠️ تنبيه: هذا الرقم مسجل مسبقاً للعميل: <strong>${escapeHtml(dup.lead.name)}</strong> (${STAGES[dup.lead.stage]?.label || dup.lead.stage})`;
          phoneWarn.classList.remove('hidden');
        } else {
          phoneWarn.classList.add('hidden');
        }
      } else {
        phoneWarn.classList.add('hidden');
      }
    }

    if (socialWarn) {
      const norm = socialVal.toLowerCase().replace(/^@/, '');
      if (norm) {
        const dup = findDuplicateLead('', socialVal, excludeId);
        if (dup) {
          socialWarn.innerHTML = `⚠️ تنبيه: هذا الحساب مسجل مسبقاً للعميل: <strong>${escapeHtml(dup.lead.name)}</strong> (${STAGES[dup.lead.stage]?.label || dup.lead.stage})`;
          socialWarn.classList.remove('hidden');
        } else {
          socialWarn.classList.add('hidden');
        }
      } else {
        socialWarn.classList.add('hidden');
      }
    }
  };

  if (phoneEl) {
    phoneEl.addEventListener('input', check);
    phoneEl.addEventListener('blur', check);
  }
  if (socialEl) {
    socialEl.addEventListener('input', check);
    socialEl.addEventListener('blur', check);
  }
}

function updateCampaignFilterOptions() {
  const campaignSelect = document.getElementById('filterCampaign');
  if (!campaignSelect) return;
  const currentVal = state.filters.campaign || '';

  const campaigns = new Set();
  if (state.analytics?.by_campaign) {
    state.analytics.by_campaign.forEach((c) => {
      if (c.campaign_name && c.campaign_name.trim()) campaigns.add(c.campaign_name.trim());
    });
  }
  (state.leads || []).forEach((l) => {
    if (l.campaign_name && l.campaign_name.trim()) campaigns.add(l.campaign_name.trim());
  });

  campaignSelect.innerHTML = '<option value="">جميع الحملات الإعلانية</option>';
  Array.from(campaigns).sort().forEach((camp) => {
    const opt = document.createElement('option');
    opt.value = camp;
    opt.textContent = camp;
    if (camp === currentVal) opt.selected = true;
    campaignSelect.appendChild(opt);
  });
}

function updateFollowupBadges() {
  const overdueBtn = document.getElementById('btnToggleOverdueFollowups');
  const todayBtn = document.getElementById('btnToggleDueFollowups');
  const badgeOverdue = document.getElementById('badgeOverdueCount');
  const badgeToday = document.getElementById('badgeTodayCount');

  let overdueCount = state.analytics?.overdue_followups_count;
  let todayCount = state.analytics?.today_followups_count;

  if (overdueCount === undefined || todayCount === undefined) {
    const now = new Date();
    overdueCount = 0;
    todayCount = 0;
    (state.leads || []).forEach((lead) => {
      if (lead.stage !== 'won' && lead.stage !== 'lost' && lead.next_followup_at) {
        const d = parseFollowupDate(lead.next_followup_at);
        if (d) {
          if (d < now) overdueCount++;
          const targetDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (targetDay.getTime() === nowDay.getTime()) todayCount++;
        }
      }
    });
  }

  if (badgeOverdue) badgeOverdue.textContent = overdueCount;
  if (badgeToday) badgeToday.textContent = todayCount;

  if (overdueBtn) {
    overdueBtn.classList.toggle('active', state.filters.followup === 'overdue');
  }
  if (todayBtn) {
    todayBtn.classList.toggle('active', state.filters.followup === 'today');
  }
}

// ============================================================================
// Rendering: KPIs & Sidebar
// ============================================================================
function renderKPIs() {
  const a = state.analytics;
  if (!a) return;

  document.getElementById('kpiTotalLeads').textContent = a.total_leads || 0;
  document.getElementById('kpiNewLeads').textContent = a.new_leads || 0;
  document.getElementById('kpiExpectedPipeline').textContent = formatCurrency(a.expected_pipeline_value || 0);
  document.getElementById('kpiActiveCount').textContent = `${a.active_pipeline_count || 0} صفقة قيد التفاوض`;

  document.getElementById('kpiWonRevenue').textContent = formatCurrency(a.won_revenue || 0);
  document.getElementById('kpiDepositsSub').textContent = `عربون محصل: ${formatCurrency(a.deposits_collected || 0)}`;

  document.getElementById('kpiConversionRate').textContent = `${a.conversion_rate || 0}%`;
  document.getElementById('kpiWonLostSub').textContent = `${a.won_count || 0} فوز / ${a.lost_count || 0} مؤجل`;

  const dueBadge = document.getElementById('kpiDueFollowups');
  dueBadge.textContent = a.due_followups_count || 0;

  updateFollowupBadges();
  updateCampaignFilterOptions();

  const dueStatus = document.getElementById('kpiDueStatus');
  if (state.filters.followup === 'overdue') {
    dueStatus.textContent = '✓ تصفية المتأخرة مفعلة';
    document.getElementById('kpiFollowupCard').style.borderColor = '#ef4444';
  } else if (state.filters.followup === 'today') {
    dueStatus.textContent = '✓ تصفية متابعات اليوم';
    document.getElementById('kpiFollowupCard').style.borderColor = '#0284c7';
  } else if (state.filters.followup === 'due') {
    dueStatus.textContent = '✓ التصفية مفعلة حالياً';
    document.getElementById('kpiFollowupCard').style.borderColor = '#ef4444';
  } else {
    dueStatus.textContent = 'اضغط للتصفية السريعة';
    document.getElementById('kpiFollowupCard').style.borderColor = '';
  }
}

function renderSidebarStats() {
  const a = state.analytics;
  if (!a) return;

  document.getElementById('navPipelineCount').textContent = a.active_pipeline_count || 0;
  document.getElementById('sidebarConversionRate').textContent = `${a.conversion_rate || 0}%`;
  document.getElementById('sidebarDeposits').textContent = formatCurrency(a.deposits_collected || 0);
  document.getElementById('sidebarWonRevenue').textContent = formatCurrency(a.won_revenue || 0);

  const rate = Math.min(100, Math.max(0, a.conversion_rate || 0));
  document.getElementById('sidebarProgressBar').style.width = `${rate}%`;
}

// ============================================================================
// Rendering: View 1 (Kanban Pipeline)
// ============================================================================
function renderKanban() {
  const stageKeys = Object.keys(STAGES);
  const stageGroups = {};
  stageKeys.forEach((key) => {
    stageGroups[key] = [];
  });

  state.leads.forEach((lead) => {
    const stage = lead.stage || 'new';
    if (stageGroups[stage]) {
      stageGroups[stage].push(lead);
    } else {
      stageGroups.new.push(lead);
    }
  });

  stageKeys.forEach((stage) => {
    const colContainer = document.getElementById(`col_${stage}`);
    const countBadge = document.getElementById(`count_${stage}`);
    const sumBadge = document.getElementById(`sum_${stage}`);

    if (!colContainer) return;

    const leads = stageGroups[stage];
    countBadge.textContent = leads.length;

    const totalValue = leads.reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);
    sumBadge.textContent = formatCurrency(totalValue);

    colContainer.innerHTML = '';

    if (leads.length === 0) {
      colContainer.innerHTML = `
        <div style="padding: 24px 10px; text-align: center; color: var(--ink-400); font-size: 0.8rem;">
          لا توجد صفقات في هذه المرحلة
        </div>
      `;
      return;
    }

    leads.forEach((lead) => {
      const card = createKanbanCard(lead);
      colContainer.appendChild(card);
    });
  });

  setupKanbanDragAndDrop();
}

function createKanbanCard(lead) {
  const card = document.createElement('div');
  card.className = 'lead-card';
  card.setAttribute('draggable', 'true');
  card.dataset.id = lead.id;

  const priorityMeta = PRIORITIES[lead.priority] || PRIORITIES.medium;
  const siteTypeLabel = WEBSITE_TYPES[lead.website_type] || lead.website_type;
  const followup = getFollowupStatus(lead.next_followup_at, lead.stage);

  let followupHtml = '';
  if (followup) {
    followupHtml = `
      <span class="card-followup-badge ${followup.class}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px;">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        ${followup.label}
      </span>
    `;
  }

  const cleanPhone = cleanPhoneNumber(lead.phone);
  const hasSocial = Boolean(lead.social_handle && lead.social_handle.trim());
  const hasContact = Boolean(cleanPhone || hasSocial);
  const waUrl = `https://wa.me/${cleanPhone}`;

  card.innerHTML = `
    <div class="card-top">
      <div>
        <div class="card-client-name">${escapeHtml(lead.name)}</div>
        <div class="card-business-name">${escapeHtml(lead.business_name || 'بدون اسم نشاط')}</div>
        ${hasSocial ? `<div class="card-social-tag" title="اسم الحساب / يوزر">💬 ${escapeHtml(lead.social_handle)}</div>` : ''}
        ${!hasContact ? `<div class="card-no-contact-tag" title="لا يوجد رقم هاتف أو حساب تواصل مسجل">⚠️ بدون وسيلة تواصل</div>` : ''}
      </div>
      <span class="card-priority-tag ${priorityMeta.class}">${priorityMeta.label}</span>
    </div>

    <div class="card-badges-row">
      <span class="badge-site-type">${escapeHtml(siteTypeLabel)}</span>
      ${lead.campaign_name ? `<span class="badge-campaign" title="${escapeHtml(lead.campaign_name)}">🎯 ${escapeHtml(lead.campaign_name)}</span>` : ''}
    </div>

    <div class="card-metrics-row">
      <div>
        <div class="card-deal-value">${formatCurrency(lead.deal_value || lead.budget || 0)}</div>
        ${lead.deposit_paid > 0 ? `<span class="card-deposit-tag">العربون: ${formatCurrency(lead.deposit_paid)}</span>` : ''}
      </div>
      ${followupHtml}
    </div>

    <div class="card-footer-actions">
      ${cleanPhone ? `
        <a href="${waUrl}" target="_blank" class="btn-card-wa" onclick="event.stopPropagation();" title="محادثة واتساب سريعة">
          <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.456h.005c6.554 0 11.89-5.335 11.893-11.893 0-3.177-1.237-6.164-3.484-8.411"/></svg>
          <span>واتساب</span>
        </a>
      ` : `
        <span class="btn-card-wa" onclick="event.stopPropagation(); showToast('لا يوجد رقم واتساب مسجل لهذا العميل', 'warning');" style="opacity: 0.45; cursor: not-allowed;" title="لا يوجد رقم هاتف مسجل">
          <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.456h.005c6.554 0 11.89-5.335 11.893-11.893 0-3.177-1.237-6.164-3.484-8.411"/></svg>
          <span>واتساب</span>
        </span>
      `}

      <button type="button" class="btn-card-contact" onclick="event.stopPropagation(); handleQuickContacted('${lead.id}');" title="تسجيل تم التواصل وتحديث تاريخ آخر تواصل">
        📞 تواصل
      </button>

      <button type="button" class="btn-card-details" onclick="event.stopPropagation(); openLeadDrawer('${lead.id}');" title="عرض تفاصيل العميل والنشاطات">
        👁️ تفاصيل
      </button>

      <select class="card-quick-stage-select" onclick="event.stopPropagation();" onchange="handleCardQuickStageChange('${lead.id}', this.value)">
        <option value="new" ${lead.stage === 'new' ? 'selected' : ''}>عميل جديد</option>
        <option value="contacted" ${lead.stage === 'contacted' ? 'selected' : ''}>تواصل</option>
        <option value="discovery" ${lead.stage === 'discovery' ? 'selected' : ''}>متطلبات</option>
        <option value="proposal" ${lead.stage === 'proposal' ? 'selected' : ''}>عرض سعر</option>
        <option value="negotiation" ${lead.stage === 'negotiation' ? 'selected' : ''}>تفاوض</option>
        <option value="won" ${lead.stage === 'won' ? 'selected' : ''}>فوز 🎉</option>
        <option value="lost" ${lead.stage === 'lost' ? 'selected' : ''}>مؤجل</option>
      </select>
    </div>
  `;

  card.addEventListener('click', (e) => {
    if (e.target.closest('button, a, select, input, label, .card-footer-actions')) return;
    if (card.classList.contains('dragging')) return;
    openLeadDrawer(lead.id);
  });
  return card;
}

function setupKanbanDragAndDrop() {
  const cards = document.querySelectorAll('.lead-card');
  const cols = document.querySelectorAll('.kanban-col');

  cards.forEach((card) => {
    card.addEventListener('dragstart', (e) => {
      state.draggedLeadId = card.dataset.id;
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', card.dataset.id);
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      cols.forEach((col) => col.classList.remove('drag-over'));
      state.draggedLeadId = null;
    });
  });

  cols.forEach((col) => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      col.classList.add('drag-over');
    });

    col.addEventListener('dragleave', (e) => {
      // Only remove if leaving the column boundary
      if (!col.contains(e.relatedTarget)) {
        col.classList.remove('drag-over');
      }
    });

    col.addEventListener('drop', async (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const leadId = e.dataTransfer.getData('text/plain') || state.draggedLeadId;
      const targetStage = col.dataset.stage;

      if (!leadId || !targetStage) return;

      const lead = state.leads.find((l) => l.id === leadId);
      if (!lead || lead.stage === targetStage) return;

      requestStageTransition(leadId, targetStage);
    });
  });
}

// ============================================================================
// Stage Transition Flow (with Won/Lost Modals)
// ============================================================================
function handleCardQuickStageChange(leadId, newStage) {
  requestStageTransition(leadId, newStage);
}

function requestStageTransition(leadId, targetStage) {
  const lead = state.leads.find((l) => l.id === leadId);
  if (!lead) return;

  if (targetStage === 'won') {
    state.pendingStageChange = { leadId, stage: 'won' };
    const defaultDeposit = lead.deal_value ? Math.round(lead.deal_value * 0.5) : 5000;
    document.getElementById('wonDepositAmount').value = lead.deposit_paid || defaultDeposit;
    document.getElementById('wonPaymentNote').value = 'فودافون كاش / إنستاباي';
    document.getElementById('wonModalOverlay').classList.add('active');
  } else if (targetStage === 'lost') {
    state.pendingStageChange = { leadId, stage: 'lost' };
    document.getElementById('lostModalOverlay').classList.add('active');
  } else {
    executeStageTransition(leadId, targetStage);
  }
}

async function executeStageTransition(leadId, targetStage, lostReason = '', depositPaid = undefined) {
  try {
    await apiUpdateStage(leadId, targetStage, lostReason, depositPaid);
    showToast(`تم نقل العميل إلى مرحلة: ${STAGES[targetStage].label}`);
    await refreshData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================================
// Rendering: View 2 (Table View)
// ============================================================================
function renderTable() {
  const tbody = document.getElementById('leadsTableBody');
  const emptyState = document.getElementById('tableEmptyState');

  if (state.leads.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  tbody.innerHTML = '';

  state.leads.forEach((lead) => {
    const tr = document.createElement('tr');

    const priorityMeta = PRIORITIES[lead.priority] || PRIORITIES.medium;
    const stageMeta = STAGES[lead.stage] || STAGES.new;
    const siteTypeLabel = WEBSITE_TYPES[lead.website_type] || lead.website_type;
    const followup = getFollowupStatus(lead.next_followup_at, lead.stage);

    let followupHtml = '<span style="color: var(--ink-400);">--</span>';
    if (followup) {
      followupHtml = `<span class="card-followup-badge ${followup.class}">${followup.label}</span>`;
    }

    const cleanPhone = cleanPhoneNumber(lead.phone);
    const hasSocial = Boolean(lead.social_handle && lead.social_handle.trim());
    const hasContact = Boolean(cleanPhone || hasSocial);
    const waUrl = `https://wa.me/${cleanPhone}`;

    tr.innerHTML = `
      <td>
        <div class="table-client-cell">
          <span class="table-client-name" onclick="openLeadDrawer('${lead.id}')">${escapeHtml(lead.name)}</span>
          <span class="table-client-business">${escapeHtml(lead.business_name || 'بدون نشاط')}</span>
        </div>
      </td>
      <td>
        <div style="display: flex; flex-direction: column;">
          ${cleanPhone ? `<span class="table-phone">${escapeHtml(lead.phone)}</span>` : ''}
          ${hasSocial ? `<span class="table-social-handle" title="اسم الحساب">💬 ${escapeHtml(lead.social_handle)}</span>` : ''}
          ${!hasContact ? `<span class="badge-no-contact-table" title="لا يوجد هاتف أو حساب للتواصل">⚠️ بدون وسيلة تواصل</span>` : ''}
          ${lead.email ? `<span style="font-size: 0.74rem; color: var(--ink-500);">${escapeHtml(lead.email)}</span>` : ''}
        </div>
      </td>
      <td>
        <span class="badge-site-type">${escapeHtml(siteTypeLabel)}</span>
      </td>
      <td>
        <div style="display: flex; flex-direction: column;">
          <span style="font-size: 0.82rem; font-weight: 600;">${escapeHtml(lead.campaign_name || 'حملة ميتا')}</span>
          <span style="font-size: 0.72rem; color: var(--ink-400);">${AD_SOURCES[lead.ad_source] || lead.ad_source}</span>
        </div>
      </td>
      <td>
        <span class="stage-chip" style="background-color: ${stageMeta.color}15; color: ${stageMeta.color}; border: 1px solid ${stageMeta.color}40;">
          ${stageMeta.label}
        </span>
      </td>
      <td>
        <span class="card-priority-tag ${priorityMeta.class}">${priorityMeta.label}</span>
      </td>
      <td>
        <strong style="font-family: var(--font-heading);">${formatCurrency(lead.deal_value || lead.budget || 0)}</strong>
      </td>
      <td>
        <span class="text-emerald" style="font-weight: 700;">${lead.deposit_paid ? formatCurrency(lead.deposit_paid) : '0 ج.م'}</span>
      </td>
      <td>
        ${followupHtml}
      </td>
      <td>
        <div class="table-actions">
          <button class="btn-table-action" onclick="openLeadDrawer('${lead.id}')" title="عرض التفاصيل">
            👁️ فتح
          </button>
          <button class="btn-table-action" onclick="handleQuickContacted('${lead.id}')" style="color: #1d4ed8; border-color: #bfdbfe;" title="تسجيل تم التواصل وتحديث تاريخ آخر تواصل">
            📞 تواصل
          </button>
          ${cleanPhone ? `
            <a href="${waUrl}" target="_blank" class="btn-table-action" style="color: #059669; border-color: #a7f3d0;" title="محادثة واتساب">
              💬 واتساب
            </a>
          ` : `
            <button type="button" class="btn-table-action" onclick="showToast('لا يوجد رقم واتساب مسجل لهذا العميل', 'warning')" style="color: var(--ink-400); border-color: var(--slate-200); opacity: 0.5; cursor: not-allowed;" title="لا يوجد رقم هاتف مسجل">
              💬 واتساب
            </button>
          `}
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// ============================================================================
// Rendering: View 3 (Meta Analytics & Reports)
// ============================================================================
function renderAnalyticsView() {
  const a = state.analytics;
  if (!a) return;

  // 1. Funnel
  const funnelContainer = document.getElementById('analyticsFunnel');
  funnelContainer.innerHTML = '';
  const total = a.total_leads || 1;

  const funnelStages = [
    { key: 'new', label: 'عميل جديد (ميتا)', color: '#1877f2' },
    { key: 'contacted', label: 'تم التواصل المبدئي', color: '#0284c7' },
    { key: 'discovery', label: 'تحديد المتطلبات', color: '#6366f1' },
    { key: 'proposal', label: 'إرسال عرض السعر', color: '#d97706' },
    { key: 'negotiation', label: 'تفاوض ومراجعة', color: '#ea580c' },
    { key: 'won', label: 'إغلاق الصفقة (فوز 🎉)', color: '#059669' }
  ];

  funnelStages.forEach((item) => {
    const count = (a.by_stage && a.by_stage[item.key]) || 0;
    const pct = Math.round((count / total) * 100);

    const step = document.createElement('div');
    step.className = 'funnel-step';
    step.innerHTML = `
      <div class="funnel-label">${item.label}</div>
      <div class="funnel-bar-track">
        <div class="funnel-bar-fill" style="width: ${Math.max(pct, 6)}%; background-color: ${item.color};">
          ${pct}%
        </div>
      </div>
      <div class="funnel-metrics">
        <span class="funnel-count">${count} عميل</span>
        <span class="funnel-percent">${pct}% من الإجمالي</span>
      </div>
    `;
    funnelContainer.appendChild(step);
  });

  // 2. Campaigns Performance Table
  const campaignsTbody = document.getElementById('campaignsTableBody');
  campaignsTbody.innerHTML = '';
  const campaigns = a.by_campaign || {};
  const campaignKeys = Object.keys(campaigns);

  if (campaignKeys.length === 0) {
    campaignsTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--ink-400);">لا توجد بيانات حملات مسجلة</td></tr>`;
  } else {
    campaignKeys.forEach((name) => {
      const data = campaigns[name];
      const convRate = data.leads > 0 ? Math.round((data.won / data.leads) * 100) : 0;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>🎯 ${escapeHtml(name)}</strong></td>
        <td>${data.leads} عميل</td>
        <td><span class="text-emerald font-bold">${data.won} صفقات</span></td>
        <td><span class="widget-tag">${convRate}%</span></td>
        <td><strong>${formatCurrency(data.revenue || 0)}</strong></td>
      `;
      campaignsTbody.appendChild(row);
    });
  }

  // 3. Website Type Demand Bars
  const barsContainer = document.getElementById('websiteTypeBars');
  barsContainer.innerHTML = '';
  const websiteTypes = a.by_website_type || {};

  Object.keys(WEBSITE_TYPES).forEach((typeKey) => {
    const count = websiteTypes[typeKey] || 0;
    const pct = Math.round((count / total) * 100);
    const row = document.createElement('div');
    row.className = 'bar-row';
    row.innerHTML = `
      <div class="bar-info">
        <span>${WEBSITE_TYPES[typeKey]}</span>
        <span>${count} طلب (${pct}%)</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width: ${pct}%;"></div>
      </div>
    `;
    barsContainer.appendChild(row);
  });

  // 4. Financial Deal Summary
  const finContainer = document.getElementById('financialSummary');
  const wonRev = a.won_revenue || 0;
  const deposits = a.deposits_collected || 0;
  const remaining = Math.max(0, wonRev - deposits);
  const pipeline = a.expected_pipeline_value || 0;

  finContainer.innerHTML = `
    <div class="fin-item">
      <div>
        <div class="fin-title">قيمة خط المبيعات النشط (Pipeline)</div>
        <div style="font-size: 0.74rem; color: var(--ink-400);">صفقات قيد التفاوض وعروض الأسعار</div>
      </div>
      <span class="fin-amount text-amber">${formatCurrency(pipeline)}</span>
    </div>

    <div class="fin-item">
      <div>
        <div class="fin-title">إجمالي مبيعات الصفقات المغلقة (Won)</div>
        <div style="font-size: 0.74rem; color: var(--ink-400);">القيمة الإجمالية للمشاريع المعتمدة</div>
      </div>
      <span class="fin-amount text-cyan">${formatCurrency(wonRev)}</span>
    </div>

    <div class="fin-item">
      <div>
        <div class="fin-title">العربون والسيولة المحصلة فعلياً</div>
        <div style="font-size: 0.74rem; color: var(--ink-400);">مبالغ نقدية مستلمة من العملاء</div>
      </div>
      <span class="fin-amount text-emerald">${formatCurrency(deposits)}</span>
    </div>

    <div class="fin-item">
      <div>
        <div class="fin-title">المتبقي للتحصيل عند التسليم</div>
        <div style="font-size: 0.74rem; color: var(--ink-400);">دفعات مؤجلة عند إنهاء المواقع</div>
      </div>
      <span class="fin-amount text-rose">${formatCurrency(remaining)}</span>
    </div>
  `;
}

// ============================================================================
// Slide-Over Drawer: Lead Workspace & Deal Closer
// ============================================================================
async function openLeadDrawer(leadId) {
  try {
    const data = await apiGetLead(leadId);
    state.selectedLead = data.lead;
    state.selectedLeadActivities = data.activities || [];

    populateLeadSpecs(state.selectedLead);
    renderDrawerHeader(state.selectedLead);
    renderStageStepper(state.selectedLead.stage);
    renderActivityTimeline(state.selectedLeadActivities);
    updateWhatsAppCloserScript();

    // Default to specs tab
    switchDrawerTab('specs');

    // Show drawer
    document.getElementById('drawerOverlay').classList.add('active');
    document.getElementById('leadDrawer').classList.add('active');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function closeLeadDrawer() {
  document.getElementById('drawerOverlay').classList.remove('active');
  document.getElementById('leadDrawer').classList.remove('active');
  state.selectedLead = null;
}

function renderDrawerHeader(lead) {
  document.getElementById('drawerLeadName').textContent = lead.name;
  document.getElementById('drawerBusinessName').textContent = lead.business_name || 'بدون اسم نشاط';
  document.getElementById('drawerSourceBadge').textContent = AD_SOURCES[lead.ad_source] || lead.ad_source;
  document.getElementById('drawerCampaignName').textContent = lead.campaign_name || 'حملة ميتا';

  const socialBadge = document.getElementById('drawerSocialBadge');
  const socialBullet = document.getElementById('drawerSocialBullet');
  if (socialBadge && socialBullet) {
    if (lead.social_handle) {
      socialBadge.textContent = `💬 ${lead.social_handle}`;
      socialBadge.style.display = 'inline-block';
      socialBullet.style.display = 'inline-block';
    } else {
      socialBadge.style.display = 'none';
      socialBullet.style.display = 'none';
    }
  }

  const stageMeta = STAGES[lead.stage] || STAGES.new;
  const stageChip = document.getElementById('drawerStageChip');
  stageChip.textContent = stageMeta.label;
  stageChip.style.backgroundColor = `${stageMeta.color}20`;
  stageChip.style.color = stageMeta.color;
  stageChip.style.borderColor = `${stageMeta.color}40`;

  const priorityMeta = PRIORITIES[lead.priority] || PRIORITIES.medium;
  const priorityChip = document.getElementById('drawerPriorityChip');
  priorityChip.textContent = priorityMeta.label;
  priorityChip.className = `priority-chip ${priorityMeta.class}`;
}

function renderStageStepper(currentStage) {
  const steps = document.querySelectorAll('.step-btn');
  const stageKeys = Object.keys(STAGES);
  const currentIdx = stageKeys.indexOf(currentStage);

  steps.forEach((btn) => {
    const stepStage = btn.dataset.step;
    const stepIdx = stageKeys.indexOf(stepStage);

    btn.classList.remove('active', 'completed');

    if (stepStage === currentStage) {
      btn.classList.add('active');
    } else if (stepIdx < currentIdx && currentStage !== 'lost') {
      btn.classList.add('completed');
    }
  });
}

function populateLeadSpecs(lead) {
  document.getElementById('editLeadId').value = lead.id;
  document.getElementById('editName').value = lead.name || '';
  document.getElementById('editPhone').value = lead.phone || '';
  const socialEl = document.getElementById('editSocialHandle');
  if (socialEl) socialEl.value = lead.social_handle || '';
  document.getElementById('editEmail').value = lead.email || '';

  const pWarn = document.getElementById('editPhoneWarning');
  const sWarn = document.getElementById('editSocialWarning');
  if (pWarn) pWarn.classList.add('hidden');
  if (sWarn) sWarn.classList.add('hidden');
  document.getElementById('editBusinessName').value = lead.business_name || '';
  document.getElementById('editWebsiteType').value = lead.website_type || 'unspecified';
  document.getElementById('editStage').value = lead.stage || 'new';
  document.getElementById('editPriority').value = lead.priority || 'medium';
  document.getElementById('editAdSource').value = lead.ad_source || 'meta_form';
  document.getElementById('editCampaignName').value = lead.campaign_name || '';
  document.getElementById('editBudget').value = lead.budget || 0;
  document.getElementById('editDealValue').value = lead.deal_value || 0;
  document.getElementById('editDepositPaid').value = lead.deposit_paid || 0;
  document.getElementById('editNotes').value = lead.notes || '';

  document.getElementById('editNextFollowup').value = toDateTimeLocalValue(lead.next_followup_at);
  const actFollowupEl = document.getElementById('activityFollowupDate');
  if (actFollowupEl) actFollowupEl.value = '';

  const hasContact = Boolean(cleanPhoneNumber(lead.phone) || (lead.social_handle && lead.social_handle.trim()));
  const drawerWarn = document.getElementById('drawerNoContactWarning');
  if (drawerWarn) drawerWarn.classList.toggle('hidden', hasContact);

  // Requirements checkboxes
  const reqChips = document.querySelectorAll('#requirementsChips input[name="requirements"]');
  const leadReqs = Array.isArray(lead.requirements) ? lead.requirements : [];
  reqChips.forEach((cb) => {
    cb.checked = leadReqs.includes(cb.value);
  });
}

function switchDrawerTab(tabId) {
  state.activeDrawerTab = tabId;

  document.querySelectorAll('.drawer-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.drawerTab === tabId);
  });

  document.querySelectorAll('.drawer-pane').forEach((pane) => {
    pane.classList.remove('active');
  });

  const targetPane = document.getElementById(`pane${capitalize(tabId)}`);
  if (targetPane) targetPane.classList.add('active');

  if (tabId === 'whatsapp') {
    updateWhatsAppCloserScript();
  } else if (tabId === 'calculator') {
    initCalculatorForSelectedLead();
  }
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ============================================================================
// Drawer: WhatsApp Deal Closer
// ============================================================================
function updateWhatsAppCloserScript() {
  const lead = state.selectedLead;
  if (!lead) return;

  const scriptDef = SCRIPT_TEMPLATES[state.activeScriptId] || SCRIPT_TEMPLATES.welcome;
  const siteTypeArabic = WEBSITE_TYPES[lead.website_type] || 'موقعكم الإلكتروني';
  const dealValueFormatted = formatCurrency(lead.deal_value || lead.budget || 15000);
  const depositSuggested = formatCurrency(Math.round((lead.deal_value || lead.budget || 15000) * 0.5));

  let text = scriptDef.template(lead);
  text = text.replace(/{name}/g, lead.name || 'عزيزنا العميل');
  text = text.replace(/{business_name}/g, lead.business_name || 'مشروعكم الموقر');
  text = text.replace(/{website_type}/g, siteTypeArabic);
  text = text.replace(/{deal_value}/g, dealValueFormatted);
  text = text.replace(/{deposit_suggested}/g, depositSuggested);

  document.getElementById('whatsappMessageContent').value = text;
  document.getElementById('whatsappRecipientNumber').textContent = lead.phone || 'غير مسجل';

  // Highlight active pill
  document.querySelectorAll('.script-pill').forEach((pill) => {
    pill.classList.toggle('active', pill.dataset.scriptId === state.activeScriptId);
  });
}

async function sendWhatsAppMessageAndLog() {
  const lead = state.selectedLead;
  if (!lead) return;

  const cleanPhone = cleanPhoneNumber(lead.phone);
  if (!cleanPhone) {
    if (lead.social_handle) {
      showToast(`العميل بدون رقم واتساب. يمكنك نسخ الرسالة وإرسالها عبر ماسنجر/إنستجرام إلى (${lead.social_handle})`, 'warning');
    } else {
      showToast('لا يوجد رقم واتساب مسجل لهذا العميل. يرجى إضافة رقم الهاتف في تفاصيل العميل أولاً.', 'warning');
    }
    return;
  }

  const messageText = document.getElementById('whatsappMessageContent').value.trim();
  const scriptDef = SCRIPT_TEMPLATES[state.activeScriptId] || SCRIPT_TEMPLATES.welcome;
  const encoded = encodeURIComponent(messageText);
  const waUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;

  // 1. Open WhatsApp tab
  window.open(waUrl, '_blank');

  // 2. Automatically log activity
  try {
    const summary = `تم إرسال رسالة واتساب: [${scriptDef.title}]`;
    await apiAddActivity(lead.id, {
      type: 'whatsapp',
      summary: summary
    });

    showToast('تم فتح واتساب وتوثيق المتابعة بنجاح! 🚀');

    // Reload activities
    const fresh = await apiGetLead(lead.id);
    state.selectedLeadActivities = fresh.activities || [];
    renderActivityTimeline(state.selectedLeadActivities);
    refreshData();
  } catch (err) {
    console.error('Error logging WhatsApp activity:', err);
  }
}

// ============================================================================
// Drawer: Quick Quote Calculator
// ============================================================================
function initCalculatorForSelectedLead() {
  const lead = state.selectedLead;
  if (!lead) return;

  // Match radio button with lead's website_type if matching
  const radios = document.querySelectorAll('input[name="calc_base_type"]');
  radios.forEach((r) => {
    // If type matches
    if (lead.website_type === 'ecommerce' && r.value === '15000') r.checked = true;
    if (lead.website_type === 'corporate' && r.value === '9000') r.checked = true;
    if (lead.website_type === 'landing' && r.value === '5000') r.checked = true;
    if (lead.website_type === 'booking' && r.value === '18000') r.checked = true;
    if (lead.website_type === 'custom' && r.value === '25000') r.checked = true;
  });

  // Sync checkboxes with requirements
  const leadReqs = Array.isArray(lead.requirements) ? lead.requirements : [];
  const addonChecks = document.querySelectorAll('.calc-addon');
  addonChecks.forEach((chk) => {
    const name = chk.dataset.addonName;
    if (name.includes('استضافة') && leadReqs.includes('domain_hosting')) chk.checked = true;
    else if (name.includes('دفع') && leadReqs.includes('payment_gateway')) chk.checked = true;
    else if (name.includes('شحن') && leadReqs.includes('shipping_integration')) chk.checked = true;
    else if (name.includes('Pixel') && leadReqs.includes('meta_pixel')) chk.checked = true;
    else if (name.includes('اللغة') && leadReqs.includes('arabic_english')) chk.checked = true;
    else if (name.includes('SEO') && leadReqs.includes('seo_setup')) chk.checked = true;
    else if (name.includes('لوحة تحكم') && leadReqs.includes('admin_dashboard')) chk.checked = true;
  });

  recalculateQuote();
}

function recalculateQuote() {
  const baseRadio = document.querySelector('input[name="calc_base_type"]:checked');
  const basePrice = baseRadio ? Number(baseRadio.value) : 15000;

  let addonsTotal = 0;
  const addonChecks = document.querySelectorAll('.calc-addon:checked');
  addonChecks.forEach((chk) => {
    addonsTotal += Number(chk.value) || 0;
  });

  const grandTotal = basePrice + addonsTotal;
  const depositSuggested = Math.round(grandTotal * 0.5);

  document.getElementById('calcEstimatedTotal').textContent = formatCurrency(grandTotal);
  document.getElementById('calcDepositSuggested').textContent = formatCurrency(depositSuggested);

  return { grandTotal, depositSuggested, baseRadio, addonChecks };
}

async function applyQuoteToLead() {
  const lead = state.selectedLead;
  if (!lead) return;

  const { grandTotal } = recalculateQuote();

  try {
    // 1. Update lead deal_value
    await apiUpdateLead(lead.id, {
      deal_value: grandTotal
    });

    // 2. Log proposal activity
    await apiAddActivity(lead.id, {
      type: 'proposal',
      deal_value: grandTotal,
      summary: `تم احتساب واعتماد عرض سعر بقيمة ${formatCurrency(grandTotal)} عبر حاسبة عرض السعر السريعة`
    });

    showToast(`تم اعتماد عرض السعر (${formatCurrency(grandTotal)}) وتحديث الصفقة بنجاح!`);

    // Update input in Specs pane
    document.getElementById('editDealValue').value = grandTotal;

    // Refresh lead state & timeline
    const fresh = await apiGetLead(lead.id);
    state.selectedLead = fresh.lead;
    state.selectedLeadActivities = fresh.activities || [];
    renderActivityTimeline(state.selectedLeadActivities);
    refreshData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================================
// Drawer: Activity Timeline
// ============================================================================
function renderActivityTimeline(activities) {
  const container = document.getElementById('activityTimelineList');
  if (!container) return;

  if (!activities || activities.length === 0) {
    container.innerHTML = `
      <div style="padding: 20px 0; color: var(--ink-400); font-size: 0.85rem;">
        لا توجد نشاطات أو متابعات مسجلة لهذا العميل حتى الآن.
      </div>
    `;
    return;
  }

  container.innerHTML = '';

  activities.forEach((act) => {
    const item = document.createElement('div');
    item.className = 'timeline-item';

    const typeIcons = {
      whatsapp: '💬 واتساب',
      call: '📞 مكالمة',
      meeting: '🤝 اجتماع',
      proposal: '📄 عرض سعر',
      stage_change: '🔄 تغيير مرحلة',
      system: '⚙️ نظام',
      note: '📝 ملاحظة'
    };

    const typeLabel = typeIcons[act.type] || act.type;
    const relTime = formatRelativeTime(act.created_at);
    const absDate = formatDate(act.created_at);

    item.innerHTML = `
      <div class="timeline-marker marker-${act.type || 'system'}"></div>
      <div class="timeline-item-header">
        <span class="timeline-type-tag">${typeLabel}</span>
        <span class="timeline-date" title="${absDate}">${relTime}</span>
      </div>
      <div class="timeline-summary">${escapeHtml(act.summary)}</div>
    `;

    container.appendChild(item);
  });
}

// ============================================================================
// CSV Import Parser & Modal
// ============================================================================
function handleCsvText(text) {
  if (!text || !text.trim()) {
    state.parsedCsvLeads = [];
    document.getElementById('csvPreviewBox').classList.add('hidden');
    document.getElementById('btnExecuteImport').disabled = true;
    return;
  }

  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return;

  const headerLine = lines[0];
  const headers = parseCsvLine(headerLine).map((h) => h.trim().toLowerCase());

  // Detect column mapping
  const colMap = {
    name: headers.findIndex((h) => h.includes('name') || h.includes('اسم') || h.includes('العميل')),
    phone: headers.findIndex((h) => h.includes('phone') || h.includes('هاتف') || h.includes('موبايل') || h.includes('واتس')),
    social_handle: headers.findIndex((h) => h.includes('social') || h.includes('user') || h.includes('يوزر') || h.includes('حساب') || h.includes('انستجرام') || h.includes('ماسنجر')),
    email: headers.findIndex((h) => h.includes('email') || h.includes('بريد') || h.includes('ايميل')),
    business_name: headers.findIndex((h) => h.includes('business') || h.includes('شركة') || h.includes('نشاط')),
    website_type: headers.findIndex((h) => h.includes('website') || h.includes('نوع') || h.includes('type')),
    budget: headers.findIndex((h) => h.includes('budget') || h.includes('ميزانية')),
    campaign_name: headers.findIndex((h) => h.includes('campaign') || h.includes('حملة') || h.includes('ad'))
  };

  const parsed = [];
  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    const row = parseCsvLine(rawLine);
    const name = colMap.name >= 0 ? row[colMap.name] : row[0];
    const phone = colMap.phone >= 0 ? (row[colMap.phone] || '') : '';

    if (!name) continue;

    let siteType = colMap.website_type >= 0 ? row[colMap.website_type] : 'ecommerce';
    if (!['ecommerce', 'corporate', 'landing', 'booking', 'custom'].includes(siteType)) {
      if (siteType && siteType.includes('متجر')) siteType = 'ecommerce';
      else if (siteType && siteType.includes('شركة')) siteType = 'corporate';
      else if (siteType && siteType.includes('هبوط')) siteType = 'landing';
      else siteType = 'ecommerce';
    }

    parsed.push({
      name: name || 'عميل ميتا',
      phone: phone ? String(phone).trim() : '',
      social_handle: colMap.social_handle >= 0 ? String(row[colMap.social_handle] || '').trim() : '',
      email: colMap.email >= 0 ? (row[colMap.email] || '') : '',
      business_name: colMap.business_name >= 0 ? (row[colMap.business_name] || 'نشاط تجاري') : 'نشاط تجاري',
      website_type: siteType,
      budget: colMap.budget >= 0 ? (Number(row[colMap.budget]) || 12000) : 12000,
      deal_value: colMap.budget >= 0 ? (Number(row[colMap.budget]) || 12000) : 12000,
      campaign_name: colMap.campaign_name >= 0 ? (row[colMap.campaign_name] || 'استيراد حملات ميتا') : 'استيراد حملات ميتا',
      ad_source: 'meta_form',
      priority: 'medium',
      stage: 'new'
    });
  }

  state.parsedCsvLeads = parsed;

  const previewBox = document.getElementById('csvPreviewBox');
  const previewTbody = document.getElementById('csvPreviewTableBody');
  const countBadge = document.getElementById('csvParsedCount');
  const executeBtn = document.getElementById('btnExecuteImport');

  if (parsed.length > 0) {
    countBadge.textContent = parsed.length;
    previewTbody.innerHTML = '';

    parsed.slice(0, 5).forEach((p) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(p.name)}</td>
        <td class="text-mono">${escapeHtml(p.phone)}</td>
        <td>${escapeHtml(p.business_name)}</td>
        <td>${WEBSITE_TYPES[p.website_type] || p.website_type}</td>
        <td>${formatCurrency(p.budget)}</td>
        <td>${escapeHtml(p.campaign_name)}</td>
      `;
      previewTbody.appendChild(tr);
    });

    previewBox.classList.remove('hidden');
    executeBtn.disabled = false;
  } else {
    previewBox.classList.add('hidden');
    executeBtn.disabled = true;
  }
}

function parseCsvLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

// ============================================================================
// Quick Contacted Action
// ============================================================================
async function handleQuickContacted(leadId) {
  try {
    const lead = state.leads.find((l) => l.id === leadId) || (state.selectedLead && state.selectedLead.id === leadId ? state.selectedLead : null);
    if (!lead) return;

    const updates = {
      last_contacted_at: new Date().toISOString()
    };

    // If still in 'new' stage, automatically advance to 'contacted'
    if (lead.stage === 'new') {
      updates.stage = 'contacted';
    }

    await apiUpdateLead(leadId, updates);

    // Document activity in timeline
    await apiAddActivity(leadId, {
      type: 'call',
      summary: updates.stage === 'contacted'
        ? 'تم تسجيل التواصل مع العميل بنجاح ونقله إلى مرحلة التواصل المبدئي'
        : 'تم تسجيل التواصل مع العميل وتحديث تاريخ آخر تواصل'
    });

    showToast(`تم تسجيل التواصل مع ${lead.name} بنجاح! 📞`, 'success');
    await refreshData();

    // If drawer is open for this lead, refresh its content
    if (state.selectedLead && state.selectedLead.id === leadId) {
      const fresh = await apiGetLead(leadId);
      state.selectedLead = fresh.lead;
      state.selectedLeadActivities = fresh.activities || [];
      renderDrawerHeader(fresh.lead);
      renderStageStepper(fresh.lead.stage);
      renderActivityTimeline(state.selectedLeadActivities);
      populateLeadSpecs(fresh.lead);
    }
  } catch (err) {
    console.error('Error in handleQuickContacted:', err);
    showToast('حدث خطأ أثناء تسجيل التواصل: ' + (err.message || ''), 'error');
  }
}

// ============================================================================
// Export Leads to Excel (CSV with UTF-8 BOM)
// ============================================================================
function exportLeadsToExcel() {
  const leads = state.leads && state.leads.length > 0 ? state.leads : [];
  if (leads.length === 0) {
    showToast('لا توجد بيانات عملاء لتصديرها', 'warning');
    return;
  }

  const headers = [
    'م',
    'اسم العميل',
    'رقم الهاتف / الواتساب',
    'يوزر / اسم الحساب',
    'البريد الإلكتروني',
    'اسم النشاط التجاري',
    'نوع الموقع المطلوب',
    'المرحلة الحالية',
    'أولوية المتابعة',
    'مصدر الإعلان',
    'اسم الحملة الإعلانية',
    'الميزانية التقديرية (ج.م)',
    'قيمة الصفقة (ج.م)',
    'العربون المدفوع (ج.م)',
    'المبلغ المتبقي (ج.م)',
    'موعد المتابعة القادم',
    'تاريخ آخر تواصل',
    'الملاحظات',
    'تاريخ التسجيل'
  ];

  const formatCsvCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = leads.map((lead, index) => {
    const siteLabel = WEBSITE_TYPES[lead.website_type] || lead.website_type || 'غير محدد';
    const stageLabel = (STAGES[lead.stage] && STAGES[lead.stage].label) || lead.stage || '';
    const priorityLabel = (PRIORITIES[lead.priority] && PRIORITIES[lead.priority].label) || lead.priority || '';
    const sourceLabel = AD_SOURCES[lead.ad_source] || lead.ad_source || '';
    const dealVal = Number(lead.deal_value || lead.budget || 0);
    const deposit = Number(lead.deposit_paid || 0);
    const remaining = Math.max(0, dealVal - deposit);

    const parsedFollowup = parseFollowupDate(lead.next_followup_at);
    const followupStr = parsedFollowup
      ? parsedFollowup.toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })
      : '';
    const contactedStr = lead.last_contacted_at
      ? new Date(lead.last_contacted_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })
      : '';
    const createdStr = lead.created_at
      ? new Date(lead.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })
      : '';

    return [
      index + 1,
      formatCsvCell(lead.name),
      formatCsvCell(lead.phone ? `'${lead.phone}` : ''),
      formatCsvCell(lead.social_handle || ''),
      formatCsvCell(lead.email || ''),
      formatCsvCell(lead.business_name || ''),
      formatCsvCell(siteLabel),
      formatCsvCell(stageLabel),
      formatCsvCell(priorityLabel),
      formatCsvCell(sourceLabel),
      formatCsvCell(lead.campaign_name || ''),
      dealVal,
      dealVal,
      deposit,
      remaining,
      formatCsvCell(followupStr),
      formatCsvCell(contactedStr),
      formatCsvCell(lead.notes || ''),
      formatCsvCell(createdStr)
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.map((h) => `"${h}"`).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `AmirCRM_Leads_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`تم تصدير ${leads.length} عميل إلى ملف Excel بنجاح! 📊`, 'success');
}

// ============================================================================
// Event Listeners & Initialization
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  refreshData();
});

function initEventListeners() {
  // Navigation Tabs
  document.getElementById('navKanban').addEventListener('click', () => switchMainView('kanban'));
  document.getElementById('navTable').addEventListener('click', () => switchMainView('table'));
  document.getElementById('navAnalytics').addEventListener('click', () => switchMainView('analytics'));

  // View Switcher Buttons
  document.querySelectorAll('.view-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchMainView(btn.dataset.view));
  });

  // Mobile Sidebar Toggle
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('mobile-open');
  });

  // Search Input with Debounce
  let searchTimeout = null;
  const searchInput = document.getElementById('searchInput');
  const btnClearSearch = document.getElementById('btnClearSearch');

  searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    btnClearSearch.classList.toggle('hidden', !val);

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.filters.search = val;
      refreshData();
    }, 250);
  });

  btnClearSearch.addEventListener('click', () => {
    searchInput.value = '';
    btnClearSearch.classList.add('hidden');
    state.filters.search = '';
    refreshData();
  });

  // Filters Dropdowns
  document.getElementById('filterStage')?.addEventListener('change', (e) => {
    state.filters.stage = e.target.value;
    refreshData();
  });

  document.getElementById('filterCampaign')?.addEventListener('change', (e) => {
    state.filters.campaign = e.target.value;
    refreshData();
  });

  document.getElementById('filterWebsiteType')?.addEventListener('change', (e) => {
    state.filters.website_type = e.target.value;
    refreshData();
  });

  document.getElementById('filterPriority')?.addEventListener('change', (e) => {
    state.filters.priority = e.target.value;
    refreshData();
  });

  document.getElementById('filterAdSource')?.addEventListener('change', (e) => {
    state.filters.ad_source = e.target.value;
    refreshData();
  });

  // Follow-up Filters: Overdue & Today
  const btnToggleOverdue = document.getElementById('btnToggleOverdueFollowups');
  btnToggleOverdue?.addEventListener('click', () => {
    if (state.filters.followup === 'overdue') {
      state.filters.followup = '';
    } else {
      state.filters.followup = 'overdue';
    }
    refreshData();
  });

  const btnToggleDue = document.getElementById('btnToggleDueFollowups');
  btnToggleDue?.addEventListener('click', () => {
    if (state.filters.followup === 'today') {
      state.filters.followup = '';
    } else {
      state.filters.followup = 'today';
    }
    refreshData();
  });

  document.getElementById('kpiFollowupCard')?.addEventListener('click', () => {
    if (state.filters.followup) {
      state.filters.followup = '';
    } else {
      if ((state.analytics?.overdue_followups_count || 0) > 0) {
        state.filters.followup = 'overdue';
      } else {
        state.filters.followup = 'today';
      }
    }
    refreshData();
  });

  // Reset Filters
  document.getElementById('btnResetFilters')?.addEventListener('click', () => {
    state.filters = { search: '', stage: '', campaign: '', website_type: '', priority: '', ad_source: '', followup: '' };
    searchInput.value = '';
    btnClearSearch.classList.add('hidden');
    if (document.getElementById('filterStage')) document.getElementById('filterStage').value = '';
    if (document.getElementById('filterCampaign')) document.getElementById('filterCampaign').value = '';
    if (document.getElementById('filterWebsiteType')) document.getElementById('filterWebsiteType').value = '';
    if (document.getElementById('filterPriority')) document.getElementById('filterPriority').value = '';
    if (document.getElementById('filterAdSource')) document.getElementById('filterAdSource').value = '';
    btnToggleDue?.classList.remove('active');
    btnToggleOverdue?.classList.remove('active');
    refreshData();
  });

  // Export Leads to Excel
  document.getElementById('btnExportExcel')?.addEventListener('click', () => {
    exportLeadsToExcel();
  });

  // Webhook Meta Simulator
  document.getElementById('btnSimulateMeta')?.addEventListener('click', async () => {
    try {
      const result = await apiSimulateMetaLead();
      const lead = result.lead;
      showToast(`⚡ ليد جديد من ميتا: ${lead.name} (${lead.business_name || 'بدون اسم'})!`, 'info');
      await refreshData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Setup Live Duplicate Warnings
  setupLiveDuplicateCheck('newLeadPhone', 'newLeadSocial', 'newLeadPhoneWarning', 'newLeadSocialWarning');
  setupLiveDuplicateCheck('editPhone', 'editSocialHandle', 'editPhoneWarning', 'editSocialWarning', () => document.getElementById('editLeadId')?.value);

  // New Lead Modal Trigger (opens form ONLY without touching or opening existing drawer)
  document.getElementById('btnOpenNewLeadModal')?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeLeadDrawer();
    document.getElementById('newLeadForm').reset();
    const pWarn = document.getElementById('newLeadPhoneWarning');
    const sWarn = document.getElementById('newLeadSocialWarning');
    if (pWarn) pWarn.classList.add('hidden');
    if (sWarn) sWarn.classList.add('hidden');
    document.getElementById('newLeadModalOverlay').classList.add('active');
  });

  document.getElementById('btnCloseNewLeadModal')?.addEventListener('click', () => {
    document.getElementById('newLeadModalOverlay').classList.remove('active');
  });

  document.getElementById('btnCancelNewLead')?.addEventListener('click', () => {
    document.getElementById('newLeadModalOverlay').classList.remove('active');
  });

  // Submit New Lead
  document.getElementById('newLeadForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('newLeadName').value.trim(),
      phone: document.getElementById('newLeadPhone').value.trim(),
      social_handle: document.getElementById('newLeadSocial')?.value.trim() || '',
      email: document.getElementById('newLeadEmail').value.trim(),
      business_name: document.getElementById('newLeadBusiness').value.trim(),
      website_type: document.getElementById('newLeadWebsiteType').value,
      stage: document.getElementById('newLeadStage').value,
      priority: document.getElementById('newLeadPriority').value,
      ad_source: document.getElementById('newLeadSource').value,
      campaign_name: document.getElementById('newLeadCampaign').value.trim(),
      budget: Number(document.getElementById('newLeadBudget').value) || 0,
      deal_value: Number(document.getElementById('newLeadDealValue').value) || 0,
      next_followup_at: toDateTimeLocalValue(document.getElementById('newLeadNextFollowup').value) || null,
      notes: document.getElementById('newLeadNotes').value.trim()
    };

    // Prevent duplicate: check before saving
    if (!state.skipDuplicateCheck) {
      const dup = findDuplicateLead(payload.phone, payload.social_handle);
      if (dup) {
        showDuplicateModal(dup, () => {
          state.skipDuplicateCheck = true;
          document.getElementById('newLeadForm').dispatchEvent(new Event('submit'));
        });
        return;
      }
    }
    state.skipDuplicateCheck = false;

    try {
      const res = await apiCreateLead(payload);
      showToast(`تم إضافة العميل (${res.lead.name}) بنجاح! 🎉`);
      document.getElementById('newLeadModalOverlay').classList.remove('active');
      await refreshData();
      // DO NOT automatically open drawer, per user request
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // CSV Modal Triggers
  const csvModal = document.getElementById('csvModalOverlay');
  document.getElementById('btnOpenCsvModal').addEventListener('click', () => {
    csvModal.classList.add('active');
    state.parsedCsvLeads = [];
    document.getElementById('csvRawText').value = '';
    document.getElementById('csvPreviewBox').classList.add('hidden');
    document.getElementById('btnExecuteImport').disabled = true;
  });

  document.getElementById('btnCloseCsvModal').addEventListener('click', () => {
    csvModal.classList.remove('active');
  });

  document.getElementById('btnCancelCsv').addEventListener('click', () => {
    csvModal.classList.remove('active');
  });

  // CSV Textarea input
  document.getElementById('csvRawText').addEventListener('input', (e) => {
    handleCsvText(e.target.value);
  });

  // CSV Sample button
  document.getElementById('btnFillSampleCsv').addEventListener('click', () => {
    const sample = `name,phone,email,business_name,website_type,budget,campaign_name
د. شريف عبد المنعم,201099887766,dr.sherif@example.com,مركز النور لطب وجراحة العيون,corporate,18000,حملة الأطباء والمراكز الطبية - ميتا
سارة الخالدي,201155443322,sara@elegance.com,بوتيك إيليجانس للأزياء,ecommerce,22000,حملة المتاجر الإلكترونية الصيفية
كابتن طارق يوسف,201233445566,tarek@fitacademy.com,أكاديمية فيت للياقة,booking,14000,حملة النوادي والأكاديميات الرياضية`;
    document.getElementById('csvRawText').value = sample;
    handleCsvText(sample);
  });

  // CSV Dropzone
  const dropzone = document.getElementById('csvDropzone');
  const fileInput = document.getElementById('csvFileInput');

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      readCsvFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      readCsvFile(e.target.files[0]);
    }
  });

  function readCsvFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('csvRawText').value = e.target.result;
      handleCsvText(e.target.result);
    };
    reader.readAsText(file, 'UTF-8');
  }

  // Execute CSV Import
  document.getElementById('btnExecuteImport').addEventListener('click', async () => {
    if (!state.parsedCsvLeads || state.parsedCsvLeads.length === 0) return;

    try {
      const res = await apiImportLeads(state.parsedCsvLeads);
      showToast(`تم استيراد ${res.imported || state.parsedCsvLeads.length} عميل بنجاح! 🎉`);
      csvModal.classList.remove('active');
      await refreshData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Drawer Close Button & Overlay Click
  document.getElementById('btnCloseDrawer').addEventListener('click', closeLeadDrawer);
  document.getElementById('drawerOverlay').addEventListener('click', closeLeadDrawer);

  // Drawer Tabs Click
  document.querySelectorAll('.drawer-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      switchDrawerTab(tab.dataset.drawerTab);
    });
  });

  // Stage Stepper Buttons inside Drawer
  document.querySelectorAll('.step-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!state.selectedLead) return;
      const targetStep = btn.dataset.step;
      requestStageTransition(state.selectedLead.id, targetStep);
    });
  });

  // Quick Contacted Button in Drawer Header
  document.getElementById('btnDrawerQuickContact')?.addEventListener('click', async () => {
    if (state.selectedLead) {
      await handleQuickContacted(state.selectedLead.id);
    }
  });

  // Quick Won / Lost Buttons in Drawer Header
  document.getElementById('btnQuickWon').addEventListener('click', () => {
    if (state.selectedLead) requestStageTransition(state.selectedLead.id, 'won');
  });

  document.getElementById('btnQuickLost').addEventListener('click', () => {
    if (state.selectedLead) requestStageTransition(state.selectedLead.id, 'lost');
  });

  // Save Lead Specs Form
  document.getElementById('drawerLeadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editLeadId').value;
    if (!id) return;

    const reqChecked = Array.from(
      document.querySelectorAll('#requirementsChips input[name="requirements"]:checked')
    ).map((cb) => cb.value);

    const payload = {
      name: document.getElementById('editName').value.trim(),
      phone: document.getElementById('editPhone').value.trim(),
      social_handle: document.getElementById('editSocialHandle')?.value.trim() || '',
      email: document.getElementById('editEmail').value.trim(),
      business_name: document.getElementById('editBusinessName').value.trim(),
      website_type: document.getElementById('editWebsiteType').value,
      stage: document.getElementById('editStage').value,
      priority: document.getElementById('editPriority').value,
      ad_source: document.getElementById('editAdSource').value,
      campaign_name: document.getElementById('editCampaignName').value.trim(),
      budget: Number(document.getElementById('editBudget').value) || 0,
      deal_value: Number(document.getElementById('editDealValue').value) || 0,
      deposit_paid: Number(document.getElementById('editDepositPaid').value) || 0,
      next_followup_at: toDateTimeLocalValue(document.getElementById('editNextFollowup').value) || null,
      requirements: reqChecked,
      notes: document.getElementById('editNotes').value.trim()
    };

    // Duplicate check for edited lead
    if (!state.skipDuplicateCheck) {
      const dup = findDuplicateLead(payload.phone, payload.social_handle, id);
      if (dup) {
        showDuplicateModal(dup, () => {
          state.skipDuplicateCheck = true;
          document.getElementById('drawerLeadForm').dispatchEvent(new Event('submit'));
        });
        return;
      }
    }
    state.skipDuplicateCheck = false;

    try {
      const res = await apiUpdateLead(id, payload);
      state.selectedLead = res.lead;
      renderDrawerHeader(res.lead);
      renderStageStepper(res.lead.stage);
      showToast('تم حفظ التعديلات بنجاح! 💾');
      await refreshData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Delete Lead Modal Setup (No native browser alerts)
  const deleteModal = document.getElementById('deleteConfirmModalOverlay');
  document.getElementById('btnDeleteLead')?.addEventListener('click', () => {
    if (!state.selectedLead) return;
    const nameEl = document.getElementById('deleteTargetClientName');
    if (nameEl) nameEl.textContent = state.selectedLead.name;
    deleteModal?.classList.add('active');
  });

  document.getElementById('btnCloseDeleteModal')?.addEventListener('click', () => {
    deleteModal?.classList.remove('active');
  });

  document.getElementById('btnCancelDeleteModal')?.addEventListener('click', () => {
    deleteModal?.classList.remove('active');
  });

  document.getElementById('btnConfirmDeleteAction')?.addEventListener('click', async () => {
    if (!state.selectedLead) return;
    const leadId = state.selectedLead.id;
    const leadName = state.selectedLead.name;
    deleteModal?.classList.remove('active');

    try {
      await apiDeleteLead(leadId);
      showToast(`تم حذف العميل (${leadName}) بنجاح`);
      closeLeadDrawer();
      await refreshData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Duplicate Warning Modal Actions
  const dupModal = document.getElementById('duplicateWarningModalOverlay');
  document.getElementById('btnCloseDuplicateModal')?.addEventListener('click', () => {
    dupModal?.classList.remove('active');
    pendingDuplicateSaveCallback = null;
  });
  document.getElementById('btnCancelDuplicateSave')?.addEventListener('click', () => {
    dupModal?.classList.remove('active');
    pendingDuplicateSaveCallback = null;
  });
  document.getElementById('btnConfirmDuplicateSave')?.addEventListener('click', () => {
    dupModal?.classList.remove('active');
    if (typeof pendingDuplicateSaveCallback === 'function') {
      const cb = pendingDuplicateSaveCallback;
      pendingDuplicateSaveCallback = null;
      cb();
    }
  });

  // WhatsApp Closer Script Tabs
  document.querySelectorAll('.script-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      state.activeScriptId = pill.dataset.scriptId;
      updateWhatsAppCloserScript();
    });
  });

  // Copy WhatsApp Message
  document.getElementById('btnCopyWhatsappMsg').addEventListener('click', async () => {
    const text = document.getElementById('whatsappMessageContent').value;
    try {
      await navigator.clipboard.writeText(text);
      showToast('تم نسخ نص الرسالة إلى الحافظة! 📋');
    } catch (e) {
      // fallback
      const ta = document.getElementById('whatsappMessageContent');
      ta.select();
      document.execCommand('copy');
      showToast('تم نسخ نص الرسالة! 📋');
    }
  });

  // Direct Send WhatsApp Button
  document.getElementById('btnSendWhatsappDirect').addEventListener('click', () => {
    sendWhatsAppMessageAndLog();
  });

  // Calculator Inputs Changed
  document.querySelectorAll('input[name="calc_base_type"]').forEach((r) => {
    r.addEventListener('change', recalculateQuote);
  });

  document.querySelectorAll('.calc-addon').forEach((chk) => {
    chk.addEventListener('change', recalculateQuote);
  });

  document.getElementById('btnApplyQuoteToLead').addEventListener('click', applyQuoteToLead);

  // Submit Activity Form
  document.getElementById('addActivityForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.selectedLead) return;

    const type = document.getElementById('activityType').value;
    const summary = document.getElementById('activitySummary').value.trim();
    const followupDate = toDateTimeLocalValue(document.getElementById('activityFollowupDate').value);

    const payload = {
      type,
      summary
    };
    if (followupDate) payload.next_followup_at = followupDate;

    try {
      await apiAddActivity(state.selectedLead.id, payload);
      showToast('تم توثيق النشاط بنجاح! 📋');
      document.getElementById('activitySummary').value = '';
      document.getElementById('activityFollowupDate').value = '';

      // Refresh lead details and timeline
      const fresh = await apiGetLead(state.selectedLead.id);
      state.selectedLead = fresh.lead;
      state.selectedLeadActivities = fresh.activities || [];
      renderActivityTimeline(state.selectedLeadActivities);
      populateLeadSpecs(state.selectedLead);
      refreshData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Won Modal Form
  const wonModal = document.getElementById('wonModalOverlay');
  document.getElementById('btnCloseWonModal').addEventListener('click', () => wonModal.classList.remove('active'));
  document.getElementById('btnCancelWon').addEventListener('click', () => wonModal.classList.remove('active'));

  document.getElementById('wonForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.pendingStageChange) return;

    const { leadId } = state.pendingStageChange;
    const deposit = Number(document.getElementById('wonDepositAmount').value) || 0;
    const note = document.getElementById('wonPaymentNote').value.trim();

    wonModal.classList.remove('active');
    await executeStageTransition(leadId, 'won', note, deposit);
    state.pendingStageChange = null;
  });

  // Lost Modal Form
  const lostModal = document.getElementById('lostModalOverlay');
  document.getElementById('btnCloseLostModal').addEventListener('click', () => lostModal.classList.remove('active'));
  document.getElementById('btnCancelLost').addEventListener('click', () => lostModal.classList.remove('active'));

  document.getElementById('lostForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.pendingStageChange) return;

    const { leadId } = state.pendingStageChange;
    const selectReason = document.getElementById('lostReasonSelect').value;
    const customReason = document.getElementById('lostCustomReason').value.trim();
    const finalReason = customReason ? `${selectReason} (${customReason})` : selectReason;

    lostModal.classList.remove('active');
    await executeStageTransition(leadId, 'lost', finalReason);
    state.pendingStageChange = null;
  });
}

// ============================================================================
// Main View Switcher
// ============================================================================
function switchMainView(viewId) {
  state.currentView = viewId;

  // Sidebar navigation
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.view === viewId);
  });

  // View buttons
  document.querySelectorAll('.view-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === viewId);
  });

  // View Panes
  document.querySelectorAll('.view-pane').forEach((pane) => {
    pane.classList.remove('active');
  });

  const targetPane = document.getElementById(`view${capitalize(viewId)}`);
  if (targetPane) targetPane.classList.add('active');

  // Page title
  const pageTitle = document.getElementById('pageTitle');
  if (viewId === 'kanban') {
    pageTitle.textContent = 'لوحة مبيعات ومتابعة العملاء';
  } else if (viewId === 'table') {
    pageTitle.textContent = 'جدول بيانات العملاء والطلبات';
  } else if (viewId === 'analytics') {
    pageTitle.textContent = 'تحليلات حملات ميتا وقمع المبيعات';
  }

  // Close mobile sidebar if open
  document.getElementById('sidebar').classList.remove('mobile-open');

  refreshData();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
