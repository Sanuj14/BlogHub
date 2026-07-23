/* Dashboard — the logged-in user's posts + stats */
(function () {
  const { api, isAuthed, getUser, setAuth } = window.BlogHub;
  const U = window.UI;

  if (!isAuthed()) { window.location.replace('/login.html'); return; }

  const statsEl = document.getElementById('stats');
  const listEl = document.getElementById('myBlogs');
  let user = getUser();

  const greeting = document.getElementById('greeting');
  if (greeting && user) greeting.textContent = `Hey, ${user.name.split(' ')[0]} 👋`;

  /* ---- profile card ---- */
  function renderProfileCard(u) {
    const nameEl = document.getElementById('profileName');
    const unameEl = document.getElementById('profileUsername');
    const preview = document.getElementById('avatarPreview');
    if (nameEl) nameEl.textContent = u.name || '';
    if (unameEl) unameEl.textContent = u.username ? `@${u.username}` : '';
    if (preview) {
      if (u.avatar) {
        preview.innerHTML = `<img src="${U.escape(u.avatar)}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='${U.escape(U.initials(u.name))}'">`;
      } else {
        preview.textContent = U.initials(u.name);
      }
    }
    const editName = document.getElementById('editName');
    const editUsername = document.getElementById('editUsername');
    if (editName) editName.value = u.name || '';
    if (editUsername) editUsername.value = u.username || '';
  }

  renderProfileCard(user);

  document.getElementById('editProfileBtn')?.addEventListener('click', () => {
    document.getElementById('profileView').style.display = 'none';
    document.getElementById('profileEdit').style.display = '';
  });

  document.getElementById('cancelProfileBtn')?.addEventListener('click', () => {
    document.getElementById('profileEdit').style.display = 'none';
    document.getElementById('profileView').style.display = '';
  });

  document.getElementById('saveProfileBtn')?.addEventListener('click', async () => {
    const name = document.getElementById('editName').value.trim();
    const username = document.getElementById('editUsername').value.trim();
    if (!name || !username) { U.toast('Name and username are required', 'error'); return; }
    const btn = document.getElementById('saveProfileBtn');
    btn.disabled = true;
    try {
      const res = await api('/auth/profile', { method: 'PUT', auth: true, body: { name, username } });
      setAuth(res.token, res.user);
      user = res.user;
      renderProfileCard(user);
      document.getElementById('profileEdit').style.display = 'none';
      document.getElementById('profileView').style.display = '';
      U.toast('Profile updated', 'success');
    } catch (e) { U.toast(e.message, 'error'); }
    btn.disabled = false;
  });

  document.getElementById('avatarFile')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await U.compressImage(file, { maxSize: 400, quality: 0.85 });
      const res = await api('/auth/profile', { method: 'PUT', auth: true, body: { avatar: dataUrl } });
      setAuth(res.token, res.user);
      user = res.user;
      renderProfileCard(user);
      U.toast('Photo updated', 'success');
    } catch (e) { U.toast(e.message, 'error'); }
    e.target.value = '';
  });

  /* ---- stat card + blog row helpers ---- */
  function statCard(icon, value, label) {
    return `<div class="feature" style="padding:22px">
      <div class="ic" style="width:44px;height:44px;font-size:1.1rem"><i class="fa-solid ${icon}"></i></div>
      <div style="font-family:var(--font-head);font-size:1.8rem;font-weight:700">${value}</div>
      <div class="muted" style="font-size:.85rem">${label}</div>
    </div>`;
  }

  function rowHTML(b) {
    const statusBadge = b.status === 'draft'
      ? `<span class="tag" style="color:#fbbf24;background:rgba(251,191,36,.08);border-color:rgba(251,191,36,.25)">Draft</span>`
      : `<span class="tag">Published</span>`;
    return `
      <div class="glass" style="display:flex;gap:16px;align-items:center;padding:16px 18px;margin-bottom:12px">
        <div style="width:60px;height:60px;border-radius:12px;overflow:hidden;flex:none;background:var(--gradient-3)">
          ${b.coverImage ? `<img src="${U.escape(b.coverImage)}" style="width:100%;height:100%;object-fit:cover" onerror="this.remove()">` : ''}
        </div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">${statusBadge}<span class="muted" style="font-size:.78rem">${U.timeAgo(b.createdAt)}</span></div>
          <a href="/blog-detail.html?id=${b._id}" style="font-family:var(--font-head);font-weight:600;font-size:1.05rem;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${U.escape(b.title)}</a>
          <div class="muted" style="font-size:.8rem;margin-top:2px"><i class="fa-regular fa-eye"></i> ${b.views || 0} &nbsp; <i class="fa-regular fa-heart"></i> ${b.likeCount || 0} &nbsp; <i class="fa-regular fa-comment"></i> ${b.commentCount || 0}</div>
        </div>
        <div style="display:flex;gap:8px;flex:none">
          <a class="btn btn-ghost btn-sm" href="/edit-blog.html?id=${b._id}"><i class="fa-solid fa-pen"></i></a>
          <button class="btn btn-danger btn-sm" data-del="${b._id}"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`;
  }

  async function load() {
    listEl.innerHTML = '<div class="spinner"></div>';
    try {
      const { blogs } = await api('/blogs/mine', { auth: true });

      const totalViews = blogs.reduce((s, b) => s + (b.views || 0), 0);
      const totalLikes = blogs.reduce((s, b) => s + (b.likeCount || 0), 0);
      const drafts = blogs.filter(b => b.status === 'draft').length;
      statsEl.innerHTML =
        statCard('fa-newspaper', blogs.length, 'Total stories') +
        statCard('fa-eye', totalViews, 'Total views') +
        statCard('fa-heart', totalLikes, 'Total likes') +
        statCard('fa-file-pen', drafts, 'Drafts');

      if (!blogs.length) {
        listEl.innerHTML = `<div class="empty"><div class="ic"><i class="fa-regular fa-pen-to-square"></i></div>
          <p>You haven't written anything yet.</p>
          <p style="margin-top:16px"><a class="btn btn-primary btn-sm" href="/create-blog.html"><i class="fa-solid fa-pen-nib"></i> Write your first story</a></p></div>`;
        return;
      }

      listEl.innerHTML = blogs.map(rowHTML).join('');
      listEl.querySelectorAll('[data-del]').forEach(btn => {
        btn.addEventListener('click', () => onDelete(btn.dataset.del, btn));
      });
    } catch (e) {
      listEl.innerHTML = `<div class="empty"><div class="ic"><i class="fa-solid fa-triangle-exclamation"></i></div><p>${U.escape(e.message)}</p></div>`;
    }
  }

  async function onDelete(id, btn) {
    if (!confirm('Delete this story permanently?')) return;
    btn.disabled = true;
    try {
      await api(`/blogs/${id}`, { method: 'DELETE', auth: true });
      U.toast('Story deleted', 'success');
      load();
    } catch (e) { U.toast(e.message, 'error'); btn.disabled = false; }
  }

  load();
})();
