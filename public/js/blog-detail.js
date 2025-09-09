document.addEventListener('DOMContentLoaded', function() {
  // Get blog ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const blogId = urlParams.get('id');

  // Load blog data from localStorage or sample data
  const blog = loadBlogData(blogId);
  
  if (blog) {
    // Update blog content
    document.getElementById('blogTitle').textContent = blog.title;
    document.getElementById('blogImage').src = blog.image;
    document.getElementById('blogContent').innerHTML = blog.content;
    document.getElementById('authorName').textContent = blog.author;
    document.getElementById('publishDate').textContent = blog.date;
    document.getElementById('authorImage').src = blog.authorImage;
    document.getElementById('likeCount').textContent = blog.likes || 0;

    // Update sidebar
    document.getElementById('sidebarAuthorName').textContent = blog.author;
    document.getElementById('sidebarAuthorImage').src = blog.authorImage;
    document.getElementById('authorBio').textContent = blog.authorBio || 'Blog Author';
    document.getElementById('authorDescription').textContent = blog.authorDescription || 'Passionate writer sharing insights and experiences.';

    // Load related posts
    loadRelatedPosts(blog.category);
  } else {
    // If blog not found, show a message
    document.getElementById('blogTitle').textContent = 'Blog Not Found';
    document.getElementById('blogContent').innerHTML = '<p class="text-muted">The requested blog could not be found.</p>';
  }

  // Load comments
  loadComments(blogId);
  checkLikeStatus(blogId);

  // Event Listeners
  document.getElementById('likeButton').addEventListener('click', () => handleLike(blogId));
  document.getElementById('commentForm').addEventListener('submit', (e) => handleCommentSubmit(e, blogId));
});

// Load blog data from localStorage or sample data
function loadBlogData(blogId) {
  // Try to get blog from localStorage first
  const savedBlogs = JSON.parse(localStorage.getItem('blogs') || '[]');
  const blog = savedBlogs.find(b => b.id === blogId);

  if (blog) {
    return blog;
  }

  // If not found in localStorage, use sample data
  const sampleBlogs = {
    '1': {
      id: '1',
      title: "AI in Healthcare: Revolutionizing Patient Care",
      content: `
        <p>Artificial Intelligence is transforming healthcare in unprecedented ways. From diagnostic tools to personalized treatment plans, AI is making healthcare more efficient and effective.</p>
        <p>Key areas where AI is making an impact:</p>
        <ul>
          <li>Medical Imaging Analysis</li>
          <li>Drug Discovery</li>
          <li>Predictive Analytics</li>
          <li>Personalized Medicine</li>
        </ul>
        <p>The future of healthcare is here, and AI is leading the way.</p>
      `,
      author: "Dr. Sarah Johnson",
      authorImage: "https://randomuser.me/api/portraits/women/1.jpg",
      date: "Apr 5, 2023",
      image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef",
      category: "Technology",
      likes: 0
    },
    '2': {
      id: '2',
      title: "Exploring Northeast India: A Traveler's Paradise",
      content: `
        <p>Northeast India is a hidden gem waiting to be discovered. With its rich cultural heritage and breathtaking landscapes, it offers a unique travel experience.</p>
        <p>Must-visit places:</p>
        <ul>
          <li>Kaziranga National Park</li>
          <li>Living Root Bridges of Meghalaya</li>
          <li>Tawang Monastery</li>
          <li>Majuli Island</li>
        </ul>
        <p>Experience the magic of Northeast India!</p>
      `,
      author: "Rahul Sharma",
      authorImage: "https://randomuser.me/api/portraits/men/2.jpg",
      date: "Apr 4, 2023",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
      category: "Travel",
      likes: 0
    }
  };

  return sampleBlogs[blogId];
}

// Load comments from localStorage
function loadComments(blogId) {
  const comments = JSON.parse(localStorage.getItem(`comments_${blogId}`) || '[]');
  const commentsList = document.getElementById('commentsList');
  commentsList.innerHTML = '';

  if (comments.length === 0) {
    commentsList.innerHTML = '<p class="text-muted">No comments yet. Be the first to comment!</p>';
    return;
  }

  comments.forEach(comment => {
    const commentElement = createCommentElement(comment);
    commentsList.appendChild(commentElement);
  });
}

