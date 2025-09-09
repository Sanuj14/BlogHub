document.addEventListener('DOMContentLoaded', function() {
  const contactForm = document.getElementById('contactForm');
  
  if (contactForm) {
    contactForm.addEventListener('submit', handleContactSubmit);
  }
});

async function handleContactSubmit(e) {
  e.preventDefault();
  
  // Get form data
  const formData = {
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    subject: document.getElementById('subject').value.trim(),
    message: document.getElementById('message').value.trim(),
    date: new Date().toISOString(),
    status: 'new' // new, read, replied
  };

  // Validate form data
  if (!validateForm(formData)) {
    return;
  }

  try {
    // Save contact data to database
    const response = await fetch('/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      throw new Error('Failed to save contact data');
    }

    // Show success message
    showAlert('Thank you for contacting us! We will get back to you soon.', 'success');

    // Reset form
    contactForm.reset();
  } catch (error) {
    console.error('Error saving contact:', error);
    showAlert('Failed to submit contact form. Please try again later.', 'danger');
  }
}

function validateForm(data) {
  // Check if all required fields are filled
  if (!data.name || !data.email || !data.subject || !data.message) {
    showAlert('Please fill in all required fields', 'danger');
    return false;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    showAlert('Please enter a valid email address', 'danger');
    return false;
  }

  return true;
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
  
  // Auto dismiss after 5 seconds
  setTimeout(() => {
    alert.remove();
  }, 5000);
} 