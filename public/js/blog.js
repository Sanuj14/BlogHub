/**
 * BlogHub Blog JavaScript
 * Handles blog creation, editing, viewing, and interaction
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize TinyMCE
  tinymce.init({
    selector: '#content',
    plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
    toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
    height: 500,
    menubar: false,
    statusbar: false,
    promotion: false,
    branding: false,
    setup: function(editor) {
      editor.on('change', function() {
        editor.save();
      });
    }
  });

  // Initialize blog creation form
  const blogForm = document.getElementById('blogForm');
  if (blogForm) {
    initializeBlogForm(blogForm);
  }

  // Initialize blog editor for existing posts
  const blogEditForm = document.getElementById('blogEditForm');
  if (blogEditForm) {
    initializeBlogForm(blogEditForm, true);
  }

  // Initialize comment form
  const commentForm = document.getElementById('commentForm');
  if (commentForm) {
    commentForm.addEventListener('submit', handleCommentSubmit);
  }

  // Initialize like buttons
  initializeLikeButtons();

  // Initialize share buttons
  initializeShareButtons();

  // Initialize search functionality
  const searchForm = document.getElementById('blogSearchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', handleSearch);
  }

  // Handle category filter clicks
  const categoryLinks = document.querySelectorAll('.category-filter');
  categoryLinks.forEach(link => {
    link.addEventListener('click', handleCategoryFilter);
  });
});

/**
 * Initialize the blog creation/editing form
 * @param {HTMLElement} form - The blog form element
 * @param {boolean} isEdit - Whether this is an edit form
 */
function initializeBlogForm(form, isEdit = false) {
  // Initialize tag input
  const tagInput = form.querySelector('#tags');
  if (tagInput) {
    // Simple tag input implementation
    tagInput.addEventListener('keydown', function(e) {
      if (e.key === ',' || e.key === 'Enter') {
        e.preventDefault();
        const tagText = this.value.trim();
        if (tagText) {
          addTag(tagText, this);
          this.value = '';
        }
      }
    });

    // Initialize existing tags if editing
    if (isEdit && tagInput.dataset.tags) {
      const tags = JSON.parse(tagInput.dataset.tags);
      tags.forEach(tag => addTag(tag, tagInput));
    }
  }

  // Set up image preview
  const coverImageInput = form.querySelector('#coverImage');
  const imagePreview = form.querySelector('#imagePreview');
  
  if (coverImageInput && imagePreview) {
    coverImageInput.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
          imagePreview.src = e.target.result;
          imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(this.files[0]);
      }
    });
  }

  // Handle form submission
  // Remove any existing event listeners
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);
  
  // Re-attach event listener for form submission
  newForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Form submit intercepted');
    await handleCreateBlog('published');
    return false;
  });

  // Handle draft saving
  const saveDraftButton = newForm.querySelector('#saveDraft');
  if (saveDraftButton) {
    saveDraftButton.addEventListener('click', async function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Draft save clicked');
      await handleCreateBlog('draft');
      return false;
    });
  }
}

/**
 * Add a tag to the tag container
 * @param {string} tagText - The tag text
 * @param {HTMLElement} input - The tag input element
 */
function addTag(tagText, input) {
  // Find or create tag container
  let tagContainer = document.querySelector('.tag-container');
  if (!tagContainer) {
    tagContainer = document.createElement('div');
    tagContainer.className = 'tag-container d-flex flex-wrap gap-1 mt-2';
    input.parentNode.insertBefore(tagContainer, input.nextSibling);
  }

  // Create tag element
  const tag = document.createElement('span');
  tag.className = 'badge bg-primary me-1 mb-1 d-flex align-items-center';
  tag.innerHTML = `${tagText} <button type="button" class="btn-close btn-close-white ms-2" aria-label="Remove"></button>`;
  
  // Add tag to container
  tagContainer.appendChild(tag);
  
  // Add click event to remove tag
  const closeButton = tag.querySelector('.btn-close');
  closeButton.addEventListener('click', function() {
    tag.remove();
    updateHiddenTagInput();
  });
  
  // Update the hidden input with all tags
  updateHiddenTagInput();
}

/**
 * Update the hidden input field with all current tags
 */
