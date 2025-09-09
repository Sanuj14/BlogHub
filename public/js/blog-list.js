/**
 * BlogHub Blog List JavaScript
 * Handles blog listing page functionality
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize blog list
  loadBlogs();
});

async function loadBlogs() {
  try {
    const response = await fetch('/api/blogs');
    let blogs = [];
    if (response.ok) {
      blogs = await response.json();
    }
    // If no blogs from API, use sample blogs
    if (!blogs || blogs.length === 0) {
      blogs = [
        {
          _id: "1",
          title: "The Future of Artificial Intelligence in Healthcare",
          content: "Exploring how AI technologies are revolutionizing medical diagnoses, treatment plans, and patient care in modern healthcare systems.",
          category: "Technology",
          tags: ["AI", "Healthcare", "Innovation"],
          author: { name: "Arjun Kapoor", avatar: "/img/default-avatar.png" },
          createdAt: "2025-04-09T00:00:00.000Z",
          image: "https://source.unsplash.com/featured/?healthcare,technology",
          views: 150
        },
        {
          _id: "2",
          title: "Hidden Gems of Northeast India: Unexplored Paradise",
          content: "Discover the breathtaking landscapes, rich cultural heritage, and unique experiences waiting in the lesser-known regions of Northeast India.",
          category: "Travel",
          tags: ["Travel", "India", "Adventure"],
          author: { name: "Priya Sharma", avatar: "/img/default-avatar.png" },
          createdAt: "2025-04-08T00:00:00.000Z",
          image: "https://source.unsplash.com/featured/?india,travel",
          views: 200
        },
        {
          _id: "3",
          title: "Traditional Indian Street Foods You Must Try",
          content: "A culinary journey through the vibrant streets of India, exploring iconic street foods that have captured the hearts and taste buds of people worldwide.",
          category: "Food",
          tags: ["Food", "Street Food", "Culture"],
          author: { name: "Rahul Mehta", avatar: "/img/default-avatar.png" },
          createdAt: "2025-04-07T00:00:00.000Z",
          image: "https://source.unsplash.com/featured/?food,indian",
          views: 180
        },
        {
          _id: "4",
          title: "Mastering Remote Work: Tips & Tools",
          content: "Remote work is here to stay. Learn how to maximize productivity and maintain work-life balance from anywhere.",
          category: "Lifestyle",
          tags: ["Remote Work", "Productivity"],
          author: { name: "Simran Kaur", avatar: "/img/default-avatar.png" },
          createdAt: "2025-04-06T00:00:00.000Z",
          image: "https://source.unsplash.com/random/600x400?remote",
          views: 130
        },
        {
          _id: "5",
          title: "The Rise of Electric Vehicles in India",
          content: "An in-depth look at the growing electric vehicle market in India, government initiatives, challenges, and the road ahead for sustainable transportation.",
          category: "Technology",
          tags: ["EV", "Sustainability", "India"],
          author: { name: "Amit Verma", avatar: "/img/default-avatar.png" },
          createdAt: "2025-04-05T00:00:00.000Z",
          image: "https://source.unsplash.com/featured/?electric,vehicle",
          views: 210
        },
        {
          _id: "6",
          title: "Yoga for a Healthy Mind and Body",
          content: "Discover the benefits of yoga and how it can help you achieve a healthier lifestyle, both mentally and physically.",
          category: "Lifestyle",
          tags: ["Yoga", "Health", "Wellness"],
          author: { name: "Neha Joshi", avatar: "/img/default-avatar.png" },
          createdAt: "2025-04-04T00:00:00.000Z",
          image: "https://source.unsplash.com/featured/?yoga,wellness",
          views: 175
        }
      ];
    }
    displayBlogs(blogs);
  } catch (error) {
    console.error('Error loading blogs:', error);
    showAlert('Error loading blogs. Please try again later.', 'danger');
  }

}

function showNoBlogsMessage() {
  const blogContainer = document.getElementById('blogContainer');
  if (!blogContainer) return;

  blogContainer.innerHTML = `
    <div class="col-12 text-center py-5">
      <div class="alert alert-info">
        <i class="fas fa-info-circle me-2"></i>
        No blogs found. Be the first to create a blog!
      </div>
    </div>
  `;
}

function displayBlogs(blogs) {
  const blogContainer = document.getElementById('blogContainer');
  if (!blogContainer) {
    console.error('Blog container not found');
    return;
  }

  blogContainer.innerHTML = '';
  
  blogs.forEach(blog => {
    const blogCard = createBlogCard(blog);
    blogContainer.innerHTML += blogCard;
  });
}

function createBlogCard(blog) {
  // Ensure we have valid data
  if (!blog) {
    console.error('Invalid blog data:', blog);
    return '';
  }

  // Create a safe excerpt from the content
  let excerpt = '';
  if (blog.content) {
    // Remove HTML tags and get plain text
    excerpt = blog.content.replace(/<[^>]*>/g, '');
    // Limit to 150 characters
    excerpt = excerpt.length > 150 ? excerpt.substring(0, 150) + '...' : excerpt;
  } else {
    excerpt = 'No content available';
  }

  // Get author name safely
  const authorName = blog.author && blog.author.name ? blog.author.name : 'Anonymous';
  
  // Format date safely
  let formattedDate = 'Unknown date';
  if (blog.createdAt) {
    try {
      formattedDate = new Date(blog.createdAt).toLocaleDateString();
    } catch (e) {
      console.error('Error formatting date:', e);
    }
  }

  return `
    <div class="col-md-6 col-lg-4 mb-4">
      <div class="card h-100 shadow-sm">
        <div class="card-body">
          <span class="badge bg-${getCategoryClass(blog.category)} mb-2">${blog.category || 'Uncategorized'}</span>
          <h5 class="card-title">${blog.title || 'Untitled Blog'}</h5>
          <p class="card-text">${excerpt}</p>
          <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted">
              <i class="fas fa-user me-1"></i>${authorName}
            </small>
            <small class="text-muted">
              <i class="fas fa-calendar me-1"></i>${formattedDate}
            </small>
          </div>
        </div>
        <div class="card-footer bg-white border-top-0">
          <a href="/blog-detail.html?id=${blog._id}" class="btn btn-primary btn-sm">Read More</a>
        </div>
      </div>
    </div>
  `;
}


function getCategoryClass(category) {
  const classes = {
    'Technology': 'primary',
    'Lifestyle': 'success',
    'Travel': 'info',
    'Food': 'warning',
    'Health': 'danger',
    'Business': 'secondary',
    'Literature': 'dark',
    'Culture': 'primary',
    'Other': 'secondary'
  };
  return classes[category] || 'secondary';
}

function updatePagination(currentPage, totalPages) {
  const pagination = document.getElementById('pagination');
  if (!pagination) return;

  let html = '<ul class="pagination justify-content-center">';

  // Previous button
  html += `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${currentPage - 1}" ${currentPage === 1 ? 'tabindex="-1"' : ''}>
        Previous
      </a>
    </li>
  `;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    html += `
      <li class="page-item ${i === currentPage ? 'active' : ''}">
        <a class="page-link" href="#" data-page="${i}">${i}</a>
      </li>
    `;
  }

  // Next button
  html += `
    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'tabindex="-1"' : ''}>
        Next
      </a>
    </li>
  `;

  html += '</ul>';
  pagination.innerHTML = html;

  // Add click handlers
  pagination.querySelectorAll('.page-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = parseInt(e.target.dataset.page);
      if (page && page !== currentPage) {
        loadBlogs(page);
      }
    });
  });
}

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

// ... existing code ... 