/* BlogHub — shared UI: navbar, footer, custom cursor, toasts, helpers, reveal */
(function () {
  const { isAuthed, getUser, clearAuth } = window.BlogHub;

  /* ------------------------------ helpers ------------------------------- */
  const U = {
    escape(str) {
      return String(str == null ? '' : str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },
    initials(name) {
      return String(name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
    },
    /**
     * Read an image File picked from the gallery, downscale it on a canvas and
     * return a compressed JPEG/PNG data URL. Keeps the payload small enough to
     * store directly in MongoDB (serverless friendly — no disk needed).
     */
    compressImage(file, { maxSize = 1280, quality = 0.82 } = {}) {
      return new Promise((resolve, reject) => {
        if (!file || !file.type || !file.type.startsWith('image/')) {
          return reject(new Error('Please choose an image file'));
        }
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Could not read that file'));
        reader.onload = () => {
          const img = new Image();
          img.onerror = () => reject(new Error('That image could not be loaded'));
          img.onload = () => {
            let { width, height } = img;
            if (width > maxSize || height > maxSize) {
              const scale = Math.min(maxSize / width, maxSize / height);
              width = Math.round(width * scale);
              height = Math.round(height * scale);
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            // PNGs with transparency stay PNG; everything else becomes JPEG.
            const isPng = file.type === 'image/png';
            resolve(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', quality));
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      });
    },
    timeAgo(date) {
      const d = new Date(date);
      const s = Math.floor((Date.now() - d.getTime()) / 1000);
      if (isNaN(s)) return '';
      const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
      for (const [name, secs] of units) {
        const v = Math.floor(s / secs);
        if (v >= 1) return `${v} ${name}${v > 1 ? 's' : ''} ago`;
      }
      return 'just now';
    },
    date(d) {
      return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    },
    catIcon(cat) {
      const map = {
        Technology: 'fa-laptop-code', Lifestyle: 'fa-spa', Travel: 'fa-plane-departure',
        Food: 'fa-utensils', Health: 'fa-heart-pulse', Business: 'fa-briefcase',
        Literature: 'fa-book-open', Culture: 'fa-masks-theater', Other: 'fa-asterisk'
      };
      return map[cat] || 'fa-asterisk';
    },
    toast(message, type = 'info') {
      let wrap = document.querySelector('.toast-wrap');
      if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
      const el = document.createElement('div');
      const icon = type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info';
      el.className = `toast ${type}`;
      el.innerHTML = `<i class="fa-solid ${icon}"></i><span>${U.escape(message)}</span>`;
      wrap.appendChild(el);
      setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translate(10px,6px)'; setTimeout(() => el.remove(), 250); }, 3600);
    }
  };
  window.UI = U;

  const CATEGORIES = ['Technology', 'Lifestyle', 'Travel', 'Food', 'Health', 'Business', 'Literature', 'Culture', 'Other'];

  /* ------------------------------- navbar ------------------------------- */
  function renderNav() {
    const mount = document.getElementById('site-nav');
    if (!mount) return;
    const page = document.body.dataset.page || '';
    const authed = isAuthed();
    const user = getUser();
    const link = (href, label, key) => `<a href="${href}" class="${page === key ? 'active' : ''}">${label}</a>`;

    mount.innerHTML = `
      <nav class="nav" id="mainNav">
        <div class="container nav-inner">
          <a href="/index.html" class="brand"><span class="logo">✳</span>BLOGHUB</a>
          <div class="nav-links">
            ${link('/index.html', 'Home', 'home')}
            ${link('/blogs.html', 'Explore', 'blogs')}
            ${link('/about.html', 'About', 'about')}
            ${authed ? link('/dashboard.html', 'Dashboard', 'dashboard') : ''}
          </div>
          <div class="nav-right">
            ${authed ? `
              <a href="/create-blog.html" class="btn btn-primary btn-sm nav-desktop-only">✎ Write</a>
              <div class="menu">
                <button class="avatar-btn" id="avatarBtn" aria-haspopup="true">
                  ${user && user.avatar
                    ? `<span class="avatar" style="padding:0;overflow:hidden"><img src="${U.escape(user.avatar)}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.textContent='${U.escape(U.initials(user && user.name))}'"></span>`
                    : `<span class="avatar">${U.escape(U.initials(user && user.name))}</span>`}
                  <i class="fa-solid fa-chevron-down" style="font-size:.65rem"></i>
                </button>
                <div class="dropdown" id="userDropdown">
                  <a href="/dashboard.html"><i class="fa-solid fa-gauge"></i> Dashboard</a>
                  <a href="/create-blog.html"><i class="fa-solid fa-pen-nib"></i> Write</a>
                  <a href="#" id="logoutBtn"><i class="fa-solid fa-arrow-right-from-bracket"></i> Log out</a>
                </div>
              </div>
            ` : `
              <a href="/login.html" class="btn btn-ghost btn-sm">Log in</a>
              <a href="/register.html" class="btn btn-primary btn-sm">Start →</a>
            `}
            <button class="nav-toggle" id="navToggle" aria-label="Menu"><i class="fa-solid fa-bars"></i></button>
          </div>
        </div>
      </nav>`;

    const nav = document.getElementById('mainNav');
    document.getElementById('navToggle')?.addEventListener('click', () => nav.classList.toggle('open'));

    const avatarBtn = document.getElementById('avatarBtn');
    const dropdown = document.getElementById('userDropdown');
    if (avatarBtn) {
      avatarBtn.addEventListener('click', (e) => { e.stopPropagation(); dropdown.classList.toggle('open'); });
      document.addEventListener('click', () => dropdown.classList.remove('open'));
    }
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      clearAuth();
      U.toast('Logged out', 'success');
      setTimeout(() => (window.location.href = '/index.html'), 450);
    });
  }

  /* ------------------------------- footer ------------------------------- */
  function renderFooter() {
    const mount = document.getElementById('site-footer');
    if (!mount) return;
    const cats = CATEGORIES.slice(0, 5).map(c => `<li><a href="/blogs.html?category=${c}">${c}</a></li>`).join('');
    mount.innerHTML = `
      <footer class="footer">
        <div class="container">
          <div class="footer-grid">
            <div>
              <a href="/index.html" class="brand"><span class="logo">✳</span>BLOGHUB</a>
              <p style="max-width:320px;font-family:var(--font-mono);font-size:.8rem;text-transform:uppercase;letter-spacing:.03em;color:rgba(255,255,255,.75)">A place to write without rules. Publish loud, read bold.</p>
              <div class="social">
                <a href="#" aria-label="Twitter"><i class="fa-brands fa-x-twitter"></i></a>
                <a href="#" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
                <a href="#" aria-label="GitHub"><i class="fa-brands fa-github"></i></a>
                <a href="#" aria-label="LinkedIn"><i class="fa-brands fa-linkedin-in"></i></a>
              </div>
            </div>
            <div>
              <h5>Explore</h5>
              <ul>
                <li><a href="/index.html">Home</a></li>
                <li><a href="/blogs.html">All posts</a></li>
                <li><a href="/about.html">About</a></li>
                <li><a href="/create-blog.html">Write</a></li>
              </ul>
            </div>
            <div>
              <h5>Categories</h5>
              <ul>${cats}</ul>
            </div>
          </div>
          <div class="footer-bottom">© ${new Date().getFullYear()} BLOGHUB — BUILT TO DISRUPT.</div>
        </div>
      </footer>`;
  }

  /* --------------------------- custom cursor ---------------------------- */
  function initCursor() {
    if (window.matchMedia('(hover: none)').matches) return; // touch devices
    const ring = document.createElement('div'); ring.className = 'cursor hidden';
    const dot = document.createElement('div'); dot.className = 'cursor-dot hidden';
    document.body.appendChild(ring); document.body.appendChild(dot);
    document.body.classList.add('has-cursor');

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    let shown = false;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      if (!shown) { shown = true; ring.classList.remove('hidden'); dot.classList.remove('hidden'); }
    });
    window.addEventListener('mousedown', () => ring.classList.add('click'));
    window.addEventListener('mouseup', () => ring.classList.remove('click'));
    document.addEventListener('mouseleave', () => { ring.classList.add('hidden'); dot.classList.add('hidden'); shown = false; });

    // grow over interactive elements (event delegation)
    const interactive = 'a, button, input, textarea, select, .btn, .blog-card, .cat-card, .feature, [data-cursor]';
    document.addEventListener('mouseover', (e) => { if (e.target.closest(interactive)) ring.classList.add('hover'); });
    document.addEventListener('mouseout', (e) => { if (e.target.closest(interactive)) ring.classList.remove('hover'); });

    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ---------------------------- scroll reveal --------------------------- */
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    els.forEach(e => io.observe(e));
  }

  function initFavicon() {
    if (document.querySelector('link[rel="icon"]')) return;
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = '/favicon.svg';
    document.head.appendChild(link);
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = '#0c0c0c';
    document.head.appendChild(meta);
  }

  document.addEventListener('DOMContentLoaded', () => {
    initFavicon();
    renderNav();
    renderFooter();
    initReveal();
    initCursor();
  });
})();