function updateHiddenTagInput() {
  const tagElements = document.querySelectorAll('.tag-container .badge');
  const tags = Array.from(tagElements).map(tag => {
    return tag.textContent.trim();
  });
  
  // Find or create hidden input
  let hiddenTagInput = document.querySelector('#tagsHidden');
  if (!hiddenTagInput) {
    hiddenTagInput = document.createElement('input');
    hiddenTagInput.type = 'hidden';
    hiddenTagInput.id = 'tagsHidden';
    hiddenTagInput.name = 'tagsHidden';
    document.querySelector('#tags').parentNode.appendChild(hiddenTagInput);
  }
  
  hiddenTagInput.value = JSON.stringify(tags);
}

/**
 * Refresh the authentication token
 * @returns {Promise<string>} A fresh authentication token
 */
async function refreshToken() {
  try {
    const currentToken = localStorage.getItem('authToken');
    if (!currentToken) {
      throw new Error('No authentication token found');
    }

    const response = await fetch('/api/auth/verify-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentToken}`
      }
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      // Store the new token
      const newToken = data.token.replace('Bearer ', '');
      localStorage.setItem('authToken', newToken);
      console.log('Token refreshed successfully');
      return newToken;
    } else {
      // If token is invalid, clear it and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      console.error('Token refresh failed:', data.message);
      throw new Error('Your session has expired. Please log in again.');
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
}

/**
 * Handle blog submission
 * @param {string} status - The blog status (published or draft)
 */
// New createBlog function for localStorage demo
function createBlog({ title, content, category, tags, status }) {
  // Get existing blogs from localStorage
  let blogs = JSON.parse(localStorage.getItem('blogs') || '[]');
  const id = Date.now().toString();
  const author = JSON.parse(localStorage.getItem('userData') || '{}');
  const date = new Date().toLocaleDateString();
  const newBlog = {
    id,
    title,
    content,
    category,
    tags,
    status,
    author: author.name || 'Anonymous',
    authorImage: author.avatar || '/img/default-avatar.jpg',
    date
  };
  blogs.unshift(newBlog);
  localStorage.setItem('blogs', JSON.stringify(blogs));
  return newBlog;
}

// Validate form fields and show errors
function validateBlogForm(form) {
  const title = form.querySelector('#title').value.trim();
  const category = form.querySelector('#category').value.trim();
  let content = '';
  if (typeof tinymce !== 'undefined' && tinymce.get('content')) {
    content = tinymce.get('content').getContent().trim();
  }
  if (!title) {
    showAlert('Please enter a blog title.', 'warning');
    return false;
  }
  if (!category) {
    showAlert('Please select a category.', 'warning');
    return false;
  }
  if (!content) {
    showAlert('Please enter blog content.', 'warning');
    return false;
  }
  return true;
}

// Handle create blog button
window.handleCreateBlog = async function(status) {
  console.log('handleCreateBlog called with status:', status);
  const form = document.getElementById('blogForm');
  if (!form) {
    console.error('Blog form not found');
    return;
  }

  if (!validateBlogForm(form)) {
    console.log('Form validation failed');
    return;
  }

  const token = localStorage.getItem('authToken');
  if (!token) {
    showAlert('You must be logged in to create a blog.', 'danger');
    window.location.href = '/login.html';
    return;
  }

  // Prepare form data
  const formData = new FormData();
  
  // Add basic fields
  formData.append('title', form.querySelector('#title').value.trim());
  formData.append('category', form.querySelector('#category').value.trim());
  formData.append('status', status);

  // Add content from TinyMCE
  if (typeof tinymce !== 'undefined' && tinymce.get('content')) {
    formData.append('content', tinymce.get('content').getContent().trim());
  }

  // Add tags if present
  const tagsInput = form.querySelector('#tags');
  if (tagsInput && tagsInput.value.trim()) {
    const tags = tagsInput.value.trim().split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    formData.append('tags', JSON.stringify(tags));
  }

  // Add cover image if present
  const coverImageInput = form.querySelector('#coverImage');
  if (coverImageInput && coverImageInput.files[0]) {
    formData.append('coverImage', coverImageInput.files[0]);
  }

  // Disable submit buttons
  const submitBtn = form.querySelector('button[type="submit"]');
  const saveDraftBtn = form.querySelector('#saveDraft');
  if (submitBtn) submitBtn.disabled = true;
  if (saveDraftBtn) saveDraftBtn.disabled = true;

  try {
    showAlert('Creating blog...', 'info');

    const response = await fetch('/api/blogs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    let data;
    try {
      data = await response.json();
    } catch (err) {
      console.error('Failed to parse response:', err);
      showAlert('Server returned an invalid response', 'danger');
      if (submitBtn) submitBtn.disabled = false;
      if (saveDraftBtn) saveDraftBtn.disabled = false;
      return;
    }

    if (!response.ok || !data.success) {
      showAlert(data.message || 'Failed to create blog', 'danger');
      if (submitBtn) submitBtn.disabled = false;
      if (saveDraftBtn) saveDraftBtn.disabled = false;
      return;
    }

    showAlert('Blog created successfully!', 'success');
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 800);

  } catch (error) {
    console.error('Error creating blog:', error);
    showAlert(error.message || 'Error creating blog post. Please try again.', 'danger');
  } finally {
    // Re-enable submit buttons
    if (submitBtn) submitBtn.disabled = false;
    if (saveDraftBtn) saveDraftBtn.disabled = false;
  }
}
}

