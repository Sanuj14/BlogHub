/**
 * BlogHub Profile JavaScript
 * Handles user profile functionality - edit profile, avatar upload, dashboard stats
 */

document.addEventListener('DOMContentLoaded', function() {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
    return;
  }

  // Initialize profile form
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', handleProfileUpdate);
  }

  // Initialize password change form
  const passwordForm = document.getElementById('passwordChangeForm');
  if (passwordForm) {
    passwordForm.addEventListener('submit', handlePasswordChange);
  }

  // Initialize avatar upload
  const avatarInput = document.getElementById('avatarUpload');
  if (avatarInput) {
    avatarInput.addEventListener('change', handleAvatarUpload);
  }

  // Initialize dashboard stats
  initializeDashboardStats();

  // Initialize blog management
  initializeBlogManagement();

  // Initialize delete account button
  const deleteAccountBtn = document.getElementById('deleteAccountBtn');
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', confirmDeleteAccount);
  }
});

/**
 * Handle profile update form submission
 * @param {Event} e - Form submit event
 */
async function handleProfileUpdate(e) {
  e.preventDefault();

  const form = e.target;
  const submitButton = form.querySelector('button[type="submit"]');
  
  // Disable submit button and show loading indicator
  const originalButtonText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';

  // Get form data
  const formData = new FormData(form);
  
  try {
    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: formData
    });

    const data = await response.json();
    
    if (response.ok) {
      // Update user info in local storage
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      userInfo.name = formData.get('name');
      userInfo.bio = formData.get('bio');
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      
      showAlert('Profile updated successfully!', 'success');
    } else {
      showAlert(data.message || 'Error updating profile', 'danger');
    }
  } catch (err) {
    console.error('Error updating profile:', err);
    showAlert('An error occurred while updating your profile', 'danger');
  } finally {
    // Re-enable submit button
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  }
}

/**
 * Handle password change form submission
 * @param {Event} e - Form submit event
 */
async function handlePasswordChange(e) {
  e.preventDefault();

  const form = e.target;
  const currentPassword = form.querySelector('#currentPassword').value;
  const newPassword = form.querySelector('#newPassword').value;
  const confirmPassword = form.querySelector('#confirmPassword').value;
  const submitButton = form.querySelector('button[type="submit"]');

  // Validate password
  if (newPassword !== confirmPassword) {
    showAlert('New passwords do not match', 'warning');
    return;
  }

  if (newPassword.length < 8) {
    showAlert('Password must be at least 8 characters long', 'warning');
    return;
  }

  // Disable submit button and show loading indicator
  const originalButtonText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Changing...';

  try {
    const response = await fetch('/api/user/password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      // Clear form
      form.reset();
      
      showAlert('Password changed successfully!', 'success');
    } else {
      showAlert(data.message || 'Error changing password', 'danger');
    }
  } catch (err) {
    console.error('Error changing password:', err);
    showAlert('An error occurred while changing your password', 'danger');
  } finally {
    // Re-enable submit button
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  }
}

/**
 * Handle avatar image upload
 * @param {Event} e - Change event
 */
async function handleAvatarUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    showAlert('Please select a valid image file (JPEG, PNG, GIF)', 'warning');
    return;
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    showAlert('Image size should be less than 2MB', 'warning');
    return;
  }

  // Create form data
  const formData = new FormData();
  formData.append('avatar', file);

  // Show loading indicator
  const avatarPreview = document.querySelector('.avatar-preview');
  if (avatarPreview) {
    avatarPreview.classList.add('uploading');
  }

  try {
    const response = await fetch('/api/user/avatar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: formData
    });

    const data = await response.json();
    
    if (response.ok) {
      // Update avatar preview
      const avatarImage = document.querySelector('.avatar-preview img');
      if (avatarImage) {
        avatarImage.src = data.avatarUrl + '?t=' + new Date().getTime();
      }
      
      // Update user info in localStorage
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      userInfo.avatar = data.avatarUrl;
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      
      showAlert('Avatar updated successfully!', 'success');
    } else {
      showAlert(data.message || 'Error uploading avatar', 'danger');
    }
  } catch (err) {
    console.error('Error uploading avatar:', err);
    showAlert('An error occurred while uploading your avatar', 'danger');
  } finally {
    // Remove loading indicator
    if (avatarPreview) {
      avatarPreview.classList.remove('uploading');
    }
  }
}

/**
 * Initialize dashboard statistics
 */
async function initializeDashboardStats() {
  const statsContainer = document.querySelector('.dashboard-stats');
  if (!statsContainer) return;

  try {
    const response = await fetch('/api/user/stats', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Update stats on the page
      const totalBlogs = document.getElementById('totalBlogs');
      const totalLikes = document.getElementById('totalLikes');
      const totalComments = document.getElementById('totalComments');
      const totalBookmarks = document.getElementById('totalBookmarks');
      
      if (totalBlogs) totalBlogs.textContent = data.blogs || 0;
      if (totalLikes) totalLikes.textContent = data.likes || 0;
      if (totalComments) totalComments.textContent = data.comments || 0;
      if (totalBookmarks) totalBookmarks.textContent = data.bookmarks || 0;
      
      // Remove loading indicators
      const loadingIndicators = statsContainer.querySelectorAll('.loading');
      loadingIndicators.forEach(indicator => {
        indicator.classList.remove('loading');
      });
    }
  } catch (err) {
    console.error('Error fetching stats:', err);
    showAlert('Could not load dashboard statistics', 'warning');
  }
}

/**
 * Initialize blog management functionality
 */
