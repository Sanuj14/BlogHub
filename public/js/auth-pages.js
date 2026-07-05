/* Login + Register pages */
(function () {
  const { api, setAuth, isAuthed } = window.BlogHub;
  const U = window.UI;

  // Already logged in? Skip the auth screens.
  if (isAuthed()) { window.location.replace('/dashboard.html'); return; }

  function showAlert(msg, type = 'error') {
    const box = document.getElementById('alert');
    if (box) box.innerHTML = `<div class="inline-alert ${type}">${U.escape(msg)}</div>`;
  }

  function loading(btn, on, label) {
    if (on) {
      btn.dataset.html = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner spinner-sm"></span> ${label}`;
    } else {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.html;
    }
  }

  function finish(data) {
    setAuth(data.token, data.user);
    U.toast(`Welcome, ${data.user.name.split(' ')[0]}!`, 'success');
    setTimeout(() => (window.location.href = '/dashboard.html'), 500);
  }

  /* ------------------------------- login -------------------------------- */
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('submitBtn');
      const email = loginForm.email.value.trim();
      const password = loginForm.password.value;
      if (!email || !password) return showAlert('Please enter your email and password.');
      loading(btn, true, 'Logging in...');
      try {
        const data = await api('/auth/login', { method: 'POST', body: { email, password } });
        finish(data);
      } catch (err) {
        showAlert(err.message);
        loading(btn, false);
      }
    });
  }

  /* ------------------------------ register ------------------------------ */
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('submitBtn');
      const name = registerForm.name.value.trim();
      const username = registerForm.username.value.trim();
      const email = registerForm.email.value.trim();
      const password = registerForm.password.value;
      const confirm = registerForm.confirmPassword.value;

      if (!name || !username || !email || !password) return showAlert('Please fill in all fields.');
      if (!/^[a-zA-Z0-9_]{3,}$/.test(username)) return showAlert('Username must be 3+ characters (letters, numbers, underscores).');
      if (password.length < 6) return showAlert('Password must be at least 6 characters.');
      if (password !== confirm) return showAlert('Passwords do not match.');

      loading(btn, true, 'Creating account...');
      try {
        const data = await api('/auth/register', { method: 'POST', body: { name, username, email, password } });
        finish(data);
      } catch (err) {
        showAlert(err.message);
        loading(btn, false);
      }
    });
  }
})();
