// Dashboard JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // Check if user is authenticated
  const token = localStorage.getItem('authToken');
  const userData = JSON.parse(localStorage.getItem('userData'));

  if (!token || !userData) {
    console.log('No token or user data found, redirecting to login');
    window.location.href = '/login.html';
  } else {
    console.log('User is authenticated, loading dashboard');
    // Update welcome message
    document.getElementById('welcomeMessage').textContent = `Welcome, ${userData.name}!`;
    
    // Fetch and display user's blogs
    fetchBlogs();
  }
});

async function fetchBlogs() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('Fetching blogs with token:', token.substring(0, 20) + '...');
    const response = await fetch('/api/blogs/user', {
      headers: {
        'Authorization': token,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.log('Token expired or invalid, redirecting to login');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = '/login.html';
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Invalid content type:', contentType);
      throw new Error('Server returned non-JSON response');
    }

    const data = await response.json();
    console.log('Received blogs data:', data);
    if (data.success && data.blogs) {
      displayBlogs(data.blogs);
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error fetching blogs:', error);
    showAlert('Error loading blogs. Please try again.', 'danger');
  }
}

async function deleteBlog(blogId) {
  if (!confirm('Are you sure you want to delete this blog?')) {
    return;
  }

  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('Deleting blog:', blogId);
    const response = await fetch(`/blogs/${blogId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.log('Token expired or invalid, redirecting to login');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = '/login.html';
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Invalid content type:', contentType);
      throw new Error('Server returned non-JSON response');
    }

    const data = await response.json();
    console.log('Delete response:', data);
    if (data.success) {
      showAlert('Blog deleted successfully!', 'success');
      fetchBlogs(); // Refresh the blog list
    } else {
      throw new Error(data.message || 'Failed to delete blog');
    }
  } catch (error) {
    console.error('Error deleting blog:', error);
    showAlert('Error deleting blog. Please try again.', 'danger');
  }
}

function showAlert(message, type) {
  const alertContainer = document.querySelector('.alert-container');
  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  alertContainer.appendChild(alert);

  // Remove alert after 5 seconds
  setTimeout(() => {
    alert.remove();
  }, 5000);
}

// Handle logout
function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  window.location.href = '/login.html';
}

function displayBlogs(blogs) {
  const blogsContainer = document.getElementById('blogsContainer');
  if (!blogsContainer) {
    console.error('Blogs container not found');
    return;
  }

  if (!blogs || blogs.length === 0) {
    blogsContainer.innerHTML = `
      <div class="text-center py-5">
        <h3>No blogs yet</h3>
        <p>Start writing your first blog post!</p>
        <a href="/create-blog.html" class="btn btn-primary">Create Blog</a>
      </div>
    `;
    return;
  }

  const blogsHTML = blogs.map(blog => `
    <div class="col-12 mb-4">
      <div class="card h-100">
        <div class="row g-0">
          ${blog.image ? `
            <div class="col-md-4">
              <img src="${blog.image}" class="img-fluid rounded-start h-100 object-fit-cover" alt="${blog.title}" style="max-height: 200px;">
            </div>
          ` : ''}
          <div class="col-md-${blog.image ? '8' : '12'}">
            <div class="card-body">
              <h5 class="card-title">${blog.title}</h5>
              <p class="card-text">${blog.excerpt || blog.content.substring(0, 150) + '...'}</p>
              <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted">${new Date(blog.createdAt).toLocaleDateString()}</small>
                <div class="btn-group">
                  <a href="/blog/${blog.slug}" class="btn btn-sm btn-outline-primary">View</a>
                  <a href="/edit-blog.html?id=${blog._id}" class="btn btn-sm btn-outline-secondary">Edit</a>
                  <button onclick="deleteBlog('${blog._id}')" class="btn btn-sm btn-outline-danger">Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  blogsContainer.innerHTML = blogsHTML;
} 