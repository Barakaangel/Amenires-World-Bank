// ============================================
// AMENIRES WORLD BANK - AUTHENTICATION JS
// ============================================

// API Configuration
const API_BASE = '/api';

// State Management
let currentUser = null;
let authToken = null;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get CSRF token from meta tag
 */
function getCSRFToken() {
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  return metaTag ? metaTag.getAttribute('content') : null;
}

/**
 * Show alert message
 */
function showAlert(message, type = 'info') {
  const alert = document.getElementById('alert');
  if (!alert) {
    showToast(message, type);
    return;
  }

  alert.className = `alert alert-${type} show`;
  alert.innerHTML = `
    <i class="fas fa-${getAlertIcon(type)}"></i>
    <span>${escapeHtml(message)}</span>
  `;

  // Auto-hide after 5 seconds
  setTimeout(() => {
    hideAlert();
  }, 5000);
}

/**
 * Hide alert message
 */
function hideAlert() {
  const alert = document.getElementById('alert');
  if (alert) {
    alert.classList.remove('show');
    alert.classList.add('hidden');
  }
}

/**
 * Get alert icon based on type
 */
function getAlertIcon(type) {
  const icons = {
    success: 'check-circle',
    error: 'exclamation-circle',
    warning: 'exclamation-triangle',
    info: 'info-circle'
  };
  return icons[type] || 'info-circle';
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info', duration = 5000) {
  const container = document.querySelector('.toast-container') || createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fas fa-${getAlertIcon(type)}"></i>
    <div class="toast-content">
      <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
      <div class="toast-message">${escapeHtml(message)}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  container.appendChild(toast);
  
  // Auto-remove after duration
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Create toast container
 */
function createToastContainer() {
  const container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validate phone number
 */
function isValidPhone(phone) {
  const re = /^[\d\s\-+()]+$/;
  return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Show input error
 */
function showInputError(input, message) {
  const formGroup = input.closest('.form-group');
  if (formGroup) {
    formGroup.classList.add('error');
    const small = formGroup.querySelector('small');
    if (small) {
      small.textContent = message;
    }
  }
}

/**
 * Clear input error
 */
function clearInputError(input) {
  const formGroup = input.closest('.form-group');
  if (formGroup) {
    formGroup.classList.remove('error');
    const small = formGroup.querySelector('small');
    if (small) {
      small.textContent = '';
    }
  }
}

/**
 * Toggle password visibility
 */
function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  const icon = button.querySelector('i');
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
}

/**
 * Set button loading state
 */
function setButtonLoading(buttonId, loading) {
  const button = document.getElementById(buttonId);
  if (!button) return;
  
  if (loading) {
    button.classList.add('loading');
    button.disabled = true;
  } else {
    button.classList.remove('loading');
    button.disabled = false;
  }
}

/**
 * Show/hide loading overlay
 */
function showLoading(show) {
  let overlay = document.querySelector('.loading-overlay');
  
  if (show) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'loading-overlay';
      overlay.innerHTML = '<div class="loading-spinner"></div>';
      document.body.appendChild(overlay);
    }
    overlay.classList.remove('hidden');
  } else {
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }
}

/**
 * Store authentication token
 */
function storeToken(token) {
  authToken = token;
  localStorage.setItem('authToken', token);
  localStorage.setItem('tokenExpiry', Date.now() + (24 * 60 * 60 * 1000)); // 24 hours
}

/**
 * Get stored authentication token
 */
function getToken() {
  if (!authToken) {
    authToken = localStorage.getItem('authToken');
  }
  
  // Check if token is expired
  const expiry = localStorage.getItem('tokenExpiry');
  if (expiry && Date.now() > parseInt(expiry)) {
    clearToken();
    return null;
  }
  
  return authToken;
}

/**
 * Clear authentication token
 */
function clearToken() {
  authToken = null;
  localStorage.removeItem('authToken');
  localStorage.removeItem('tokenExpiry');
  localStorage.removeItem('user');
}

/**
 * Store user data
 */
function storeUser(user) {
  currentUser = user;
  localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Get stored user data
 */
function getUser() {
  if (!currentUser) {
    const userStr = localStorage.getItem('user');
    currentUser = userStr ? JSON.parse(userStr) : null;
  }
  return currentUser;
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
  return getToken() !== null;
}

/**
 * Redirect to dashboard if authenticated
 */
function checkAuth() {
  if (isAuthenticated()) {
    window.location.href = '/dashboard.html';
    return true;
  }
  return false;
}

/**
 * Redirect to login if not authenticated
 */
function requireAuth() {
  if (!isAuthenticated()) {
    showToast('Please login to continue', 'warning');
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 1000);
    return false;
  }
  return true;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Make API request with authentication
 */
async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(getCSRFToken() && { 'X-CSRF-Token': getCSRFToken() })
    },
    credentials: 'include'
  };
  
  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, finalOptions);
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
      clearToken();
      if (window.location.pathname !== '/login.html' && window.location.pathname !== '/signup.html') {
        showToast('Session expired. Please login again.', 'warning');
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 1000);
      }
    }
    
    return response;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}

/**
 * Handle API response
 */
async function handleResponse(response) {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }
  
  return data;
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Handle user login
 */
