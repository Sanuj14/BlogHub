/* Reset password — two-step: email → code + new password */
(function () {
  const { api } = window.BlogHub;
  const U = window.UI;

  let userEmail = '';

  function showAlert(msg, type = 'error') {
    const box = document.getElementById('alert');
    if (box) box.innerHTML = `<div class="inline-alert ${type}">${U.escape(msg)}</div>`;
  }

  function loading(btn, on, label) {
    if (on) { btn.dataset.html = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<span class="spinner spinner-sm"></span> ${label}`; }
    else { btn.disabled = false; btn.innerHTML = btn.dataset.html; }
  }

  // Step 1 — send code
  document.getElementById('forgotForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('sendBtn');
    userEmail = document.getElementById('email').value.trim();
    if (!userEmail) return showAlert('Please enter your email.');
    loading(btn, true, 'Sending...');
    try {
      const res = await api('/auth/forgot-password', { method: 'POST', body: { email: userEmail } });
      showAlert(res.message, 'success');
      document.getElementById('step1').style.display = 'none';
      document.getElementById('step2').style.display = '';
    } catch (err) {
      showAlert(err.message);
      loading(btn, false);
    }
  });

  // Step 2 — verify code + set new password
  document.getElementById('resetForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('resetBtn');
    const code = document.getElementById('code').value.trim();
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirmPassword').value;
    if (!code) return showAlert('Please enter the code.');
    if (password.length < 6) return showAlert('Password must be at least 6 characters.');
    if (password !== confirm) return showAlert('Passwords do not match.');
    loading(btn, true, 'Resetting...');
    try {
      const res = await api('/auth/reset-password', { method: 'POST', body: { email: userEmail, code, password } });
      showAlert(res.message, 'success');
      setTimeout(() => window.location.href = '/login.html', 1500);
    } catch (err) {
      showAlert(err.message);
      loading(btn, false);
    }
  });

  // Resend link
  document.getElementById('resendLink')?.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!userEmail) { document.getElementById('step2').style.display = 'none'; document.getElementById('step1').style.display = ''; return; }
    try {
      await api('/auth/forgot-password', { method: 'POST', body: { email: userEmail } });
      showAlert('A new code has been sent.', 'success');
    } catch (err) { showAlert(err.message); }
  });
})();
