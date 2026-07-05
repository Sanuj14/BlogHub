/* Create story page */
(function () {
  const { api, isAuthed } = window.BlogHub;
  const U = window.UI;

  if (!isAuthed()) { window.location.replace('/login.html'); return; }

  const form = document.getElementById('blogForm');
  const alertBox = document.getElementById('alert');
  const content = document.getElementById('content');
  const wordcount = document.getElementById('wordcount');

  content.addEventListener('input', () => {
    const words = content.value.trim().split(/\s+/).filter(Boolean).length;
    wordcount.textContent = words;
  });

  function showAlert(msg, type = 'error') {
    alertBox.innerHTML = `<div class="inline-alert ${type}">${U.escape(msg)}</div>`;
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  let submitting = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitting) return;

    // Which button was clicked decides published vs draft.
    const status = (document.activeElement && document.activeElement.dataset.status) || 'published';

    const payload = {
      title: form.title.value.trim(),
      category: form.category.value,
      tags: form.tags.value.trim(),
      coverImage: form.coverImage.value.trim(),
      content: form.content.value.trim(),
      status
    };

    if (!payload.title || !payload.category || !payload.content) {
      return showAlert('Title, category and content are required.');
    }

    submitting = true;
    const btn = status === 'draft' ? document.getElementById('draftBtn') : document.getElementById('publishBtn');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner spinner-sm"></span> Saving...`;

    try {
      const res = await api('/blogs', { method: 'POST', auth: true, body: payload });
      U.toast(status === 'draft' ? 'Draft saved' : 'Story published!', 'success');
      setTimeout(() => {
        window.location.href = status === 'draft'
          ? '/dashboard.html'
          : `/blog-detail.html?id=${res.blog._id}`;
      }, 600);
    } catch (err) {
      showAlert(err.message);
      btn.disabled = false;
      btn.innerHTML = original;
      submitting = false;
    }
  });
})();
