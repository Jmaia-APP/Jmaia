// =======================
// التنقل بين الخطوات
// =======================
const steps = document.querySelectorAll('.step');
const indicators = document.querySelectorAll('.step-indicator');

function showStep(idx) {
  steps.forEach((s, i) => {
    s.classList.toggle('hidden', i !== idx);
    if (indicators[i]) indicators[i].classList.toggle('active', i === idx);
  });
  const firstInteractive = steps[idx]?.querySelector('input, select, textarea, button');
  if (firstInteractive) firstInteractive.focus({ preventScroll: false });
}

document.getElementById('to-step-1')?.addEventListener('click', () => showStep(1));
document.getElementById('to-step-2')?.addEventListener('click', () => showStep(2));
document.getElementById('to-step-3')?.addEventListener('click', () => showStep(3));

indicators.forEach(ind => {
  ind.addEventListener('click', () => {
    const i = parseInt(ind.getAttribute('data-step'));
    showStep(i);
  });
});

document.querySelectorAll('[data-step-back]').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = parseInt(btn.getAttribute('data-step-back'));
    showStep(target);
  });
});

// =======================
/* منطق خطوة الشروط (الخطوة 0) */
// =======================
const termsBox = document.getElementById('terms-box');
const scrollHint = document.getElementById('scroll-hint');
const agreeTerms = document.getElementById('agree-terms');
const agreePrivacy = document.getElementById('agree-privacy');
const nextFromTermsBtn = document.getElementById('to-step-1'); // زر التالي من الشروط
const submitBtn = document.getElementById('submit-btn');       // زر تسجيل في الخطوة الأخيرة

let scrolledToEnd = termsBox ? false : true;

function setCheckboxesEnabled(enabled) {
  if (agreeTerms) agreeTerms.disabled = !enabled;
  if (agreePrivacy) agreePrivacy.disabled = !enabled;
}

function termsAccepted() {
  const okTerms =
    (agreeTerms ? agreeTerms.checked : true) &&
    (agreePrivacy ? agreePrivacy.checked : true);
  return scrolledToEnd && okTerms;
}

function updateButtonsState() {
  // تفعيل/تعطيل زر "التالي" في خطوة الشروط
  if (nextFromTermsBtn) nextFromTermsBtn.disabled = !termsAccepted();

  // لأمان إضافي: ممكن أيضًا منع التسجيل إن لم تكن الشروط مقبولة
  if (submitBtn) submitBtn.disabled = !termsAccepted();
}

// فعّل مباشرة إذا لم يكن قابلاً للتمرير
function enableIfNotScrollable() {
  if (!termsBox) return;
  const isScrollable = termsBox.scrollHeight - termsBox.clientHeight > 2;
  if (!isScrollable) {
    scrolledToEnd = true;
    setCheckboxesEnabled(true);
    if (scrollHint) scrollHint.textContent = 'المحتوى قصير ✅ يمكنك الآن تفعيل الموافقة';
    updateButtonsState();
  }
}

// راقب الوصول للنهاية باستخدام Sentinel + IntersectionObserver
function setupBottomObserver() {
  if (!termsBox) return;

  // عنصر خفي في نهاية الصندوق
  let sentinel = termsBox.querySelector('[data-bottom-sentinel]');
  if (!sentinel) {
    sentinel = document.createElement('div');
    sentinel.setAttribute('data-bottom-sentinel', '1');
    sentinel.style.height = '1px';
    sentinel.style.width = '100%';
    termsBox.appendChild(sentinel);
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !scrolledToEnd) {
          scrolledToEnd = true;
          setCheckboxesEnabled(true);
          if (scrollHint) scrollHint.textContent = 'تم الوصول إلى نهاية المحتوى ✅ يمكنك الآن تفعيل الموافقة';
          updateButtonsState();
        }
      });
    },
    { root: termsBox, threshold: 0.99 }
  );
  io.observe(sentinel);

  // احتياط: تحقّق بالتمرير التقليدي مع سماحية
  termsBox.addEventListener('scroll', () => {
    const atEnd = termsBox.scrollTop + termsBox.clientHeight >= termsBox.scrollHeight - 12;
    if (atEnd && !scrolledToEnd) {
      scrolledToEnd = true;
      setCheckboxesEnabled(true);
      if (scrollHint) scrollHint.textContent = 'تم الوصول إلى نهاية المحتوى ✅ يمكنك الآن تفعيل الموافقة';
      updateButtonsState();
    }
  });

  // إعادة التقييم عند تغيّر الحجم/الخط
  const ro = new ResizeObserver(() => enableIfNotScrollable());
  ro.observe(termsBox);
}

agreeTerms?.addEventListener('change', updateButtonsState);
agreePrivacy?.addEventListener('change', updateButtonsState);

// =======================
// ربط النموذج بالـ API
// =======================
document.getElementById('register-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  const errorEl = document.getElementById('register-error');
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.add('hidden');
  }

  const fullName = this.querySelector('[name="fullName"]').value.trim();
  const phone = this.querySelector('[name="phone"]').value.trim();
  const email = this.querySelector('[name="email"]').value.trim();
  const nationalId = this.querySelector('[name="nationalId"]').value.trim();
  const password = this.querySelector('[name="password"]').value;

  // يجب إدخال البريد أو رقم الهوية
  if (!email && !nationalId) {
    const msg = "يجب إدخال البريد الإلكتروني أو رقم البطاقة الوطنية";
    if (errorEl) { errorEl.textContent = msg; errorEl.classList.remove('hidden'); } else { alert(msg); }
    showStep(2); // البريد/الهاتف
    return;
  }

  // منع الإرسال حتى استيفاء الشروط
  if (termsBox && !termsAccepted()) {
    const msg = 'يرجى قراءة الشروط حتى النهاية والموافقة على البنود قبل إتمام التسجيل.';
    if (errorEl) { errorEl.textContent = msg; errorEl.classList.remove('hidden'); } else { alert(msg); }
    showStep(0);
    return;
  }

  // تحقق بسيط
  if (phone && !/^\d{10,15}$/.test(phone)) {
    const msg = 'يرجى إدخال رقم هاتف صحيح (10–15 رقم).';
    if (errorEl) { errorEl.textContent = msg; errorEl.classList.remove('hidden'); } else { alert(msg); }
    showStep(2);
    return;
  }
  if (password.length < 8) {
    const msg = 'كلمة المرور يجب أن تكون 8 أحرف/أرقام على الأقل.';
    if (errorEl) { errorEl.textContent = msg; errorEl.classList.remove('hidden'); } else { alert(msg); }
    showStep(3);
    return;
  }

  const acceptedTerms = !!(agreeTerms?.checked && agreePrivacy?.checked);

  try {
    const res = await fetch('https://api.technologytanda.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, phone, email, nationalId, password, acceptedTerms })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'فشل التسجيل');
    alert('✅ تم التسجيل بنجاح');
    window.location.href = 'login.html';
  } catch (err) {
    const msg = err.message || 'حدث خطأ غير متوقع';
    if (errorEl) { errorEl.textContent = msg; errorEl.classList.remove('hidden'); } else { alert(msg); }
  }
});

// بدء على الخطوة الأولى (الشروط) وضبط المنطق
showStep(0);
setupBottomObserver();
enableIfNotScrollable();
updateButtonsState();