function initializeBlogManagement() {
  // Set up delete buttons
  const deleteButtons = document.querySelectorAll('.delete-blog-btn');
  deleteButtons.forEach(button => {
    button.addEventListener('click', confirmDeleteBlog);
  });
  
  // Set up edit buttons
  const editButtons = document.querySelectorAll('.edit-blog-btn');
  editButtons.forEach(button => {
    button.addEventListener('click', function() {
      const blogId = this.getAttribute('data-blog-id');
      window.location.href = `/blogs/edit/${blogId}`;
    });
  });
}

/**
 * Confirm blog deletion
 * @param {Event} e - Click event
 */
function confirmDeleteBlog(e) {
  const button = e.currentTarget;
  const blogId = button.getAttribute('data-blog-id');
  const blogTitle = button.getAttribute('data-blog-title');
  
  // Check if Bootstrap modal exists
  if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
    const confirmModal = document.getElementById('deleteBlogModal');
    if (confirmModal) {
      // Set blog ID in modal
      const confirmButton = confirmModal.querySelector('.confirm-delete-btn');
      confirmButton.setAttribute('data-blog-id', blogId);
      
      // Set blog title in modal
      const modalTitle = confirmModal.querySelector('.modal-body p');
      if (modalTitle) {
        modalTitle.textContent = `Are you sure you want to delete "${blogTitle}"? This action cannot be undone.`;
      }
      
      // Show modal
      const modal = new bootstrap.Modal(confirmModal);
      modal.show();
      
      // Set up confirm button if not already set up
      if (!confirmButton.hasEventListener) {
        confirmButton.addEventListener('click', handleDeleteBlog);
        confirmButton.hasEventListener = true;
      }
      
      return;
    }
  }
  
  // Fallback to confirm dialog
  if (confirm(`Are you sure you want to delete "${blogTitle}"? This action cannot be undone.`)) {
    deleteBlog(blogId);
  }
}

/**
 * Handle blog deletion from modal
 * @param {Event} e - Click event
 */
function handleDeleteBlog(e) {
  const button = e.currentTarget;
  const blogId = button.getAttribute('data-blog-id');
  
  // Close modal
  if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteBlogModal'));
    if (modal) {
      modal.hide();
    }
  }
  
  // Delete blog
  deleteBlog(blogId);
}

/**
 * Delete a blog post
 * @param {string} blogId - Blog ID to delete
 */
async function deleteBlog(blogId) {
  try {
    const response = await fetch(`/api/blogs/${blogId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Remove blog from list
      const blogItem = document.querySelector(`[data-blog-id="${blogId}"]`).closest('.blog-item');
      if (blogItem) {
        blogItem.remove();
      }
      
      // Update statistics
      const totalBlogsElement = document.getElementById('totalBlogs');
      if (totalBlogsElement) {
        const currentCount = parseInt(totalBlogsElement.textContent, 10);
        totalBlogsElement.textContent = currentCount - 1;
      }
      
      showAlert('Blog deleted successfully!', 'success');
    } else {
      showAlert(data.message || 'Error deleting blog', 'danger');
    }
  } catch (err) {
    console.error('Error deleting blog:', err);
    showAlert('An error occurred while deleting the blog', 'danger');
  }
}

/**
 * Confirm account deletion
 */
function confirmDeleteAccount() {
  // Check if Bootstrap modal exists
  if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
    const confirmModal = document.getElementById('deleteAccountModal');
    if (confirmModal) {
      // Show modal
      const modal = new bootstrap.Modal(confirmModal);
      modal.show();
      
      // Set up confirm button if not already set up
      const confirmButton = confirmModal.querySelector('.confirm-delete-account-btn');
      if (confirmButton && !confirmButton.hasEventListener) {
        confirmButton.addEventListener('click', handleDeleteAccount);
        confirmButton.hasEventListener = true;
      }
      
      return;
    }
  }
  
  // Fallback to confirm dialog
  if (confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.')) {
    deleteAccount();
  }
}

/**
 * Handle account deletion from modal
 */
function handleDeleteAccount() {
  // Close modal
  if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteAccountModal'));
    if (modal) {
      modal.hide();
    }
  }
  
  // Delete account
  deleteAccount();
}

/**
 * Delete user account
 */
async function deleteAccount() {
  try {
    const response = await fetch('/api/user', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userInfo');
      
      // Redirect to home page
      window.location.href = '/?deleted=true';
    } else {
      showAlert(data.message || 'Error deleting account', 'danger');
    }
  } catch (err) {
    console.error('Error deleting account:', err);
    showAlert('An error occurred while deleting your account', 'danger');
  }
}

/**
 * Show alert message
 * @param {string} message - Alert message
 * @param {string} type - Alert type (success, danger, warning, info)
 */
function showAlert(message, type = 'info') {
  // Check if there's a toast container
  let toastContainer = document.querySelector('.toast-container');
  
  // Create container if it doesn't exist
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(toastContainer);
  }
  
  // Create toast element
  const toastId = `toast-${Date.now()}`;
  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
  toastEl.id = toastId;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');
  
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  
  // Add toast to container
  toastContainer.appendChild(toastEl);
  
  // Initialize and show toast if Bootstrap is available
  if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
    const toast = new bootstrap.Toast(toastEl, {
      autohide: true,
      delay: 5000
    });
    toast.show();
  } else {
    // Fallback if Bootstrap is not available
    toastEl.style.display = 'block';
    setTimeout(() => {
      toastEl.remove();
    }, 5000);
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
function isAuthenticated() {
  return localStorage.getItem('authToken') !== null;
} 