/**
 * Handle comment submission
 * @param {Event} e - Form submit event
 */
async function handleCommentSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const blogId = form.dataset.blogId;
  const commentText = form.querySelector('#comment').value;
  const submitButton = form.querySelector('button[type="submit"]');
  
  if (!commentText.trim()) {
    showAlert('Please enter a comment', 'warning');
    return;
  }
  
  // Check if user is authenticated
  if (!isAuthenticated()) {
    showAlert('Please log in to comment', 'warning');
    setTimeout(() => {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    }, 1500);
    return;
  }
  
  // Update submit button
  const originalButtonText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Posting...';
  
  try {
    const response = await fetch(`/api/blogs/${blogId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({ content: commentText })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Add the new comment to the page
      addCommentToDOM(data.comment);
      
      // Clear the form
      form.reset();
      
      // Update comment count
      updateCommentCount(1);
      
      // Show success message
      showAlert('Comment posted successfully!', 'success');
    } else {
      showAlert(data.message || 'Failed to post comment. Please try again.', 'danger');
    }
  } catch (err) {
    console.error('Error posting comment:', err);
    showAlert('An error occurred. Please try again later.', 'danger');
  } finally {
    // Re-enable submit button
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  }
}

/**
 * Add a new comment to the DOM
 * @param {Object} comment - The comment object
 */
function addCommentToDOM(comment) {
  const commentsContainer = document.querySelector('.comments-container');
  if (!commentsContainer) return;
  
  // Create comment element
  const commentEl = document.createElement('div');
  commentEl.className = 'comment mb-3 p-3 border rounded';
  commentEl.dataset.commentId = comment.id;
  
  // Format date
  const date = new Date(comment.createdAt);
  const formattedDate = date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
  
  // Set comment HTML
  commentEl.innerHTML = `
    <div class="d-flex">
      <img src="${comment.user.avatar || '/img/default-avatar.png'}" alt="${comment.user.name}" class="avatar-sm me-2 rounded-circle">
      <div>
        <div class="fw-bold">${comment.user.name}</div>
        <div class="text-muted small">${formattedDate}</div>
      </div>
    </div>
    <div class="mt-2">${comment.content}</div>
  `;
  
  // Add to container at the top
  const noCommentsMessage = commentsContainer.querySelector('.no-comments');
  if (noCommentsMessage) {
    commentsContainer.removeChild(noCommentsMessage);
  }
  
  commentsContainer.prepend(commentEl);
}

/**
 * Update the comment count display
 * @param {number} increment - The amount to increment by
 */
function updateCommentCount(increment) {
  const countEl = document.querySelector('.comment-count');
  if (countEl) {
    let count = parseInt(countEl.textContent, 10) || 0;
    count += increment;
    countEl.textContent = count;
  }
}

/**
 * Initialize like buttons
 */
function initializeLikeButtons() {
  const likeButtons = document.querySelectorAll('.like-button');
  likeButtons.forEach(button => {
    button.addEventListener('click', handleLikeClick);
  });
}

/**
 * Handle like button click
 * @param {Event} e - Click event
 */
async function handleLikeClick(e) {
  e.preventDefault();
  
  // Check if user is authenticated
  if (!isAuthenticated()) {
    showAlert('Please log in to like posts', 'warning');
    setTimeout(() => {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    }, 1500);
    return;
  }
  
  const button = e.currentTarget;
  const blogId = button.dataset.blogId;
  const likeCount = button.querySelector('.like-count');
  const likeIcon = button.querySelector('i');
  
  // Optimistically update UI
  const isLiked = likeIcon.classList.contains('fas');
  
  if (isLiked) {
    likeIcon.classList.replace('fas', 'far');
    likeCount.textContent = parseInt(likeCount.textContent, 10) - 1;
  } else {
    likeIcon.classList.replace('far', 'fas');
    likeCount.textContent = parseInt(likeCount.textContent, 10) + 1;
  }
  
  try {
    const token = await getToken();
    const response = await fetch(`/api/blogs/${blogId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Revert UI changes if request failed
      if (isLiked) {
        likeIcon.classList.replace('far', 'fas');
        likeCount.textContent = parseInt(likeCount.textContent, 10) + 1;
      } else {
        likeIcon.classList.replace('fas', 'far');
        likeCount.textContent = parseInt(likeCount.textContent, 10) - 1;
      }
      showAlert(data.message || 'Failed to update like status', 'danger');
    }
  } catch (err) {
    console.error('Error updating like status:', err);
    
    // Revert UI changes if request failed
    if (isLiked) {
      likeIcon.classList.replace('far', 'fas');
      likeCount.textContent = parseInt(likeCount.textContent, 10) + 1;
    } else {
      likeIcon.classList.replace('fas', 'far');
      likeCount.textContent = parseInt(likeCount.textContent, 10) - 1;
    }
    
    showAlert('An error occurred. Please try again later.', 'danger');
  }
}

