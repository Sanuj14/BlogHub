/**
 * main.js - Main JavaScript file for BlogHub
 * Contains utility functions and global event handlers
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  if (tooltipTriggerList.length) {
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }

  // Initialize popovers
  const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
  if (popoverTriggerList.length) {
    popoverTriggerList.map(function (popoverTriggerEl) {
      return new bootstrap.Popover(popoverTriggerEl);
    });
  }

  // Add smooth scrolling to all links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      
      if (href !== "#" && href.startsWith('#')) {
        e.preventDefault();
        
        const targetElement = document.querySelector(this.getAttribute('href'));
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth'
          });
        }
      }
    });
  });

  // Initialize any components that need JavaScript functionality
  initializeComponents();

  // Add active class to current nav item
  highlightCurrentNavItem();

  // Initialize forms with validation
  initializeForms();

  // Replace all avatar images on page load
  document.querySelectorAll('img[src*="default-avatar.jpg"]').forEach(function(img) {
    img.src = '/img/user-profile.png';
  });
  
  // Create an observer for dynamically loaded content
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) { // Element node
            const avatars = node.querySelectorAll ? 
              node.querySelectorAll('img[src*="default-avatar.jpg"]') : [];
            
            avatars.forEach(function(img) {
              img.src = '/img/user-profile.png';
            });
            
            // Also update avatar class images
            const avatarClass = node.querySelectorAll ? 
              node.querySelectorAll('.avatar') : [];
            
            avatarClass.forEach(function(img) {
              img.src = '/img/user-profile.png';
            });
          }
        });
      }
    });
  });
  
  // Observe the entire body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Check authentication on page load
  checkAuth();
});

/**
 * Initialize various components on the page
 */
function initializeComponents() {
  // Smooth scrolling for anchor links
  document.querySelectorAll('a.scroll-link').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 70, // Adjust for fixed header
          behavior: 'smooth'
        });
      }
    });
  });
}

/**
 * Highlight the current navigation item based on URL
 */
function highlightCurrentNavItem() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    
    // Skip dropdown toggles
    if (link.classList.contains('dropdown-toggle')) return;
    
    // Exact match for home page
    if (href === '/' && currentPath === '/') {
      link.classList.add('active');
    } 
    // Path starts with the href (but not the home page with other paths)
    else if (href !== '/' && currentPath.startsWith(href)) {
      link.classList.add('active');
      
      // If it's in a dropdown, also highlight the parent
      const parentDropdown = link.closest('.dropdown');
      if (parentDropdown) {
        const dropdownToggle = parentDropdown.querySelector('.dropdown-toggle');
        if (dropdownToggle) {
          dropdownToggle.classList.add('active');
        }
      }
    }
  });
}

/**
 * Add validation to forms
 */
function initializeForms() {
  // Get all forms with the 'needs-validation' class
  const forms = document.querySelectorAll('.needs-validation');
  
  // Loop over them and prevent submission if validation fails
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      form.classList.add('was-validated');
    }, false);
  });
}

/**
 * Format date string to a readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

/**
 * Format timestamp to relative time (e.g., "5 minutes ago")
 * @param {string} timestamp - ISO date string
 * @returns {string} Relative time
 */
function timeAgo(timestamp) {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  
  // Convert to seconds, minutes, hours, days
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(timestamp);
  }
}

/**
 * Truncate text to a specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, length) {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * Create an API request with proper authentication
 * @param {string} url - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise} Fetch promise
 */
async function apiRequest(url, options = {}) {
  const token = localStorage.getItem('authToken');
  
  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Add auth token if available
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  // Make the request
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  return response;
}

// Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('authToken');
    const currentPath = window.location.pathname;
    
    // If on login or register page and has token, redirect to dashboard
    if ((currentPath.includes('login.html') || currentPath.includes('register.html') || 
         currentPath.includes('/users/login') || currentPath.includes('/users/register')) && token) {
        window.location.href = '/dashboard.html';
        return;
    }
    
    // If not on login/register and no token, redirect to login
    if (!token && !currentPath.includes('login.html') && !currentPath.includes('register.html') && 
        !currentPath.includes('/users/login') && !currentPath.includes('/users/register') && 
        !currentPath.includes('index.html') && currentPath !== '/') {
        window.location.href = '/users/login';
        return;
    }
    
    // Update UI based on authentication state
    updateAuthUI();
}

// Update UI based on authentication state
function updateAuthUI() {
  console.log('Updating auth UI...');
  const token = localStorage.getItem('authToken');
  console.log('Auth token from localStorage:', token ? 'Token exists' : 'No token found');
  
  const userData = localStorage.getItem('userData');
  console.log('User data from localStorage:', userData ? 'User data exists' : 'No user data found');
  
  const loggedInElements = document.querySelectorAll('.logged-in');
  const loggedOutElements = document.querySelectorAll('.logged-out');
  
  if (token && userData) {
    console.log('User is logged in, showing logged-in elements');
    loggedInElements.forEach(el => el.style.display = 'block');
    loggedOutElements.forEach(el => el.style.display = 'none');
    
    // Update user-specific elements
    const user = JSON.parse(userData);
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(el => {
      el.textContent = user.name;
    });
  } else {
    console.log('User is not logged in, showing logged-out elements');
    loggedInElements.forEach(el => el.style.display = 'none');
    loggedOutElements.forEach(el => el.style.display = 'block');
  }
}

// Handle logout
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = '/users/login';
}

// Add token to all API requests
function addAuthHeader(headers = {}) {
    const token = localStorage.getItem('authToken');
    if (token) {
        return {
            ...headers,
            'Authorization': `Bearer ${token}`
        };
    }
    return headers;
} 