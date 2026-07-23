/* Home page — featured posts, categories, live stat, CTA guard */
(function () {
  const { api, isAuthed } = window.BlogHub;
  const U = window.UI;

  const CATEGORIES = [
    'Technology', 'Lifestyle', 'Travel', 'Food',
    'Health', 'Business', 'Literature', 'Culture'
  ];

  function cardHTML(b) {
    const author = b.author || {};
    const cover = b.coverImage
      ? `<div class="thumb"><span class="chip">${U.escape(b.category)}</span><img src="${U.escape(b.coverImage)}" alt="" loading="lazy" onerror="this.parentElement.classList.add('placeholder');this.remove()"></div>`
      : `<div class="thumb placeholder"><span class="chip">${U.escape(b.category)}</span></div>`;
    return `
      <a class="blog-card reveal in" href="/blog-detail.html?id=${b._id}">
        ${cover}
        <div class="body">
          <h3>${U.escape(b.title)}</h3>
          <p class="excerpt">${U.escape(b.excerpt || '')}</p>
          <div class="meta">
            <span class="avatar">${U.escape(U.initials(author.name))}</span>
            <span class="name">${U.escape(author.name || 'Anonymous')}</span>
            <span class="stats"><span><i class="fa-regular fa-eye"></i> ${b.views || 0}</span><span><i class="fa-regular fa-heart"></i> ${b.likeCount || 0}</span></span>
          </div>
        </div>
      </a>`;
  }

  async function loadFeatured() {
    const wrap = document.getElementById('featured');
    wrap.innerHTML = '<div class="spinner"></div>';
    try {
      const { blogs } = await api('/blogs/featured?limit=3');
      if (!blogs || !blogs.length) {
        wrap.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="ic"><i class="fa-regular fa-newspaper"></i></div>
          <p>No stories yet — be the first to publish one!</p></div>`;
        return;
      }
      wrap.innerHTML = blogs.map(cardHTML).join('');
    } catch (e) {
      wrap.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="ic"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <p>${U.escape(e.message)}</p></div>`;
    }
  }

  function renderCategories() {
    const wrap = document.getElementById('categories');
    wrap.innerHTML = CATEGORIES.map(c => `
      <a class="cat-card reveal in" href="/blogs.html?category=${c}">
        <div class="ic"><i class="fa-solid ${U.catIcon(c)}"></i></div>
        <span>${c}</span>
      </a>`).join('');
  }

  async function loadStat() {
    try {
      const { total } = await api('/blogs?limit=1');
      const el = document.getElementById('stat-posts');
      if (el && typeof total === 'number') el.textContent = total;
    } catch (_) { /* ignore */ }
  }

  // Logged-in users skip the "start writing" CTA → straight to the editor.
  document.querySelectorAll('[data-cta="start"]').forEach(a => {
    if (isAuthed()) a.setAttribute('href', '/create-blog.html');
  });

  async function loadPeople() {
    const section = document.getElementById('peopleSection');
    const wrap = document.getElementById('people');
    if (!section || !wrap) return;
    try {
      const { users } = await api('/users/suggestions');
      if (!users || !users.length) return;
      section.style.display = '';
      const now = Date.now();
      wrap.innerHTML = users.map(u => {
        const isNew = (now - new Date(u.createdAt).getTime()) < 30 * 24 * 60 * 60 * 1000;
        const avatar = u.avatar
          ? `<img src="${U.escape(u.avatar)}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.textContent='${U.escape(U.initials(u.name))}'"/>`
          : U.escape(U.initials(u.name));
        return `
          <div class="feature reveal" style="display:flex;align-items:center;gap:14px;padding:18px">
            <div style="width:52px;height:52px;border-radius:50%;overflow:hidden;flex:none;background:var(--yellow);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:900;font-size:1.1rem;border:var(--bd)">${avatar}</div>
            <div style="flex:1;min-width:0">
              <div style="font-family:var(--font-display);font-weight:900;font-size:.95rem;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${U.escape(u.name)}</div>
              <div class="muted" style="font-size:.78rem">@${U.escape(u.username)}${isNew ? ' &nbsp;<span style="background:var(--yellow);color:var(--ink);font-size:.68rem;padding:1px 6px;font-family:var(--font-mono);text-transform:uppercase;border:1px solid var(--ink)">New</span>' : ''}</div>
            </div>
            ${isAuthed()
              ? `<button class="btn btn-ghost btn-sm follow-btn" data-id="${U.escape(u._id)}" style="flex:none"><i class="fa-solid fa-user-plus"></i></button>`
              : `<a class="btn btn-ghost btn-sm" href="/register.html" style="flex:none"><i class="fa-solid fa-user-plus"></i></a>`}
          </div>`;
      }).join('');

      wrap.querySelectorAll('.follow-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          try {
            const res = await api(`/users/${btn.dataset.id}/follow`, { method: 'POST', auth: true });
            btn.innerHTML = res.following
              ? '<i class="fa-solid fa-user-check"></i>'
              : '<i class="fa-solid fa-user-plus"></i>';
          } catch (e) { U.toast(e.message, 'error'); }
          btn.disabled = false;
        });
      });
    } catch (_) { /* silently skip */ }
  }

  renderCategories();
  loadFeatured();
  loadStat();
  loadPeople();
})();
