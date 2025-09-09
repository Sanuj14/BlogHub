/**
 * BlogHub Authentication JavaScript
 * Handles login, registration, password reset and authentication state
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Initialize registration form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegistration);
  }

  // Initialize forgot password form
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', handleForgotPassword);
  }

  // Initialize reset password form
  const resetPasswordForm = document.getElementById('resetPasswordForm');
  if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', handleResetPassword);
  }

  // Initialize logout buttons
  const logoutButtons = document.querySelectorAll('.logout-link');
  logoutButtons.forEach(button => {
    button.addEventListener('click', handleLogout);
  });

  // Update UI based on auth state
  updateAuthUI();
});

/**
 * Handle login form submission
 * @param {Event} e - Form submit event
 */
async function handleLogin(e) {
  e.preventDefault();

  const form = e.target;
  const emailInput = form.querySelector('#email');
  const passwordInput = form.querySelector('#password');
  const rememberMe = form.querySelector('#rememberMe')?.checked || false;
  const submitButton = form.querySelector('button[type="submit"]');
  
  // Log login attempt (excluding password for security)
  console.log('Login attempt for email:', emailInput.value);
  
  // Validate inputs
  if (!emailInput.value || !passwordInput.value) {
    console.log('Missing email or password');
    showAlert('Please enter both email and password', 'warning');
    return;
  }

  // Disable submit button and show loading indicator
  const originalButtonText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';

  try {
    console.log('Sending login request to simple endpoint');
    const response = await fetch('/api/auth/login-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: emailInput.value,
        password: passwordInput.value,
        rememberMe
      })
    });

    const data = await response.json();
    console.log('Login response status:', response.status);
    
    if (response.ok) {
      console.log('Login successful, storing token and user data');
      // Store token and user data in localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify({
        id: data.user.id,
        name: data.user.name,
        username: data.user.username,
        email: data.user.email,
        role: data.user.role
      }));
      
      // Update UI
      updateAuthUI();
      
      console.log('Redirecting to dashboard');
      // Redirect to dashboard
      window.location.href = '/dashboard.html';
    } else {
      console.error('Login failed:', data.message);
      showAlert(data.message || 'Login failed. Please check your credentials.', 'danger');
      // Re-enable submit button
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  } catch (err) {
    console.error('Login error:', err);
    showAlert('An error occurred during login. Please try again later.', 'danger');
    // Re-enable submit button
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  }
}

/**
 * Handle registration form submission
 * @param {Event} e - Form submit event
 */
async function handleRegistration(e) {
  e.preventDefault();

  const form = e.target;
  const nameInput = form.querySelector('#name');
  const usernameInput = form.querySelector('#username');
  const emailInput = form.querySelector('#email');
  const passwordInput = form.querySelector('#password');
  const confirmPasswordInput = form.querySelector('#confirmPassword');
  const submitButton = form.querySelector('button[type="submit"]');
  
  // Log registration attempt (excluding password for security)
  console.log('Registration form submitted:', { 
    name: nameInput.value, 
    username: usernameInput.value, 
    email: emailInput.value 
  });
  
  // Validate inputs
  if (!nameInput.value || !usernameInput.value || !emailInput.value || !passwordInput.value || !confirmPasswordInput.value) {
    console.log('Missing required fields');
    showAlert('Please fill in all fields', 'warning');
    return;
  }

  // Validate username format
  const usernamePattern = /^[a-zA-Z0-9_]{3,}$/;
  if (!usernamePattern.test(usernameInput.value)) {
    console.log('Invalid username format');
    showAlert('Username must be at least 3 characters long and can only contain letters, numbers, and underscores', 'warning');
    return;
  }

  if (passwordInput.value !== confirmPasswordInput.value) {
    console.log('Passwords do not match');
    showAlert('Passwords do not match', 'warning');
    return;
  }

  // Disable submit button and show loading indicator
  const originalButtonText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registering...';

  try {
    console.log('Sending registration request');
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: nameInput.value,
        username: usernameInput.value,
        email: emailInput.value,
        password: passwordInput.value
      })
    });

    const data = await response.json();
    console.log('Registration response:', data);
    
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    
    // Store auth token and user data
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('userData', JSON.stringify(data.user));
    
    console.log('Registration successful, redirecting to dashboard');
    window.location.href = '/dashboard.html';
  } catch (error) {
    console.error('Registration error:', error);
    showAlert(error.message || 'Registration failed. Please try again.', 'danger');
  } finally {
    // Re-enable submit button
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  }
}

/**
 * Handle forgot password form submission
 * @param {Event} e - Form submit event
 */
async function handleForgotPassword(e) {
  e.preventDefault();

  const form = e.target;
  const emailInput = form.querySelector('#email');
  const submitButton = form.querySelector('button[type="submit"]');
  
  // Validate input
  if (!emailInput.value) {
    showAlert('Please enter your email address', 'warning');
    return;
  }

  // Disable submit button and show loading indicator
  const originalButtonText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';

  try {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: emailInput.value
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      // Display success message
      form.innerHTML = `
        <div class="alert alert-success">
          <h5 class="alert-heading">Reset Email Sent!</h5>
          <p>We've sent a password reset link to ${emailInput.value}. Please check your inbox and follow the instructions to reset your password.</p>
          <p>Didn't receive the email? Check your spam folder or <a href="javascript:void(0)" onclick="resetForgotPasswordForm()">try again</a>.</p>
        </div>
      `;
    } else {
      showAlert(data.message || 'Failed to process your request. Please try again.', 'danger');
      // Re-enable submit button
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    showAlert('An error occurred. Please try again later.', 'danger');
    // Re-enable submit button
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  }
}