async function handleLogin(event) {
  event.preventDefault();
  
  hideAlert();
  
  const form = document.getElementById('loginForm');
  const email = form.querySelector('#email').value.trim();
  const password = form.querySelector('#password').value;
  const remember = form.querySelector('#remember').checked;
  
  // Validate inputs
  if (!email) {
    showAlert('Please enter your email address', 'error');
    return;
  }
  
  if (!isValidEmail(email)) {
    showAlert('Please enter a valid email address', 'error');
    return;
  }
  
  if (!password) {
    showAlert('Please enter your password', 'error');
    return;
  }
  
  setButtonLoading('loginBtn', true);
  
  try {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, remember })
    });
    
    const data = await handleResponse(response);
    
    // Store auth data
    if (data.token) {
      storeToken(data.token);
    }
    
    if (data.user) {
      storeUser(data.user);
    }
    
    showToast('Login successful! Redirecting...', 'success');
    
    // Redirect to dashboard
    setTimeout(() => {
      window.location.href = '/dashboard.html';
    }, 1500);
    
  } catch (error) {
    console.error('Login Error:', error);
    showAlert(error.message || 'Login failed. Please check your credentials.', 'error');
  } finally {
    setButtonLoading('loginBtn', false);
  }
}

/**
 * Handle user signup
 */
async function handleSignup(event) {
  event.preventDefault();
  
  hideAlert();
  
  const form = document.getElementById('signupForm');
  const fullName = form.querySelector('#fullName').value.trim();
  const email = form.querySelector('#email').value.trim();
  const phone = form.querySelector('#phone').value.trim();
  const accountType = form.querySelector('#accountType').value;
  const country = form.querySelector('#country').value;
  const currency = form.querySelector('#currency').value;
  const password = form.querySelector('#password').value;
  const confirmPassword = form.querySelector('#confirmPassword').value;
  const terms = form.querySelector('#terms').checked;
  
  // Validate required fields
  if (!fullName || !email || !phone || !accountType || !country || !currency || !password || !confirmPassword) {
    let missingFields = [];
    
    if (!fullName) missingFields.push('Full Name');
    if (!email) missingFields.push('Email');
    if (!phone) missingFields.push('Phone Number');
    if (!accountType) missingFields.push('Account Type');
    if (!country) missingFields.push('Country');
    if (!currency) missingFields.push('Currency');
    if (!password) missingFields.push('Password');
    if (!confirmPassword) missingFields.push('Confirm Password');
    
    showAlert(`Please fill in all required fields: ${missingFields.join(', ')}`, 'error');
    
    // Find first empty field and switch to its step
    if (!fullName || !email || !phone) {
      prevStep(1);
    } else if (!accountType || !country || !currency) {
      prevStep(2);
    }
    
    return;
  }
  
  // Validate email
  if (!isValidEmail(email)) {
    showAlert('Please enter a valid email address', 'error');
    return;
  }
  
  // Validate phone
  if (!isValidPhone(phone)) {
    showAlert('Please enter a valid phone number', 'error');
    return;
  }
  
  // Validate password
  if (password.length < 8) {
    showAlert('Password must be at least 8 characters long', 'error');
    return;
  }
  
  // Validate password confirmation
  if (password !== confirmPassword) {
    showAlert('Passwords do not match', 'error');
    return;
  }
  
  // Validate terms acceptance
  if (!terms) {
    showAlert('Please accept the Terms of Service', 'error');
    return;
  }
  
  // Split full name into first and last name
  const nameParts = fullName.split(' ');
  const firstName = nameParts[0] || fullName;
  const lastName = nameParts.slice(1).join(' ') || '';
  
  setButtonLoading('signupBtn', true);
  
  try {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        password,
        phone,
        country,
        accountType,
        currency
      })
    });
    
    const result = await handleResponse(response);
    
    showToast('Account created successfully! Redirecting to login...', 'success');
    
    // Redirect to login with email pre-filled
    setTimeout(() => {
      window.location.href = `/login.html?email=${encodeURIComponent(email)}`;
    }, 2000);
    
  } catch (error) {
    console.error('Signup Error:', error);
    showAlert(error.message || 'Signup failed. Please try again.', 'error');
  } finally {
    setButtonLoading('signupBtn', false);
  }
}

/**
 * Handle logout
 */
async function handleLogout() {
  try {
    await apiRequest('/auth/logout', {
      method: 'POST'
    });
  } catch (error) {
    console.error('Logout Error:', error);
  } finally {
    clearToken();
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 1000);
  }
}

/**
 * Social login (placeholder)
 */
function socialLogin(provider) {
  showToast(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login coming soon!`, 'info');
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize authentication
 */
function initAuth() {
  // Check if user is already authenticated
  if (isAuthenticated()) {
    const user = getUser();
    if (user) {
      console.log('Authenticated user:', user);
    }
  }
  
  // Pre-fill email from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email');
  if (email && document.getElementById('email')) {
    document.getElementById('email').value = email;
  }
  
  // Add input event listeners for real-time validation
  document.querySelectorAll('input[type="email"]').forEach(input => {
    input.addEventListener('blur', function() {
      if (this.value && !isValidEmail(this.value)) {
        showInputError(this, 'Please enter a valid email');
      } else {
        clearInputError(this);
      }
    });
  });
  
  document.querySelectorAll('input[type="tel"]').forEach(input => {
    input.addEventListener('blur', function() {
      if (this.value && !isValidPhone(this.value)) {
        showInputError(this, 'Please enter a valid phone number');
      } else {
        clearInputError(this);
      }
    });
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}

// Export functions for global use
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.handleLogout = handleLogout;
window.socialLogin = socialLogin;
window.togglePassword = togglePassword;
window.showAlert = showAlert;
window.hideAlert = hideAlert;
window.showToast = showToast;
window.checkAuth = checkAuth;
window.requireAuth = requireAuth;
