// login.js
console.log('login.js loaded');

const API_BASE = 'https://api.technologytanda.com/api/auth';

// ---------- التقليدي: تسجيل دخول بالبريد أو الهوية + كلمة المرور ----------
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
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(text || 'بيانات الدخول غير صحيحة');
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

// ---------- Biometric Login Handler ----------
document.getElementById('biometric-login').addEventListener('click', async () => {
  if (!window.PublicKeyCredential) {
    alert("المتصفح لا يدعم WebAuthn / Your browser doesn’t support WebAuthn");
    return;
  }

  try {
    // 1) fetch challenge & allowed credentials from server
    const initRes = await fetch(`${API_BASE}/biometric-init`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    if (!initRes.ok) throw new Error('فشل في جلب بيانات البصمة');
    const { challenge, allowCredentials } = await initRes.json();

    // 2) call WebAuthn
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: Uint8Array.from(atob(challenge), c => c.charCodeAt(0)),
        allowCredentials: allowCredentials.map(cred => ({
          id: Uint8Array.from(atob(cred.id), c => c.charCodeAt(0)),
          type: "public-key",
          transports: cred.transports
        })),
        timeout: 60000,
        userVerification: "preferred"
      }
    });

    // 3) send assertion for verification
    const verifyRes = await fetch(`${API_BASE}/biometric-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: assertion.id,
        rawId: btoa(String.fromCharCode(...new Uint8Array(assertion.rawId))),
        response: {
          clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(assertion.response.clientDataJSON))),
          authenticatorData: btoa(String.fromCharCode(...new Uint8Array(assertion.response.authenticatorData))),
          signature: btoa(String.fromCharCode(...new Uint8Array(assertion.response.signature))),
          userHandle: assertion.response.userHandle
            ? btoa(String.fromCharCode(...new Uint8Array(assertion.response.userHandle)))
            : null
        }
      })
    });

    const result = await verifyRes.json();
    if (!verifyRes.ok) throw new Error(result.message || 'فشل التحقق بالبيومترِك');

    // 4) success → redirect
    window.location.href = 'home.html';

  } catch (err) {
    console.error("Biometric login error:", err);
    alert(err.message || "فشل التحقق بالبيومترِك / Biometric verification failed");
  }
});
