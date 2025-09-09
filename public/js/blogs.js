// Blogs JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // Fetch all blogs when page loads
  fetchBlogs();

  // Handle sort dropdown
  const sortDropdown = document.getElementById('sortDropdown');
  if (sortDropdown) {
    sortDropdown.addEventListener('click', (e) => {
      if (e.target.classList.contains('dropdown-item')) {
        const sortBy = e.target.textContent.toLowerCase().replace(' ', '');
        fetchBlogs(sortBy);
      }
    });
  }
});

async function fetchBlogs(sort = 'mostrecent') {
  try {
    // Get query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const search = urlParams.get('search');

    // Construct URL with query parameters
    let url = '/blogs';
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    if (sort) params.append('sort', sort);
    if (params.toString()) url += '?' + params.toString();

    const response = await fetch(url);
    const blogs = await response.json();

    if (response.ok) {
      displayBlogs(blogs);
    } else {
      showAlert('Error loading blogs', 'danger');
    }
  } catch (err) {
    console.error('Error:', err);
    showAlert('Unable to load blogs. Please try again later.', 'warning');
  }
}

function displayBlogs(blogs) {
  const blogsContainer = document.querySelector('.row.g-4');
  if (!blogsContainer) return;

  if (blogs.length === 0) {
    blogsContainer.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="fas fa-search fa-3x text-muted mb-3"></i>
        <h3>No Blogs Found</h3>
        <p class="text-muted">Try adjusting your search or filters to find what you're looking for.</p>
      </div>
    `;
    return;
  }

  const blogsHTML = blogs.map(blog => `
    <div class="col-md-6 col-lg-4">
      <div class="card h-100 border-0 shadow-sm hover-shadow">
        <img src="${blog.image || blog.coverImage || '/img/placeholder.jpg'}" class="card-img-top" alt="${blog.title}" style="height: 200px; object-fit: cover;" onerror="this.src='/img/placeholder.jpg'">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="badge bg-primary">${blog.category}</span>
            <small class="text-muted"><i class="far fa-calendar me-1"></i> ${new Date(blog.createdAt).toLocaleDateString()}</small>
          </div>
          <h5 class="card-title fw-bold">${blog.title}</h5>
          <p class="card-text text-muted">${blog.content ? blog.content.substring(0, 150) + '...' : 'No content'}</p>
        </div>
        <div class="card-footer bg-transparent border-0 pt-0">
          <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center">
              <img src="${blog.author.avatar || '/img/default-avatar.jpg'}" alt="${blog.author.name}" class="rounded-circle me-2" width="32" height="32">
              <small class="text-muted">${blog.author.name}</small>
            </div>
            <a href="/blog-detail.html?id=${blog._id}" class="btn btn-sm btn-outline-primary">Read More</a>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  blogsContainer.innerHTML = blogsHTML;
}

function showAlert(message, type = 'info') {
  const alertContainer = document.querySelector('.alert-container');
  if (!alertContainer) return;

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