/* Edit story page */
(function () {
  const { api, isAuthed, getUser } = window.BlogHub;
  const U = window.UI;

  if (!isAuthed()) { window.location.replace('/login.html'); return; }

  const id = new URLSearchParams(location.search).get('id');
  const form = document.getElementById('blogForm');
  const alertBox = document.getElementById('alert');

  function showAlert(msg, type = 'error') {
    alertBox.innerHTML = `<div class="inline-alert ${type}">${U.escape(msg)}</div>`;
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  if (!id) { showAlert('No story specified.'); return; }

  // Load existing post and prefill.
  (async function load() {
    try {
      const data = await api(`/blogs/${id}`);
      const b = data.blog;
      const me = getUser();
      const ownerId = b.author && b.author._id ? b.author._id.toString() : '';
      if (!me || me.id !== ownerId) {
        showAlert('You can only edit your own stories.');
        form.querySelectorAll('input,textarea,select,button').forEach(el => (el.disabled = true));
        return;
      }
      form.title.value = b.title || '';
      form.category.value = b.category || '';
      form.tags.value = (b.tags || []).join(', ');
      form.coverImage.value = b.coverImage || '';
      form.content.value = b.content || '';
    } catch (e) {
      showAlert(e.status === 404 ? 'Story not found.' : e.message);
    }
  })();

  let submitting = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitting) return;

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
      const res = await api(`/blogs/${id}`, { method: 'PUT', auth: true, body: payload });
      U.toast('Story updated', 'success');
      setTimeout(() => {
        window.location.href = status === 'draft' ? '/dashboard.html' : `/blog-detail.html?id=${res.blog._id}`;
      }, 600);
    } catch (err) {
      showAlert(err.message);
      btn.disabled = false;
      btn.innerHTML = original;
      submitting = false;
    }
  });
})();
