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

  renderCategories();
  loadFeatured();
  loadStat();
})();
