/* Public profile — user info, follower/following counts, their blogs */
(function () {
  const { api, isAuthed, getUser } = window.BlogHub;
  const U = window.UI;

  const root = document.getElementById('profile-root');
  const id = new URLSearchParams(location.search).get('id');

  if (!id) { root.innerHTML = notFound('No user specified.'); return; }

  let following = false;
  let followersCount = 0;

  function notFound(msg) {
    return `<div class="empty"><div class="ic"><i class="fa-regular fa-user"></i></div>
      <p>${U.escape(msg)}</p><p style="margin-top:16px"><a class="btn btn-ghost btn-sm" href="/index.html">Back home</a></p></div>`;
  }

  function blogCard(b) {
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
            <span class="stats"><span><i class="fa-regular fa-eye"></i> ${b.views || 0}</span><span><i class="fa-regular fa-heart"></i> ${b.likeCount || 0}</span></span>
          </div>
        </div>
      </a>`;
  }

  function render(data) {
    const u = data.user;
    following = data.isFollowing;
    followersCount = u.followersCount;
    document.title = `${u.name} — BlogHub`;

    const avatar = u.avatar
      ? `<img src="${U.escape(u.avatar)}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.textContent='${U.escape(U.initials(u.name))}'"/>`
      : U.escape(U.initials(u.name));

    const followBtn = data.isSelf
      ? `<a class="btn btn-ghost btn-sm" href="/dashboard.html"><i class="fa-solid fa-gauge"></i> Your dashboard</a>`
      : `<button class="btn ${following ? 'btn-ghost' : 'btn-primary'} btn-sm" id="followBtn">
          <i class="fa-solid ${following ? 'fa-user-check' : 'fa-user-plus'}"></i> <span>${following ? 'Following' : 'Follow'}</span>
         </button>`;

    root.innerHTML = `
      <div class="glass" style="padding:28px;margin-bottom:30px">
        <div style="display:flex;gap:22px;align-items:center;flex-wrap:wrap">
          <div style="width:96px;height:96px;border-radius:50%;overflow:hidden;flex:none;background:var(--yellow);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:900;font-size:2rem;border:var(--bd)">${avatar}</div>
          <div style="flex:1;min-width:200px">
            <h1 style="font-size:clamp(1.5rem,4vw,2.2rem)">${U.escape(u.name)}</h1>
            <div class="muted" style="font-family:var(--font-mono);margin-top:4px">@${U.escape(u.username)}</div>
            ${u.bio ? `<p style="margin-top:10px">${U.escape(u.bio)}</p>` : ''}
            <div class="muted" style="font-size:.82rem;margin-top:8px"><i class="fa-regular fa-calendar"></i> Joined ${U.date(u.createdAt)}</div>
          </div>
          <div style="flex:none">${followBtn}</div>
        </div>
        <div style="display:flex;gap:28px;margin-top:22px;padding-top:20px;border-top:var(--bd)">
          <div><span style="font-family:var(--font-display);font-size:1.4rem" id="followersNum">${followersCount}</span> <span class="muted">Followers</span></div>
          <div><span style="font-family:var(--font-display);font-size:1.4rem">${u.followingCount}</span> <span class="muted">Following</span></div>
          <div><span style="font-family:var(--font-display);font-size:1.4rem">${data.blogs.length}</span> <span class="muted">Stories</span></div>
        </div>
      </div>

      <div class="toolbar" style="margin-bottom:20px"><h2 style="font-size:1.4rem">Stories by ${U.escape(u.name.split(' ')[0])}</h2></div>
      ${data.blogs.length
        ? `<div class="blog-grid">${data.blogs.map(blogCard).join('')}</div>`
        : `<div class="empty"><div class="ic"><i class="fa-regular fa-newspaper"></i></div><p>No published stories yet.</p></div>`}
    `;

    const btn = document.getElementById('followBtn');
    if (btn) btn.addEventListener('click', onFollow);
  }

  async function onFollow() {
    if (!isAuthed()) {
      U.toast('Please log in to follow', 'info');
      setTimeout(() => location.href = '/login.html', 700);
      return;
    }
    const btn = document.getElementById('followBtn');
    btn.disabled = true;
    try {
      const res = await api(`/users/${id}/follow`, { method: 'POST', auth: true });
      following = res.following;
      followersCount = res.followersCount;
      btn.className = `btn ${following ? 'btn-ghost' : 'btn-primary'} btn-sm`;
      btn.querySelector('i').className = `fa-solid ${following ? 'fa-user-check' : 'fa-user-plus'}`;
      btn.querySelector('span').textContent = following ? 'Following' : 'Follow';
      document.getElementById('followersNum').textContent = followersCount;
    } catch (e) { U.toast(e.message, 'error'); }
    btn.disabled = false;
  }

  async function load() {
    try {
      const data = await api(`/users/${id}`, { auth: isAuthed() });
      render(data);
    } catch (e) {
      root.innerHTML = notFound(e.status === 404 ? "This user doesn't exist." : e.message);
    }
  }

  load();
})();
