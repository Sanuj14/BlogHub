/* Create story page */
(function () {
  const { api, isAuthed } = window.BlogHub;
  const U = window.UI;

  if (!isAuthed()) { window.location.replace('/login.html'); return; }

  const form = document.getElementById('blogForm');
  const alertBox = document.getElementById('alert');
  const contentEl = document.getElementById('content');
  const wordcount = document.getElementById('wordcount');
  const coverImageInput = document.getElementById('coverImage');
  const coverFileInput = document.getElementById('coverFile');
  const coverPreview = document.getElementById('coverPreview');
  const coverPreviewImg = document.getElementById('coverPreviewImg');
  const coverRemove = document.getElementById('coverRemove');

  // Init rich text editor
  U.initEditor(contentEl, () => {
    const words = contentEl.innerText.trim().split(/\s+/).filter(Boolean).length;
    wordcount.textContent = words;
  });

  // Show preview when URL is typed
  coverImageInput.addEventListener('input', () => {
    const url = coverImageInput.value.trim();
    if (url) { coverPreviewImg.src = url; coverPreview.style.display = ''; }
    else coverPreview.style.display = 'none';
  });

  // Gallery picker
  coverFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await U.compressImage(file, { maxSize: 1280, quality: 0.82 });
      coverImageInput.value = dataUrl;
      coverPreviewImg.src = dataUrl;
      coverPreview.style.display = '';
    } catch (err) { U.toast(err.message, 'error'); }
    e.target.value = '';
  });

  coverRemove?.addEventListener('click', () => {
    coverImageInput.value = '';
    coverPreviewImg.src = '';
    coverPreview.style.display = 'none';
  });

  function showAlert(msg, type = 'error') {
    alertBox.innerHTML = `<div class="inline-alert ${type}">${U.escape(msg)}</div>`;
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  let submitting = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitting) return;

    const status = (document.activeElement && document.activeElement.dataset.status) || 'published';
    const rawContent = contentEl.innerHTML.trim();
    const payload = {
      title: form.title.value.trim(),
      category: form.category.value,
      tags: form.tags.value.trim(),
      coverImage: coverImageInput.value.trim(),
      content: U.sanitizeHTML(rawContent),
      status
    };

    if (!payload.title || !payload.category || !contentEl.innerText.trim()) {
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