// Create comment element
function createCommentElement(comment) {
  const div = document.createElement('div');
  div.className = 'card mb-3';
  div.innerHTML = `
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div class="d-flex align-items-center">
          <img src="${comment.authorImage || '/img/default-avatar.jpg'}" alt="${comment.author}" 
               class="rounded-circle me-2" width="32" height="32">
          <span class="fw-bold">${comment.author}</span>
        </div>
        <small class="text-muted">${new Date(comment.date).toLocaleDateString()}</small>
      </div>
      <p class="card-text">${comment.text}</p>
    </div>
  `;
  return div;
}

// Handle comment submission
function handleCommentSubmit(e, blogId) {
  e.preventDefault();
  
  const token = localStorage.getItem('token');
  if (!token) {
    showAlert('Please login to comment', 'warning');
    return;
  }

  const commentText = document.getElementById('commentText').value.trim();
  if (!commentText) {
    showAlert('Please enter a comment', 'warning');
    return;
  }

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    showAlert('User information not found', 'danger');
    return;
  }

  // Create new comment
  const newComment = {
    id: Date.now(),
    text: commentText,
    author: currentUser.name,
    authorImage: currentUser.image || '/img/default-avatar.jpg',
    date: new Date().toISOString()
  };

  // Save comment to localStorage
  const comments = JSON.parse(localStorage.getItem(`comments_${blogId}`) || '[]');
  comments.push(newComment);
  localStorage.setItem(`comments_${blogId}`, JSON.stringify(comments));

  // Clear comment input
  document.getElementById('commentText').value = '';
  
  // Reload comments
  loadComments(blogId);
  showAlert('Comment posted successfully', 'success');
}

// Handle like functionality
function handleLike(blogId) {
  const token = localStorage.getItem('token');
  if (!token) {
    showAlert('Please login to like this post', 'warning');
    return;
  }

  // Get current likes from localStorage
  const likes = JSON.parse(localStorage.getItem(`likes_${blogId}`) || '[]');
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  if (!currentUser) {
    showAlert('User information not found', 'danger');
    return;
  }

  // Toggle like
  const userIndex = likes.indexOf(currentUser.id);
  if (userIndex === -1) {
    likes.push(currentUser.id);
  } else {
    likes.splice(userIndex, 1);
  }

  // Save likes to localStorage
  localStorage.setItem(`likes_${blogId}`, JSON.stringify(likes));

  // Update like count and button state
  const likeCount = likes.length;
  document.getElementById('likeCount').textContent = likeCount;
  
  const likeButton = document.getElementById('likeButton');
  likeButton.classList.toggle('btn-outline-primary');
  likeButton.classList.toggle('btn-primary');
  likeButton.querySelector('i').classList.toggle('far');
  likeButton.querySelector('i').classList.toggle('fas');
}

// Check if user has liked the post
function checkLikeStatus(blogId) {
  const token = localStorage.getItem('token');
  if (!token) return;

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) return;

  const likes = JSON.parse(localStorage.getItem(`likes_${blogId}`) || '[]');
  if (likes.includes(currentUser.id)) {
    const likeButton = document.getElementById('likeButton');
    likeButton.classList.remove('btn-outline-primary');
    likeButton.classList.add('btn-primary');
    likeButton.querySelector('i').classList.remove('far');
    likeButton.querySelector('i').classList.add('fas');
  }
}

// Load related posts
function loadRelatedPosts(category) {
  const savedBlogs = JSON.parse(localStorage.getItem('blogs') || '[]');
  const relatedPosts = savedBlogs
    .filter(blog => blog.category === category)
    .slice(0, 3);

  const relatedPostsContainer = document.getElementById('relatedPosts');
  relatedPostsContainer.innerHTML = '';

  if (relatedPosts.length === 0) {
    relatedPostsContainer.innerHTML = '<p class="text-muted">No related posts found.</p>';
    return;
  }

  relatedPosts.forEach(post => {
    const postElement = document.createElement('div');
    postElement.className = 'mb-3';
    postElement.innerHTML = `
      <div class="d-flex">
        <img src="${post.image}" alt="${post.title}" class="rounded me-2" width="60" height="60" style="object-fit: cover;">
        <div>
          <h6 class="mb-1"><a href="/blog-detail.html?id=${post.id}" class="text-decoration-none">${post.title}</a></h6>
          <small class="text-muted">${post.date}</small>
        </div>
      </div>
    `;
    relatedPostsContainer.appendChild(postElement);
  });
}

// Show alert message
function showAlert(message, type) {
  const alertContainer = document.querySelector('.alert-container');
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