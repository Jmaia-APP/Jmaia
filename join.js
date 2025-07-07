// 1. Require login via token in localStorage
const token = localStorage.getItem('token');
if (!token) {
  alert('You must be logged in to view this page.');
  window.location.href = '/login.html';
}

// Dropdown profile menu
$('#profile-toggle').on('click', () => {
  $('#popup-menu').toggleClass('opacity-100 pointer-events-auto')
                  .toggleClass('opacity-0 pointer-events-none');
});
$('#logout-btn').on('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
});

// Helper to move card to joined section
function moveToJoined($card) {
  $('#joinedSection').removeClass('hidden');
  $card.find('.join-button')
       .removeClass('text-blue-600 hover:underline')
       .addClass('text-gray-400 cursor-not-allowed')
       .prop('disabled', true)
       .text('Joined');
  $('#joinedContainer').append($card);
}

// Fetch suggestions
$('.btn-next').on('click', function() {
  const totalPayout = parseFloat($('.input-amount').val());
  if (!totalPayout || totalPayout < 1) {
    return alert('Please enter a valid amount (minimum 1).');
  }
  const $container = $('#suggestionsContainer');
  $container.empty();

  // Message area
  let $msg = $('#suggestionsMessage');
  if ($msg.length === 0) {
    $msg = $('<div id="suggestionsMessage" class="col-span-full text-center text-green-700 font-bold mb-2"></div>');
    $container.before($msg);
  }
  $msg.text('');

  $.ajax({
    type: 'POST',
    url: 'https://api.technologytanda.com/api/payments/pay/suggest',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    data: JSON.stringify({ enter: totalPayout }),
    success: function(res) {
      const suggestions = res.suggestions || [];
      // Show API message if present
      if (res.message) {
        $msg.text(res.message);
      } else {
        $msg.text('');
      }
      if (!res.success || suggestions.length === 0) {
        return $container.html(
          '<p class="col-span-full text-center text-gray-500">No suggestions found.</p>'
        );
      }
      // استخدم grid responsive
      $container
        .removeClass()
        .addClass('grid gap-4 px-2 mb-4 grid-cols-2');
      suggestions.forEach(assoc => {
        const $card = $(`
          <div class="association-card card max-w-[160px] w-full bg-white border border-teal-400 rounded-lg shadow p-0 text-center font-sans cursor-pointer select-none transition hover:shadow-lg flex flex-col mx-auto" data-association-id="${assoc.id}">
            <div class="flex justify-between items-start px-3 pt-3">
              <span class="inline-block w-5 h-5 border-2 border-teal-400 rounded-full"></span>
              <div class="flex flex-col items-end">
                <span class="text-lg font-bold text-gray-800">${assoc.duration}</span>
                <span class="text-base font-bold text-gray-900">شهور</span>
              </div>
            </div>
            <div class="border-t border-teal-400 my-2"></div>
            <div class="flex flex-col items-center justify-center py-2">
              <span class="text-xl font-bold text-gray-800">
                إجمالي القبض: ${assoc.totalPayout.toLocaleString("ar-EG")} ر.س
              </span>
              <span class="text-sm font-bold text-green-700 mt-2">
                ${assoc.monthlyAmount.toLocaleString("ar-EG")} <span class="text-base font-bold text-green-700">ر.س/شهر</span>
              </span>
            </div>
            <button class="join-button absolute inset-0 opacity-0" data-id="${assoc.id}" tabindex="-1" aria-label="انضم"></button>
          </div>
        `);
        $container.append($card);
      });
    },
    error: function(err) {
      console.error('Error fetching suggestions:', err);
      alert('Error fetching suggestions.');
    }
  });
});

// Load joined associations on page load
function loadJoinedAssociations() {
  if (!token) {
    console.log('No token found, skipping joined associations load');
    return;
  }

  $.ajax({
    type: 'GET',
    url: 'https://api.technologytanda.com/api/associations/joined',
    headers: { Authorization: 'Bearer ' + token },
    success: function(res) {
      if (!res.success) {
        console.log('No joined associations found');
        return;
      }
      const associations = res.associations || [];
      if (associations.length > 0) {
        $('#joinedSection').removeClass('hidden');
      }
      associations.forEach(assoc => {
        // Build card (new design for joined)
        const $card = $(`
          <div class="association-card card max-w-[160px] w-full bg-white border border-teal-400 rounded-lg shadow p-0 text-center font-sans cursor-pointer select-none transition hover:shadow-lg flex flex-col mx-auto" data-association-id="${assoc.id}">
            <div class="flex justify-between items-start px-3 pt-3">
              <span class="inline-block w-5 h-5 border-2 border-teal-400 rounded-full bg-teal-200"></span>
              <div class="flex flex-col items-end">
                <span class="text-lg font-bold text-gray-800">${assoc.duration}</span>
                <span class="text-base font-bold text-gray-900" style="font-family: Tajawal, sans-serif;">شهور</span>
              </div>
            </div>
            <div class="border-t border-teal-400 my-2"></div>
            <div class="flex flex-col items-center justify-center py-2">
              <span class="text-xl font-bold text-gray-800">${assoc.monthlyAmount.toLocaleString("ar-EG")}</span>
              <span class="text-base font-bold text-gray-900" style="font-family: Tajawal, sans-serif;">ر.س/شهر</span>
            </div>
          </div>
        `);
        $('#joinedContainer').append($card);
      });
    },
    error: function(err) {
      console.log('Error loading joined associations:', err);
    }
  });
}

// Call loadJoinedAssociations when document is ready
$(document).ready(function() {
  loadJoinedAssociations();
});

// عند الضغط على أي كارد (اقتراح أو منضم إليه)
$(document).on('click', '.association-card', function(e) {
  // تجاهل الضغط إذا كان على زر join نفسه
  // (الزر الآن شفاف ويغطي الكارد بالكامل، لكن نحتفظ بالشرط)
  if ($(e.target).hasClass('join-button')) return;
  const associationId = $(this).data('association-id');
  if (associationId) {
    localStorage.setItem('selectedAssociationId', associationId);
    window.location.href = 'select_turn.html';
  }
});

// Join handler: فقط يحفظ associationId ويوجه للصفحة، لا يعمل join فعلي
$(document).on('click', '.join-button', function(e) {
  e.stopPropagation();
  const $btn = $(this);
  const assocId = $btn.data('id');
  if (assocId) {
    localStorage.setItem('selectedAssociationId', assocId);
    window.location.href = 'select_turn.html';
  }
});