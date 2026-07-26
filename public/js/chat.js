/* Chat — conversations list + messaging with polling */
(function () {
  const { api, isAuthed, getUser } = window.BlogHub;
  const U = window.UI;

  if (!isAuthed()) { window.location.replace('/login.html'); return; }

  const me = getUser();
  const layout = document.getElementById('chatLayout');
  const listEl = document.getElementById('chatList');
  const mainEl = document.getElementById('chatMain');
  const emptyEl = document.getElementById('chatEmpty');
  const searchInput = document.getElementById('userSearch');

  let activeUserId = null;
  let pollTimer = null;
  let searchTimer = null;

  function avatarHTML(u, size) {
    const s = size || 40;
    if (u.avatar) {
      return `<img src="${U.escape(u.avatar)}" style="width:${s}px;height:${s}px;object-fit:cover;border-radius:50%" onerror="this.outerHTML='${U.escape(U.initials(u.name))}'">`;
    }
    return U.escape(U.initials(u.name));
  }

  function convoItem(c) {
    const u = c.user;
    return `
      <div class="chat-item${activeUserId === u._id ? ' active' : ''}" data-uid="${U.escape(u._id)}">
        <div class="avatar">${avatarHTML(u)}</div>
        <div class="info">
          <div class="name">${U.escape(u.name)}</div>
          <div class="preview">${U.escape(c.lastMessage)}</div>
        </div>
        ${c.unread ? `<div class="badge">${c.unread}</div>` : `<span class="muted" style="font-size:.68rem;font-family:var(--font-mono);flex:none">${U.timeAgo(c.lastDate)}</span>`}
      </div>`;
  }

  function userItem(u) {
    return `
      <div class="chat-item" data-uid="${U.escape(u._id)}">
        <div class="avatar">${avatarHTML(u)}</div>
        <div class="info">
          <div class="name">${U.escape(u.name)}</div>
          <div class="preview">@${U.escape(u.username)}</div>
        </div>
      </div>`;
  }

  async function loadConversations() {
    try {
      const { conversations } = await api('/chat/conversations', { auth: true });
      if (!conversations.length) {
        listEl.innerHTML = `<div style="padding:30px 18px;text-align:center"><p class="muted" style="font-family:var(--font-mono);font-size:.8rem;text-transform:uppercase">No conversations yet. Search for a user to start chatting.</p></div>`;
        return;
      }
      listEl.innerHTML = conversations.map(convoItem).join('');
      bindListClicks();
    } catch (e) {
      listEl.innerHTML = `<div style="padding:20px"><p class="muted">${U.escape(e.message)}</p></div>`;
    }
  }

  function bindListClicks() {
    listEl.querySelectorAll('.chat-item').forEach(el => {
      el.addEventListener('click', () => openChat(el.dataset.uid));
    });
  }

  async function openChat(userId) {
    activeUserId = userId;
    layout.classList.add('chat-open');
    clearInterval(pollTimer);

    mainEl.innerHTML = `<div class="chat-header" id="chatHeader"></div><div class="chat-messages" id="chatMessages"><div class="spinner"></div></div><div class="chat-input"><input id="msgInput" placeholder="Type a message..." maxlength="2000" autocomplete="off" /><button id="sendBtn">Send</button></div>`;

    try {
      const { messages, user: other } = await api(`/chat/${userId}`, { auth: true });

      const header = document.getElementById('chatHeader');
      header.innerHTML = `<button class="chat-back" id="chatBack"><i class="fa-solid fa-arrow-left"></i></button><div class="avatar" style="width:36px;height:36px;border-radius:50%;overflow:hidden;flex:none;background:var(--yellow);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:900;font-size:.8rem;border:var(--bd)">${avatarHTML(other, 36)}</div><div><div class="name">${U.escape(other.name)}</div><div class="username">@${U.escape(other.username)}</div></div>`;

      document.getElementById('chatBack').addEventListener('click', () => {
        layout.classList.remove('chat-open');
        activeUserId = null;
        clearInterval(pollTimer);
        loadConversations();
      });

      renderMessages(messages);
      setupSend(userId);
      startPolling(userId);
    } catch (e) {
      mainEl.innerHTML = `<div class="chat-empty"><div><div class="ic"><i class="fa-solid fa-triangle-exclamation"></i></div><p>${U.escape(e.message)}</p></div></div>`;
    }

    // Update sidebar active state
    listEl.querySelectorAll('.chat-item').forEach(el => {
      el.classList.toggle('active', el.dataset.uid === userId);
    });
  }

  function renderMessages(messages) {
    const container = document.getElementById('chatMessages');
    if (!messages.length) {
      container.innerHTML = `<div style="text-align:center;padding:40px 0"><p class="muted" style="font-family:var(--font-mono);font-size:.78rem;text-transform:uppercase">No messages yet. Say hi!</p></div>`;
      return;
    }
    container.innerHTML = messages.map(m => {
      const isMine = m.from === me.id || (m.from && m.from._id === me.id);
      return `<div class="msg ${isMine ? 'sent' : 'received'}">
        <div>${U.escape(m.content)}</div>
        <div class="time">${U.timeAgo(m.createdAt)}</div>
      </div>`;
    }).join('');
    container.scrollTop = container.scrollHeight;
  }

  function appendMessage(m) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    const placeholder = container.querySelector('.muted');
    if (placeholder && placeholder.closest('[style]')) container.innerHTML = '';
    const isMine = m.from === me.id || (m.from && m.from._id === me.id);
    container.insertAdjacentHTML('beforeend', `<div class="msg ${isMine ? 'sent' : 'received'}">
      <div>${U.escape(m.content)}</div>
      <div class="time">just now</div>
    </div>`);
    container.scrollTop = container.scrollHeight;
  }

  function setupSend(userId) {
    const input = document.getElementById('msgInput');
    const btn = document.getElementById('sendBtn');
    async function send() {
      const content = input.value.trim();
      if (!content) return;
      input.value = '';
      btn.disabled = true;
      try {
        const res = await api(`/chat/${userId}`, { method: 'POST', auth: true, body: { content } });
        appendMessage(res.message);
      } catch (e) { U.toast(e.message, 'error'); }
      btn.disabled = false;
      input.focus();
    }
    btn.addEventListener('click', send);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
    input.focus();
  }

  let lastMsgId = null;
  function startPolling(userId) {
    lastMsgId = null;
    pollTimer = setInterval(async () => {
      if (activeUserId !== userId) return;
      try {
        const { messages } = await api(`/chat/${userId}`, { auth: true });
        if (!messages.length) return;
        const newest = messages[messages.length - 1];
        if (newest._id !== lastMsgId) {
          lastMsgId = newest._id;
          renderMessages(messages);
        }
      } catch (_) { /* ignore poll errors */ }
    }, 4000);
  }

  // Search users to start a new conversation
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
      const q = searchInput.value.trim();
      if (!q) { loadConversations(); return; }
      try {
        const { users } = await api(`/users/search?q=${encodeURIComponent(q)}`, { auth: true });
        if (!users.length) {
          listEl.innerHTML = `<div style="padding:20px;text-align:center"><p class="muted" style="font-family:var(--font-mono);font-size:.78rem;text-transform:uppercase">No users found</p></div>`;
          return;
        }
        listEl.innerHTML = users.map(userItem).join('');
        bindListClicks();
      } catch (_) { /* ignore */ }
    }, 300);
  });

  // Check URL for direct chat target
  const targetId = new URLSearchParams(location.search).get('user');
  if (targetId) {
    openChat(targetId);
  }

  loadConversations();
})();
