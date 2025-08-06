// Helpers
function formatDate(dateString) {
  const date = new Date(dateString);
  const months = [
    'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatAmount(amount) {
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} <img src="./Assets/imgs/riyal.svg" alt="ر.س" class="inline w-4 h-4 align-text-bottom" />`;
}

// State
let turns = [];
let tabs = { early: [], middle: [], late: [] };
let selectedTab = 'early';
let selectedTurnId = null;
let association = null;

// DOM
const turnsGrid = document.getElementById('turnsGrid');
const durationEl = document.getElementById('duration');
const monthlyFeeEl = document.getElementById('monthlyFee');
const totalFeeEl = document.getElementById('totalFee');
const nextBtn = document.getElementById('nextBtn');

// Modal logic
function showModal(message, onConfirm, onCancel) {
  const modal = document.getElementById('customModal');
  const msg = document.getElementById('modalMessage');
  const confirmBtn = document.getElementById('modalConfirm');
  const cancelBtn = document.getElementById('modalCancel');
  msg.textContent = message;
  modal.classList.remove('hidden');
  function cleanup() {
    modal.classList.add('hidden');
    confirmBtn.removeEventListener('click', confirmHandler);
    cancelBtn.removeEventListener('click', cancelHandler);
  }
  function confirmHandler() {
    cleanup();
    if (onConfirm) onConfirm();
  }
  function cancelHandler() {
    cleanup();
    if (onCancel) onCancel();
  }
  confirmBtn.addEventListener('click', confirmHandler);
  cancelBtn.addEventListener('click', cancelHandler);
}

// جلب البيانات من الـ API
async function fetchTurns() {
  const associationId = localStorage.getItem('selectedAssociationId');
  const token = localStorage.getItem('token');
  if (!associationId) {
    showModal('لم يتم اختيار جمعية! سيتم إعادتك للصفحة الرئيسية.', () => { window.location.href = 'home.html'; });
    return;
  }
  if (!token) {
    showModal('يجب تسجيل الدخول أولاً', () => { window.location.href = 'login.html'; });
    return;
  }
  try {
    const res = await fetch(`https://api.technologytanda.com/api/turns/public/${associationId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) {
      throw new Error('Network response was not ok: ' + res.status);
    }
    const data = await res.json();
    if (!Array.isArray(data.turns)) {
      throw new Error('البيانات المستلمة لا تحتوي على مصفوفة أدوار');
    }
    turns = data.turns;
    if (turns.length === 0) throw new Error('لا يوجد أدوار متاحة');
    association = turns[0].association;

    // تقسيم التابات أولاً
    splitTabs();

    // !!! NO feeAmount calculation here !!!
    // feeAmount is used directly from backend

    renderTabs();
    renderTurns();
    renderSummary();
  } catch (e) {
    console.error('تفاصيل الخطأ:', e);
    showModal('خطأ في تحميل الأدوار');
  }
}

function splitTabs() {
  const n = turns.length;
  const perTab = Math.ceil(n / 3);
  tabs.early = turns.slice(0, perTab);
  tabs.middle = turns.slice(perTab, perTab * 2);
  tabs.late = turns.slice(perTab * 2);
}

// Helper to get percent for each turn
function getTurnPercent(turn) {
  // Can compare to monthlyAmount or totalAmount
  const totalAmount = association.monthlyAmount * turns.length;
  let percent = Math.abs(turn.feeAmount) / totalAmount * 100;
  // Optional: round to nearest integer for display
  return Math.round(percent);
}

// Helper to get discount/cashback text
function getTurnType(turn) {
  if (turn.feeAmount < 0) return 'كاش باك';
  else if (turn.feeAmount > 0) return 'رسوم الاشتراك';
  else return 'بدون رسوم';
}

function renderTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tab === selectedTab) btn.classList.add('active');
  });
}

