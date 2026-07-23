/* Blog detail — render article, likes, comments, author actions */
(function () {
  const { api, isAuthed, getUser } = window.BlogHub;
  const U = window.UI;

  const root = document.getElementById('article-root');
  const id = new URLSearchParams(location.search).get('id');

  if (!id) {
    root.innerHTML = notFound('No story specified.');
    return;
  }

  let liked = false;
  let likeCount = 0;

  function notFound(msg) {
    return `<div class="empty"><div class="ic"><i class="fa-regular fa-compass"></i></div>
      <p>${U.escape(msg)}</p><p style="margin-top:16px"><a class="btn btn-ghost btn-sm" href="/blogs.html">Back to stories</a></p></div>`;
  }

  function commentHTML(c) {
    const name = (c.user && c.user.name) || c.name || 'User';
    return `
      <div class="comment">
        <span class="avatar">${U.escape(U.initials(name))}</span>
        <div class="c-body">
          <div class="c-head"><strong>${U.escape(name)}</strong><small>${U.timeAgo(c.createdAt)}</small></div>
          <p>${U.escape(c.content)}</p>
        </div>
      </div>`;
  }

  function relatedHTML(b) {
    return `<a class="blog-card" href="/blog-detail.html?id=${b._id}">
      <div class="thumb ${b.coverImage ? '' : 'placeholder'}"><span class="chip">${U.escape(b.category)}</span>
        ${b.coverImage ? `<img src="${U.escape(b.coverImage)}" alt="" onerror="this.parentElement.classList.add('placeholder');this.remove()">` : ''}</div>
      <div class="body"><h3>${U.escape(b.title)}</h3><p class="excerpt">${U.escape(b.excerpt || '')}</p></div>
    </a>`;
  }

  function render(blog, related) {
    const author = blog.author || {};
    const me = getUser();
    const isOwner = me && author._id && me.id === author._id.toString();
    likeCount = blog.likeCount || 0;

    const cover = blog.coverImage
      ? `<div class="article-hero"><img src="${U.escape(blog.coverImage)}" alt="" onerror="this.closest('.article-hero').remove()"></div>` : '';
    const tags = (blog.tags || []).map(t => `<span class="tag">#${U.escape(t)}</span>`).join('');

    root.innerHTML = `
      <article class="article">
        <a href="/blogs.html" class="muted" style="font-size:.9rem"><i class="fa-solid fa-arrow-left"></i> All stories</a>
        <div style="margin:18px 0 10px"><span class="chip" style="position:static">${U.escape(blog.category)}</span></div>
        <h1>${U.escape(blog.title)}</h1>
        <div class="article-meta">
          <span class="avatar">${U.escape(U.initials(author.name))}</span>
          <span><strong>${U.escape(author.name || 'Anonymous')}</strong></span>
          <span class="dot">·</span><span>${U.date(blog.createdAt)}</span>
          <span class="dot">·</span><span><i class="fa-regular fa-eye"></i> ${blog.views || 0} views</span>
          ${isOwner ? `<span style="margin-left:auto;display:flex;gap:8px">
            <a class="btn btn-ghost btn-sm" href="/edit-blog.html?id=${blog._id}"><i class="fa-solid fa-pen"></i> Edit</a>
            <button class="btn btn-danger btn-sm" id="deleteBtn"><i class="fa-solid fa-trash"></i> Delete</button></span>` : ''}
        </div>
        ${cover}
        <div class="article-body">${U.sanitizeHTML(blog.content)}</div>
        ${tags ? `<div class="tags" style="margin-bottom:10px">${tags}</div>` : ''}

        <div class="like-bar">
          <button class="btn ${liked ? 'btn-primary' : 'btn-ghost'}" id="likeBtn">
            <i class="fa-${liked ? 'solid' : 'regular'} fa-heart"></i> <span id="likeCount">${likeCount}</span>
          </button>
          <span class="muted">${blog.commentCount || (blog.comments || []).length} comments</span>
        </div>

        <section style="padding:0">
          <h3 style="margin-bottom:16px">Comments</h3>
          <div id="commentFormWrap"></div>
          <div id="comments">${(blog.comments && blog.comments.length ? blog.comments.map(commentHTML).join('') : '<p class="muted">No comments yet. Be the first!</p>')}</div>
        </section>

        ${related && related.length ? `
          <section style="padding:40px 0 0">
            <h3 style="margin-bottom:18px">More in ${U.escape(blog.category)}</h3>
            <div class="blog-grid">${related.map(relatedHTML).join('')}</div>
          </section>` : ''}
      </article>`;

    // comment form (only when logged in)
    const formWrap = document.getElementById('commentFormWrap');
    if (isAuthed()) {
      formWrap.innerHTML = `
        <form id="commentForm" style="display:flex;gap:10px;margin-bottom:20px">
          <input class="input" id="commentInput" placeholder="Add a comment..." maxlength="1000" required />
          <button class="btn btn-primary" type="submit"><i class="fa-solid fa-paper-plane"></i></button>
        </form>`;
      document.getElementById('commentForm').addEventListener('submit', onComment);
    } else {
      formWrap.innerHTML = `<p class="muted" style="margin-bottom:20px"><a href="/login.html" style="color:var(--brand-2);font-weight:600">Log in</a> to like and comment.</p>`;
    }

    document.getElementById('likeBtn').addEventListener('click', onLike);
    const del = document.getElementById('deleteBtn');
    if (del) del.addEventListener('click', onDelete);
  }

  async function onLike() {
    if (!isAuthed()) { U.toast('Please log in to like posts', 'info'); setTimeout(() => location.href = '/login.html', 700); return; }
    try {
      const res = await api(`/blogs/${id}/like`, { method: 'POST', auth: true });
      liked = res.liked; likeCount = res.likeCount;
      const btn = document.getElementById('likeBtn');
      btn.className = `btn ${liked ? 'btn-primary' : 'btn-ghost'}`;
      btn.querySelector('i').className = `fa-${liked ? 'solid' : 'regular'} fa-heart`;
      document.getElementById('likeCount').textContent = likeCount;
    } catch (e) { U.toast(e.message, 'error'); }
  }

  async function onComment(e) {
    e.preventDefault();
    const input = document.getElementById('commentInput');
    const content = input.value.trim();
    if (!content) return;
    try {
      const res = await api(`/blogs/${id}/comments`, { method: 'POST', auth: true, body: { content } });
      const list = document.getElementById('comments');
      if (list.querySelector('.muted')) list.innerHTML = '';
      list.insertAdjacentHTML('afterbegin', commentHTML(res.comment));
      input.value = '';
      U.toast('Comment added', 'success');
    } catch (err) { U.toast(err.message, 'error'); }
  }

  async function onDelete() {
    if (!confirm('Delete this story permanently?')) return;
    try {
      await api(`/blogs/${id}`, { method: 'DELETE', auth: true });
      U.toast('Story deleted', 'success');
      setTimeout(() => location.href = '/dashboard.html', 700);
    } catch (e) { U.toast(e.message, 'error'); }
  }

  async function load() {
    try {
      const data = await api(`/blogs/${id}`, { auth: isAuthed() });
      liked = !!data.liked;
      document.title = `${data.blog.title} — BlogHub`;
      render(data.blog, data.related);
    } catch (e) {
      root.innerHTML = notFound(e.status === 404 ? 'This story doesn’t exist or was removed.' : e.message);
    }
  }

  load();
})();
