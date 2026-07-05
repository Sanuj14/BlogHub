/* Explore page — search, category filter, pagination */
(function () {
  const { api } = window.BlogHub;
  const U = window.UI;

  const results = document.getElementById('results');
  const pagination = document.getElementById('pagination');
  const searchInput = document.getElementById('searchInput');
  const categorySelect = document.getElementById('categorySelect');

  const params = new URLSearchParams(location.search);
  let state = {
    page: parseInt(params.get('page')) || 1,
    search: params.get('search') || '',
    category: params.get('category') || ''
  };
  searchInput.value = state.search;
  categorySelect.value = state.category;

  if (state.category) {
    document.getElementById('page-title').textContent = state.category + ' stories';
    document.getElementById('page-sub').textContent = `Posts filed under ${state.category}.`;
  }

  function cardHTML(b) {
    const author = b.author || {};
    const cover = b.coverImage
      ? `<div class="thumb"><span class="chip">${U.escape(b.category)}</span><img src="${U.escape(b.coverImage)}" alt="" loading="lazy" onerror="this.parentElement.classList.add('placeholder');this.remove()"></div>`
      : `<div class="thumb placeholder"><span class="chip">${U.escape(b.category)}</span></div>`;
    const tags = (b.tags || []).slice(0, 3).map(t => `<span class="tag">#${U.escape(t)}</span>`).join('');
    return `
      <a class="blog-card" href="/blog-detail.html?id=${b._id}">
        ${cover}
        <div class="body">
          <h3>${U.escape(b.title)}</h3>
          <p class="excerpt">${U.escape(b.excerpt || '')}</p>
          ${tags ? `<div class="tags">${tags}</div>` : ''}
          <div class="meta">
            <span class="avatar">${U.escape(U.initials(author.name))}</span>
            <div><span class="name">${U.escape(author.name || 'Anonymous')}</span><br><small>${U.timeAgo(b.createdAt)}</small></div>
            <span class="stats"><span><i class="fa-regular fa-eye"></i> ${b.views || 0}</span><span><i class="fa-regular fa-heart"></i> ${b.likeCount || 0}</span></span>
          </div>
        </div>
      </a>`;
  }

  function renderPagination(current, totalPages) {
    if (totalPages <= 1) { pagination.innerHTML = ''; return; }
    let html = `<button ${current === 1 ? 'disabled' : ''} data-page="${current - 1}"><i class="fa-solid fa-chevron-left"></i></button>`;
    for (let p = 1; p <= totalPages; p++) {
      html += `<button class="${p === current ? 'active' : ''}" data-page="${p}">${p}</button>`;
    }
    html += `<button ${current === totalPages ? 'disabled' : ''} data-page="${current + 1}"><i class="fa-solid fa-chevron-right"></i></button>`;
    pagination.innerHTML = html;
    pagination.querySelectorAll('button[data-page]').forEach(btn => {
      btn.addEventListener('click', () => { state.page = parseInt(btn.dataset.page); sync(); load(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    });
  }

  function sync() {
    const q = new URLSearchParams();
    if (state.search) q.set('search', state.search);
    if (state.category) q.set('category', state.category);
    if (state.page > 1) q.set('page', state.page);
    history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
  }

  async function load() {
    results.innerHTML = '<div class="spinner"></div>';
    try {
      const q = new URLSearchParams({ page: state.page, limit: 9 });
      if (state.search) q.set('search', state.search);
      if (state.category) q.set('category', state.category);
      const data = await api('/blogs?' + q.toString());
      if (!data.blogs.length) {
        results.innerHTML = `<div class="empty"><div class="ic"><i class="fa-regular fa-face-frown"></i></div>
          <p>No stories found${state.search ? ` for “${U.escape(state.search)}”` : ''}. Try a different search.</p></div>`;
        pagination.innerHTML = '';
        return;
      }
      results.innerHTML = `<div class="blog-grid">${data.blogs.map(cardHTML).join('')}</div>`;
      renderPagination(data.currentPage, data.totalPages);
    } catch (e) {
      results.innerHTML = `<div class="empty"><div class="ic"><i class="fa-solid fa-triangle-exclamation"></i></div><p>${U.escape(e.message)}</p></div>`;
    }
  }

  let debounce;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => { state.search = searchInput.value.trim(); state.page = 1; sync(); load(); }, 350);
  });
  categorySelect.addEventListener('change', () => { state.category = categorySelect.value; state.page = 1; sync(); load(); });

  load();
})();
