console.log('login.js loaded');

document.getElementById('login-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const errorEl = document.getElementById('login-error');
  errorEl.textContent = '';
  errorEl.classList.add('hidden');

  const loginInput = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  let body = { password };
  if (loginInput.includes('@')) {
    body.email = loginInput;
  } else {
    body.nationalId = loginInput;
  }

  try {
    const res = await fetch('https://api.technologytanda.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(text || 'كلمة المرور أو بيانات الدخول غير صحيحة');
    }

    if (!res.ok) throw new Error(data.message || data.error || 'فشل في تسجيل الدخول');

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    window.location.href = 'home.html';
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  }
});