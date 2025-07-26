// التنقل بين الخطوات
    const steps = document.querySelectorAll('.step');
    const indicators = document.querySelectorAll('.step-indicator');

    function showStep(idx) {
      steps.forEach((s, i) => {
        s.classList.toggle('hidden', i !== idx);
        indicators[i].classList.toggle('active', i === idx);
      });
    }

    document.getElementById('to-step-1').addEventListener('click', () => showStep(1));
    document.getElementById('to-step-2').addEventListener('click', () => showStep(2));
    indicators.forEach(ind => {
      ind.addEventListener('click', () => {
        const i = parseInt(ind.getAttribute('data-step'));
        showStep(i);
      });
    });

    // ربط النموذج بالـ API
    document.getElementById('register-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const errorEl = document.getElementById('register-error');
      errorEl.textContent = '';
      errorEl.classList.add('hidden');

      const fullName = this.querySelector('[name="fullName"]').value.trim();
      const phone = this.querySelector('[name="phone"]').value.trim();
      const email = this.querySelector('[name="email"]').value.trim();
      const nationalId = this.querySelector('[name="nationalId"]').value.trim();
      const password = this.querySelector('[name="password"]').value;

      // Require at least one: email or nationalId
      if (!email && !nationalId) {
        errorEl.textContent = "يجب إدخال البريد الإلكتروني أو رقم البطاقة الوطنية";
        errorEl.classList.remove('hidden');
        return;
      }

      try {
        const res = await fetch('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, phone, email, nationalId, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.message || 'فشل التسجيل');
        alert('✅ تم التسجيل بنجاح');
        window.location.href = 'login.html';
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
      }
    });

    // عرض الخطوة الأولى عند التحميل
    showStep(0);