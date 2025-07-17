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

// جلب البيانات من الـ API
async function fetchTurns() {
  const associationId = localStorage.getItem('selectedAssociationId');
  const token = localStorage.getItem('token');
  if (!associationId) {
    alert('لم يتم اختيار جمعية!');
    window.location.href = 'home.html';
    return;
  }
  if (!token) {
    alert('يجب تسجيل الدخول أولاً');
    window.location.href = 'login.html';
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

    turns.forEach((turn, idx) => {
      if (idx === turns.length - 1) {
        turn.feeAmount = Math.abs(turn.feeAmount);
      } else {
        turn.feeAmount = -Math.abs(turn.feeAmount);
      }
    });

    splitTabs();
    renderTabs();
    renderTurns();
    renderSummary();
  } catch (e) {
    console.error('تفاصيل الخطأ:', e);
    alert('خطأ في تحميل الأدوار');
  }
}

function splitTabs() {
  const n = turns.length;
  const perTab = Math.ceil(n / 3);
  tabs.early = turns.slice(0, perTab);
  tabs.middle = turns.slice(perTab, perTab * 2);
  tabs.late = turns.slice(perTab * 2);
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
    const isLastTurn = turn === turns[turns.length - 1];
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
      <div class="text-sm font-bold ${isLastTurn ? 'text-green-700' : 'text-red-700'}">
        ${
          turn.feeAmount !== 0
            ? formatAmount(Math.abs(turn.feeAmount)) + (isLastTurn ? ' كاش باك' : ' رسوم الاشتراك')
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
            const confirmed = confirm('هل أنت متأكد أنك تريد اختيار هذا الدور؟');
            if (!confirmed) return;
            window.location.href = 'upload.html';
          });
        }
      }, 0);
    }
    turnsGrid.appendChild(card);
  });
}

function renderSummary() {
  if (!association) return;
  durationEl.textContent = turns.length + ' شهور';
  monthlyFeeEl.innerHTML = formatAmount(association.monthlyAmount);

  const selectedTurn = turns.find(t => t.id === selectedTurnId);
  const isLastTurn = selectedTurn === turns[turns.length - 1];

  document.getElementById('Fee').innerHTML = selectedTurn
    ? formatAmount(selectedTurn.feeAmount)
    : '-';

  let total = association.monthlyAmount * turns.length;
  if (selectedTurn) {
    if (isLastTurn) {
      total = total + selectedTurn.feeAmount;
    } else {
      total = total - Math.abs(selectedTurn.feeAmount);
    }
  }

  totalFeeEl.innerHTML = selectedTurn
    ? formatAmount(total)
    : '-';

  const diff = (selectedTurn ? selectedTurn.feeAmount : 0);
  const diffEl = document.getElementById('feeDiffText');
  if (selectedTurn && diff !== 0) {
    if (isLastTurn) {
      diffEl.innerHTML = `كاش باك ${formatAmount(diff)}`;
      diffEl.classList.remove('text-red-500', 'hidden');
      diffEl.classList.add('text-green-500');
    } else {
      diffEl.innerHTML = `خصم قدره ${formatAmount(Math.abs(diff))}`;
      diffEl.classList.remove('text-green-500', 'hidden');
      diffEl.classList.add('text-red-500');
    }
  } else {
    diffEl.innerHTML = '';
    diffEl.classList.add('hidden');
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
  const confirmed = confirm('هل أنت متأكد أنك تريد اختيار هذا الدور؟');
  if (!confirmed) return;
  window.location.href = 'upload.html';
});

// أول تحميل
fetchTurns();
fetchTurns();
fetchTurns();