function renderTurns() {
  turnsGrid.innerHTML = '';
  tabs[selectedTab].forEach(turn => {
    let percentText = '';
    // Only show percent if not zero fee
    if (turn.feeAmount !== 0) {
      percentText = ` (${getTurnPercent(turn)}%)`;
    }
    let turnType = getTurnType(turn);
    let isCashback = turn.feeAmount < 0;

    const card = document.createElement('div');
    card.className = `turn-card border-2 rounded-xl p-3 flex flex-col gap-1 cursor-pointer relative transition ${turn.taken ? 'taken border-gray-300 bg-gray-100' : 'border-teal-400 bg-white'}`;
    card.dataset.id = turn.id;
    if (turn.taken) card.classList.add('pointer-events-none');
    if (selectedTurnId === turn.id) card.classList.add('selected');
    card.innerHTML = `
      <div class="flex items-center gap-2 mb-1">
        <input type="radio" name="turn" value="${turn.id}" ${turn.taken ? 'disabled' : ''} ${selectedTurnId === turn.id ? 'checked' : ''} class="accent-teal-500">
        <span class="font-bold">${turn.turnName}</span>
      </div>
      <div class="text-xs text-gray-500 mb-1">${formatDate(turn.scheduledDate)}</div>
      <div class="text-sm font-bold ${isCashback ? 'text-green-700' : 'text-red-700'}">
        ${
          turn.feeAmount !== 0
            ? (isCashback
                ? formatAmount(Math.abs(turn.feeAmount)) + ' كاش باك' + percentText
                : formatAmount(Math.abs(turn.feeAmount)) + ' رسوم الاشتراك' + percentText)
            : 'بدون رسوم'
        }
      </div>
      ${turn.taken ? `<div class="absolute top-2 left-2 flex items-center gap-1 text-xs lock"><svg xmlns="http://www.w3.org/2000/svg" class="inline w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm6-10V7a4 4 0 10-8 0v2" /></svg> غير متاح</div>` 
        : `<button class="lock-btn mt-3 px-3 py-1 rounded bg-green-600 text-white font-bold w-full">احجز الدور</button>`
      }
    `;
    if (!turn.taken) {
      card.addEventListener('click', () => {
        selectedTurnId = turn.id;
        nextBtn.disabled = false;
        renderTurns();
        renderSummary();
        storeTurnNumber(turn.turnName);
      });

      setTimeout(() => {
        const lockBtn = card.querySelector('.lock-btn');
        if (lockBtn) {
          lockBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            showModal('هل أنت متأكد أنك تريد اختيار هذا الدور؟', () => {
              window.location.href = 'upload.html';
            });
          });
        }
      }, 0);
    }
    turnsGrid.appendChild(card);
  });
}

function renderSummary() {
  if (!association) return;

  // إجمالي مدة الجمعية
  durationEl.textContent = turns.length + ' شهور';
  // مبلغ القسط الشهري
  monthlyFeeEl.innerHTML = formatAmount(association.monthlyAmount);

  // الدور المحدد حالياً
  const selectedTurn = turns.find(t => t.id === selectedTurnId);

  // احصل على رسوم العقد (قد تكون صفر إذا غير موجودة)
  const contractFee = association.contractDeliveryFee || 0;

  // رسوم الدور كما أرسلت من السيرفر
  document.getElementById('Fee').innerHTML = selectedTurn
    ? formatAmount(selectedTurn.feeAmount)
    : '-';

  // المبلغ المجمع (الكل دفع)
  let total = association.monthlyAmount * turns.length;

  // حساب المبلغ النهائي بعد خصم رسوم الدور ورسوم العقد
  if (selectedTurn) {
    // دائماً اطرح رسوم الدور (إذا كانت سالبة تضيف للمبلغ - كاش باك)
    // دائماً اطرح رسوم العقد
    total = total - selectedTurn.feeAmount - contractFee;
  }

  // عرض المبلغ النهائي
  totalFeeEl.innerHTML = selectedTurn
    ? formatAmount(total)
    : '-';

  // فرق الرسوم (عرض الكاش باك أو الخصم بالنسبة المئوية)
  const diff = (selectedTurn ? selectedTurn.feeAmount : 0);
  const diffEl = document.getElementById('feeDiffText');
  if (selectedTurn && diff !== 0) {
    let percentText = ` (${getTurnPercent(selectedTurn)}%)`;
    if (diff < 0) {
      diffEl.innerHTML = `كاش باك ${formatAmount(Math.abs(diff))}${percentText}`;
      diffEl.classList.remove('text-red-500', 'hidden');
      diffEl.classList.add('text-green-500');
    } else {
      diffEl.innerHTML = `خصم قدره ${formatAmount(Math.abs(diff))}${percentText}`;
      diffEl.classList.remove('text-green-500', 'hidden');
      diffEl.classList.add('text-red-500');
    }
  } else {
    diffEl.innerHTML = '';
    diffEl.classList.add('hidden');
  }

  // توضيح رسوم العقد تحت المبلغ النهائي إذا كنت تريد:
  const contractEl = document.getElementById('contractFeeText');
  if (contractEl && selectedTurn) {
    contractEl.innerHTML = contractFee > 0
      ? `تم خصم رسوم عقد قدرها ${formatAmount(contractFee)}`
      : '';
    contractEl.classList.toggle('hidden', contractFee <= 0);
  }
}



// دالة مساعدة لتخزين رقم الدور
const storeTurnNumber = turnName => {
  const match = turnName.match(/\d+/);
  const turnNumber = match ? parseInt(match[0], 10) : null;
  if (turnNumber) sessionStorage.setItem('turnNumber', turnNumber);
};

// التبديل بين التابات
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedTab = btn.dataset.tab;
    renderTabs();
    renderTurns();
    renderSummary();
  });
});

// زر التالي
nextBtn.addEventListener('click', function() {
  if (!selectedTurnId) return;
  showModal('هل أنت متأكد أنك تريد اختيار هذا الدور؟', () => {
    window.location.href = 'upload.html';
  });
});

// أول تحميل
fetchTurns();