/**
 * Initialize share buttons
 */
function initializeShareButtons() {
  const shareButtons = document.querySelectorAll('.share-button');
  shareButtons.forEach(button => {
    button.addEventListener('click', handleShare);
  });
}

/**
 * Handle share button click
 * @param {Event} e - Click event
 */
function handleShare(e) {
  e.preventDefault();
  
  const button = e.currentTarget;
  const platform = button.dataset.platform;
  const blogUrl = window.location.href;
  const blogTitle = document.querySelector('h1').textContent;
  
  let shareUrl;
  
  switch (platform) {
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(blogUrl)}&text=${encodeURIComponent(blogTitle)}`;
      break;
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(blogUrl)}`;
      break;
    case 'linkedin':
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(blogUrl)}`;
      break;
    case 'email':
      shareUrl = `mailto:?subject=${encodeURIComponent(blogTitle)}&body=${encodeURIComponent(`Check out this blog post: ${blogUrl}`)}`;
      break;
    case 'copy':
      navigator.clipboard.writeText(blogUrl)
        .then(() => showAlert('Link copied to clipboard!', 'success'))
        .catch(err => {
          console.error('Failed to copy link:', err);
          showAlert('Failed to copy link. Please try again.', 'danger');
        });
      return;
  }
  
  // Open share dialog in a new window
  if (shareUrl) {
    window.open(shareUrl, '_blank', 'width=600,height=400');
  }
}

/**
 * Handle blog search
 * @param {Event} e - Form submit event
 */
function handleSearch(e) {
  e.preventDefault();
  
  const searchInput = e.target.querySelector('#searchQuery');
  const query = searchInput.value.trim();
  
  if (!query) return;
  
  // Redirect to search results page
  window.location.href = `/blogs/search?q=${encodeURIComponent(query)}`;
}

/**
 * Handle category filter click
 * @param {Event} e - Click event
 */
function handleCategoryFilter(e) {
  e.preventDefault();
  
  const category = e.currentTarget.dataset.category;
  window.location.href = `/blogs/category/${encodeURIComponent(category)}`;
}

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
function isAuthenticated() {
  return localStorage.getItem('authToken') !== null;
}

/**
 * Show alert message
 * @param {string} message - Alert message
 * @param {string} type - Alert type (success, danger, warning, info)
 */
function showAlert(message, type = 'info') {
  const alertContainer = document.getElementById('alertContainer');
  if (!alertContainer) return;

  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  alertContainer.appendChild(alert);
  
  // Auto dismiss after 5 seconds
  setTimeout(() => {
    alert.remove();
  }, 5000);
}

// Load blog data
async function loadBlog() {
  try {
    // Check if we're on a page that needs to load a specific blog
    const urlParams = new URLSearchParams(window.location.search);
    const blogId = urlParams.get('id');
    
    // If there's no blog ID in the URL and we're on the create-blog page, just return
    if (!blogId) {
      // Only show alert if we're on a page that should have a blog ID (like blog-detail.html)
      if (window.location.pathname.includes('blog-detail')) {
        showAlert('Blog ID not found', 'danger');
      }
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      window.location.href = '/login.html';
      return;
    }

    const response = await fetch(`/blogs/${blogId}`, {
      headers: {
        'Authorization': token,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = '/login.html';
        return;
      }
      throw new Error('Failed to load blog');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to load blog');
    }

    // Update page title
    document.title = `${data.blog.title} - BlogHub`;

    // Update blog content
    const blogTitle = document.getElementById('blogTitle');
    const blogContent = document.getElementById('blogContent');
    const blogMeta = document.getElementById('blogMeta');
    const authorInfo = document.getElementById('authorInfo');
    const commentsSection = document.getElementById('commentsSection');
    const relatedBlogs = document.getElementById('relatedBlogs');

    if (blogTitle) blogTitle.textContent = data.blog.title;
    if (blogContent) blogContent.innerHTML = data.blog.content;

    if (blogMeta) {
      blogMeta.innerHTML = `
        <div class="text-muted">
          <small>
            Posted by ${data.blog.author.name} on ${new Date(data.blog.createdAt).toLocaleDateString()}
            in <a href="/?category=${data.blog.category}">${data.blog.category}</a>
          </small>
        </div>
      `;
    }

    if (authorInfo) {
      authorInfo.innerHTML = `
        <div class="d-flex align-items-center">
          <img src="${data.blog.author.avatar || '/images/default-avatar.png'}" 
               alt="${data.blog.author.name}" 
               class="rounded-circle me-2" 
               style="width: 50px; height: 50px; object-fit: cover;">
          <div>
            <h5 class="mb-1">${data.blog.author.name}</h5>
            <p class="text-muted mb-0">${data.blog.author.bio || 'No bio available'}</p>
          </div>
        </div>
      `;
    }

    // Display comments
    if (commentsSection && data.comments) {
      const commentsHTML = data.comments.map(comment => `
        <div class="comment mb-3">
          <div class="d-flex">
            <img src="${comment.user.avatar || '/images/default-avatar.png'}" 
                 alt="${comment.user.name}" 
                 class="rounded-circle me-2" 
                 style="width: 40px; height: 40px; object-fit: cover;">
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between">
                <h6 class="mb-1">${comment.user.name}</h6>
                <small class="text-muted">${new Date(comment.date).toLocaleDateString()}</small>
              </div>
              <p class="mb-1">${comment.content}</p>
            </div>
          </div>
        </div>
      `).join('');
      
      commentsSection.innerHTML = commentsHTML || '<p class="text-muted">No comments yet</p>';
    }

    // Display related blogs
    if (relatedBlogs && data.relatedBlogs) {
      const relatedBlogsHTML = data.relatedBlogs.map(blog => `
        <div class="col-md-4 mb-4">
          <div class="card h-100">
            ${blog.coverImage ? `
              <img src="${blog.coverImage}" class="card-img-top" alt="${blog.title}">
            ` : ''}
            <div class="card-body">
              <h5 class="card-title">${blog.title}</h5>
              <p class="card-text">${blog.content.substring(0, 150)}...</p>
              <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted">By ${blog.author.name}</small>
                <a href="/blog-detail.html?id=${blog._id}" class="btn btn-sm btn-outline-primary">Read More</a>
              </div>
            </div>
          </div>
        </div>
      `).join('');
      
      relatedBlogs.innerHTML = relatedBlogsHTML || '<p class="text-muted">No related blogs found</p>';
    }

  } catch (err) {
    console.error('Error loading blog:', err);
    showAlert('Error loading blog. Please try again later.', 'danger');
  }
}

// Only call loadBlog on pages that need to display a specific blog
document.addEventListener('DOMContentLoaded', function() {
  // Only load blog data if we're on a page that displays a specific blog (like blog-detail.html)
  if (window.location.pathname.includes('blog-detail')) {
    loadBlog();
  }
}); 