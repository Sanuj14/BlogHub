/**
 * BlogHub Home JavaScript
 * Handles home page functionality including featured blogs, latest posts, and contact form
 */

document.addEventListener('DOMContentLoaded', function() {
  // Load featured blogs
  loadFeaturedBlogs();
  
  // Handle contact form submission if on homepage
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', handleContactFormSubmit);
  }
  
  // Initialize UI based on authentication status
  updateAuthUI();
});

/**
 * Load featured blogs from the API or use sample blogs if API fails
 */
async function loadFeaturedBlogs() {
  const container = document.querySelector('.featured-blogs-container');
  if (!container) return;
  
  try {
    // Try to fetch featured blogs from the API
    const response = await fetch('/api/blogs/featured');
    
    // Check if the request was successful
    if (response.ok) {
      const data = await response.json();
      displayBlogs(data.blogs, container);
    } else {
      // If API fails, show sample blogs
      displaySampleBlogs(container);
    }
  } catch (err) {
    console.error('Error loading featured blogs:', err);
    // Show sample blogs on error
    displaySampleBlogs(container);
  }
}

/**
 * Display blogs in the container
 * @param {Array} blogs - Array of blog objects
 * @param {HTMLElement} container - The container element
 */
function displayBlogs(blogs, container) {
  // Clear loading spinner
  container.innerHTML = '';
  
  if (!blogs || blogs.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <p class="text-muted">No featured blogs found.</p>
      </div>
    `;
    return;
  }
  
  // Create blog cards
  blogs.forEach(blog => {
    const blogCard = createBlogCard(blog);
    container.appendChild(blogCard);
  });
}

/**
 * Create a blog card element
 * @param {Object} blog - Blog data
 * @returns {HTMLElement} Blog card element
 */
function createBlogCard(blog) {
  // Create column element
  const col = document.createElement('div');
  col.className = 'col-md-6 col-lg-3';
  
  // Create card HTML
  const date = new Date(blog.date || blog.createdAt);
  
  // Truncate the content
  const truncatedContent = truncateText(blog.content, 80);
  
  col.innerHTML = `
    <div class="card h-100 border-0 shadow-sm hover-shadow transition">
      <div class="blog-img-container position-relative">
        <img src="${blog.coverImage || '/img/default-blog-cover.jpg'}" class="card-img-top" alt="${blog.title}" onerror="handleImageError(this)">
      </div>
      <div class="card-body">
        <h5 class="card-title">${blog.title}</h5>
        <p class="card-text text-muted">${truncatedContent}</p>
      </div>
      <div class="card-footer bg-white border-0">
        <div class="tags mb-3">
          <span class="badge bg-primary">${blog.category}</span>
        </div>
        <div class="d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center">
            <img src="${blog.author?.avatar || '/img/default-avatar.jpg'}" alt="${blog.author?.name || 'Author'}" class="rounded-circle me-2" width="30" height="30">
            <small class="text-muted">${blog.author?.name || 'Anonymous'}</small>
          </div>
          <small class="text-muted">${date.toLocaleDateString()}</small>
        </div>
        <a href="/blogs/${blog.slug || blog._id}" class="btn btn-outline-primary btn-sm w-100 mt-3">Read More</a>
      </div>
    </div>
  `;
  
  return col;
}

/**
 * Display sample blogs when API fails
 * @param {HTMLElement} container - The container element
 */
function displaySampleBlogs(container) {
  // Clear loading spinner
  container.innerHTML = '';
  
  // Sample blog data
  const sampleBlogs = [
    {
      title: "Exploring the Beauty of Nature",
      content: "Discover the wonders of the natural world and learn how to connect with the environment around you.",
      category: "Lifestyle",
      author: { name: "Clash", avatar: "/img/user-profile.png" },
      coverImage: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
      date: new Date().setDate(new Date().getDate() - 3),
      slug: "exploring-the-beauty-of-nature"
    },
    {
      title: "The Rise of Modern Technology",
      content: "A look into how technology is shaping our future and impacting everyday life in unexpected ways.",
      category: "Technology",
      author: { name: "Devesh", avatar: "/img/user-profile.png" },
      coverImage: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
      date: new Date().setDate(new Date().getDate() - 1),
      slug: "the-rise-of-modern-technology"
    },
    {
      title: "Adventures Around the Globe",
      content: "Join me as I travel to breathtaking destinations and share tips for making the most of your journeys.",
      category: "Travel",
      author: { name: "Ansh Jerath", avatar: "/img/user-profile.png" },
      coverImage: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
        avatar: "https://ui-avatars.com/api/?name=Ansh+Jerath&background=random" 
      },
      date: new Date().setDate(new Date().getDate() - 7),
      slug: "healthy-habits-improve-wellbeing"
    },
    {
      title: "The Future of Artificial Intelligence",
      content: "Artificial Intelligence is reshaping our world at an unprecedented pace. Explore how AI is changing industries, creating new opportunities, and the ethical considerations we must address as technology advances.",
      category: "Technology",
      coverImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      author: { 
        name: "Kartik Chauhan", 
        avatar: "https://ui-avatars.com/api/?name=Kartik+Chauhan&background=random" 
      },
      date: new Date().setDate(new Date().getDate() - 10),
      slug: "future-of-artificial-intelligence"
    }
  ];
  
  // Display sample blogs
  displayBlogs(sampleBlogs, container);
}

/**
 * Handle contact form submission
 * @param {Event} e - Form submit event
 */
async function handleContactFormSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.innerHTML;
  
  // Disable submit button
  submitButton.disabled = true;
  submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';
  
  // Get form data
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      showAlert('Thank you for your message! We will get back to you soon.', 'success');
      form.reset();
    } else {
      showAlert(result.message || 'Failed to send message. Please try again.', 'danger');
    }
  } catch (err) {
    console.error('Error sending contact form:', err);
    showAlert('An error occurred. Please try again later.', 'danger');
  } finally {
    // Re-enable submit button
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonText;
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
  
  // Strip HTML tags
  const plainText = text.replace(/<[^>]*>/g, '');
  
  if (plainText.length <= length) return plainText;
  
  // Truncate and add ellipsis
  return plainText.substring(0, length) + '...';
}

/**
 * Show alert message
 * @param {string} message - Message to display
 * @param {string} type - Alert type (success, danger, warning, info)
 */
function showAlert(message, type = 'info') {
  // Look for existing alert container
  const alertContainer = document.querySelector('.alert-container');
  if (!alertContainer) return;
  
  // Create alert element
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  // Add to container
  alertContainer.appendChild(alertDiv);
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    if (alertDiv.parentNode) {
      const bsAlert = new bootstrap.Alert(alertDiv);
      bsAlert.close();
    }
  }, 5000);
}

/**
 * Update UI based on authentication status
 */
function updateAuthUI() {
  const isLoggedIn = localStorage.getItem('authToken') !== null;
  
  // Show/hide elements based on authentication
  document.querySelectorAll('.logged-in').forEach(el => {
    el.style.display = isLoggedIn ? 'block' : 'none';
  });
  
  document.querySelectorAll('.logged-out').forEach(el => {
    el.style.display = isLoggedIn ? 'none' : 'block';
  });
  
  // Update dropdown if logged in
  if (isLoggedIn) {
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      // Update username in navbar
      const usernameEls = document.querySelectorAll('.username');
      usernameEls.forEach(el => {
        el.textContent = userData.name || 'User';
      });
      
      // Update user avatar
      const userAvatars = document.querySelectorAll('.user-dropdown img');
      userAvatars.forEach(avatar => {
        avatar.src = userData.avatar || '/img/default-avatar.jpg';
      });
    } catch (err) {
      console.error('Error parsing user data:', err);
    }
  }
} 