/**
 * Reset the forgot password form to its original state
 */
function resetForgotPasswordForm() {
  const container = document.querySelector('.auth-container');
  if (container) {
    window.location.href = '/users/forgot-password';
  }
}

/**
 * Handle reset password form submission
 * @param {Event} e - Form submit event
 */
async function handleResetPassword(e) {
  e.preventDefault();

  const form = e.target;
  const passwordInput = form.querySelector('#password');
  const confirmPasswordInput = form.querySelector('#confirmPassword');
  const submitButton = form.querySelector('button[type="submit"]');
  
  // Get token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (!token) {
    showAlert('Invalid password reset link. Please request a new one.', 'danger');
    return;
  }

  // Validate inputs
  if (!passwordInput.value || !confirmPasswordInput.value) {
    showAlert('Please fill in all fields', 'warning');
    return;
  }

  if (passwordInput.value !== confirmPasswordInput.value) {
    showAlert('Passwords do not match', 'warning');
    return;
  }

  if (passwordInput.value.length < 8) {
    showAlert('Password must be at least 8 characters long', 'warning');
    return;
  }

  // Disable submit button and show loading indicator
  const originalButtonText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Resetting...';

  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        password: passwordInput.value
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      // Display success message
      form.innerHTML = `
        <div class="alert alert-success">
          <h5 class="alert-heading">Password Reset Successful!</h5>
          <p>Your password has been reset successfully.</p>
          <p>You can now <a href="/login">log in</a> with your new password.</p>
        </div>
      `;
    } else {
      showAlert(data.message || 'Failed to reset password. Please try again.', 'danger');
      // Re-enable submit button
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  } catch (err) {
    console.error('Reset password error:', err);
    showAlert('An error occurred. Please try again later.', 'danger');
    // Re-enable submit button
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  }
}

/**
 * Handle user logout
 * @param {Event} e - Click event
 */
function handleLogout(e) {
  if (e) e.preventDefault();
  
  // Clear authentication data
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  
  // Redirect to home page
  window.location.href = '/';
}

/**
 * Update UI elements based on authentication state
 */
function updateAuthUI() {
  const isLoggedIn = isAuthenticated();
  
  // Get user info from local storage
  const userInfo = isLoggedIn ? JSON.parse(localStorage.getItem('userData') || '{}') : null;
  
  // Show/hide elements with .logged-in and .logged-out classes
  document.querySelectorAll('.logged-in').forEach(el => {
    el.style.display = isLoggedIn ? '' : 'none';
  });
  
  document.querySelectorAll('.logged-out').forEach(el => {
    el.style.display = isLoggedIn ? 'none' : '';
  });
  
  // Update username in dropdown if user is logged in
  if (isLoggedIn && userInfo) {
    const usernameElements = document.querySelectorAll('.username');
    usernameElements.forEach(el => {
      el.textContent = userInfo.name;
    });
  }
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
  // Look for alert container inside the form
  const form = document.querySelector('#loginForm, #registerForm, #forgotPasswordForm, #resetPasswordForm');
  let alertContainer = form ? form.querySelector('.alert-container') : document.querySelector('.alert-container');
  
  // Create container if it doesn't exist
  if (!alertContainer) {
    alertContainer = document.createElement('div');
    alertContainer.className = 'alert-container mt-3';
    
    if (form) {
      form.prepend(alertContainer);
    } else {
      // Create a floating alert using bootstrap toast if not in a form
      return showToast(message, type);
    }
  }
  
  // Create alert element
  const alertEl = document.createElement('div');
  alertEl.className = `alert alert-${type} alert-dismissible fade show`;
  alertEl.setAttribute('role', 'alert');
  
  alertEl.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  // Clear previous alerts
  alertContainer.innerHTML = '';
  
  // Add alert to container
  alertContainer.appendChild(alertEl);
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    try {
      if (typeof bootstrap !== 'undefined' && bootstrap.Alert) {
        const bsAlert = new bootstrap.Alert(alertEl);
        bsAlert.close();
      } else {
        alertEl.remove();
      }
    } catch (e) {
      alertEl.remove();
    }
  }, 5000);
}

/**
 * Show toast notification
 * @param {string} message - Message to display 
 * @param {string} type - Message type (success, danger, warning, info)
 */
function showToast(message, type = 'info') {
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

async function getUserData() {
  try {
    const response = await fetch('/users/api/auth/user', {
      headers: {
        'Authorization': localStorage.getItem('authToken')
      }
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      console.error('Failed to get user data:', await response.text());
      return null;
    }
  } catch (err) {
    console.error('Error fetching user data:', err);
    return null;
  }
} 