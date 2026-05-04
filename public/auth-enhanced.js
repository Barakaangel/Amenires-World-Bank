/**
 * Enhanced Authentication System with Social Login
 * Supports Google, Facebook, WeChat with account linking
 */

const API_URL = 'http://localhost:3000/api';

// Session Management
const SessionManager = {
  // Store session with persistence
  saveSession: function(userData, token, options = {}) {
    const session = {
      user: userData,
      token: token,
      loginTime: new Date().toISOString(),
      expiresAt: options.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      provider: options.provider || 'email',
      socialId: options.socialId || null,
      socialEmail: options.socialEmail || null,
      persist: options.persist !== false // Default to true
    };

    // Save to localStorage (persists across sessions)
    localStorage.setItem('authSession', JSON.stringify(session));
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);

    // Also save to sessionStorage for current session
    sessionStorage.setItem('authSession', JSON.stringify(session));
    sessionStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('token', token);

    console.log('✓ Session saved:', {
      provider: session.provider,
      persist: session.persist,
      user: userData.email
    });

    return session;
  },

  // Get current session
  getSession: function() {
    const session = JSON.parse(localStorage.getItem('authSession') || sessionStorage.getItem('authSession') || '{}');
    
    // Check if session exists and not expired
    if (session.user && session.expiresAt) {
      const now = new Date();
      const expiresAt = new Date(session.expiresAt);
      
      if (now < expiresAt) {
        return session;
      } else {
        console.log('⚠ Session expired');
        this.clearSession();
        return null;
      }
    }
    
    return null;
  },

  // Check if authenticated
  isAuthenticated: function() {
    const session = this.getSession();
    return !!session;
  },

  // Clear session
  clearSession: function() {
    localStorage.removeItem('authSession');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('authSession');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    
    console.log('✓ Session cleared');
  },

  // Refresh session
  refreshSession: function() {
    const session = this.getSession();
    
    if (session && session.persist) {
      // Extend session expiration
      session.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      localStorage.setItem('authSession', JSON.stringify(session));
      sessionStorage.setItem('authSession', JSON.stringify(session));
      
      console.log('✓ Session refreshed');
    }
  }
};

// Social Login Manager
const SocialLoginManager = {
  // Google OAuth
  initGoogleLogin: function() {
    // In production, initialize Google OAuth
    console.log('Google OAuth initialized');
    
    // Simulate for demo
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate Google popup and user authorization
        const mockSocialUser = {
          provider: 'google',
          socialId: 'google_' + Date.now(),
          email: 'user@gmail.com',
          name: 'Google User',
          givenName: 'Google',
          familyName: 'User',
          picture: 'https://via.placeholder.com/100'
        };
        resolve(mockSocialUser);
      }, 500);
    });
  },

  // Facebook OAuth
  initFacebookLogin: function() {
    console.log('Facebook OAuth initialized');
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const mockSocialUser = {
          provider: 'facebook',
          socialId: 'fb_' + Date.now(),
          email: 'user@facebook.com',
          name: 'Facebook User',
          givenName: 'Facebook',
          familyName: 'User',
          picture: 'https://via.placeholder.com/100'
        };
        resolve(mockSocialUser);
      }, 500);
    });
  },

  // WeChat OAuth
  initWeChatLogin: function() {
    console.log('WeChat OAuth initialized');
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const mockSocialUser = {
          provider: 'wechat',
          socialId: 'wx_' + Date.now(),
          email: 'user@wechat.com',
          name: 'WeChat User',
          givenName: 'WeChat',
          familyName: 'User',
          picture: 'https://via.placeholder.com/100'
        };
        resolve(mockSocialUser);
      }, 500);
    });
  },

  // Handle social login response
  handleSocialLogin: async function(socialUser, provider) {
    try {
      console.log('Processing social login:', { provider, socialId: socialUser.socialId });

      // Check if user already has this social account linked
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (currentUser.socialAccounts) {
        const existingLink = currentUser.socialAccounts.find(
          acc => acc.provider === provider && acc.socialId === socialUser.socialId
        );
        
        if (existingLink) {
          // User has already linked this social account
          console.log('✓ Social account already linked');
          return { 
            success: true, 
            message: 'Social account already linked',
            existing: true
          };
        }
      }

      // Check if there's a user with this social ID
      const response = await fetch(`${API_URL}/auth/social-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: provider,
          socialId: socialUser.socialId,
          email: socialUser.email,
          name: socialUser.name,
          givenName: socialUser.givenName,
          familyName: socialUser.familyName,
          picture: socialUser.picture
        })
      });

      const data = await response.json();

      if (data.success) {
        // Login successful
        SessionManager.saveSession(
          data.data.user,
          data.data.token,
          {
            provider: provider,
            socialId: socialUser.socialId,
            persist: true
          }
        );

        return { 
          success: true, 
          user: data.data.user,
          token: data.data.token
        };
      } else if (data.message === 'User not found') {
        // New user - needs to complete registration
        return { 
          success: false, 
          needsRegistration: true,
          socialData: socialUser
        };
      } else {
        throw new Error(data.message || 'Social login failed');
      }
    } catch (error) {
      console.error('Social login error:', error);
      return { success: false, error: error.message };
    }
  },

  // Link social account to existing user
  linkSocialAccount: async function(provider, socialUser) {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const response = await fetch(`${API_URL}/user/link-social`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          provider: provider,
          socialId: socialUser.socialId,
          email: socialUser.email,
          name: socialUser.name
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update user data with linked social account
        user.socialAccounts = user.socialAccounts || [];
        user.socialAccounts.push({
          provider: provider,
          socialId: socialUser.socialId,
          email: socialUser.email,
          linkedAt: new Date().toISOString()
        });

        localStorage.setItem('user', JSON.stringify(user));
        
        return { success: true, message: 'Social account linked successfully' };
      } else {
        throw new Error(data.message || 'Failed to link social account');
      }
    } catch (error) {
      console.error('Link social account error:', error);
      return { success: false, error: error.message };
    }
  },

  // Unlink social account
  unlinkSocialAccount: async function(provider) {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const response = await fetch(`${API_URL}/user/unlink-social`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ provider })
      });

      const data = await response.json();

      if (data.success) {
        // Remove social account from user data
        if (user.socialAccounts) {
          user.socialAccounts = user.socialAccounts.filter(acc => acc.provider !== provider);
          localStorage.setItem('user', JSON.stringify(user));
        }
        
        return { success: true, message: 'Social account unlinked' };
      } else {
        throw new Error(data.message || 'Failed to unlink social account');
      }
    } catch (error) {
      console.error('Unlink social account error:', error);
      return { success: false, error: error.message };
    }
  }
};

// API Request Helper
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  return response;
}

// Handle login with email/password
async function handleLogin(event) {
  event.preventDefault();
  hideAlert();

  const form = document.getElementById('loginForm');
  const email = form.querySelector('#email').value.trim();
  const password = form.querySelector('#password').value;
  const remember = form.querySelector('#remember').checked;

  // Validation
  if (!email) {
    showAlert('Please enter your email address', 'error');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
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
      body: JSON.stringify({ 
        email, 
        password, 
        rememberMe: remember 
      })
    });

    const data = await handleResponse(response);

    // Save session with persistence
    SessionManager.saveSession(
      data.data.user,
      data.data.token,
      {
        provider: 'email',
        persist: remember
      }
    );

    showToast('Login successful! Redirecting...', 'success');

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

// Handle social login
async function handleSocialLogin(provider) {
  hideAlert();

  setButtonLoading('loginBtn', true);

  try {
    let socialUser;

    // Initialize OAuth for the provider
    if (provider === 'google') {
      socialUser = await SocialLoginManager.initGoogleLogin();
    } else if (provider === 'facebook') {
      socialUser = await SocialLoginManager.initFacebookLogin();
    } else if (provider === 'wechat') {
      socialUser = await SocialLoginManager.initWeChatLogin();
    }

    if (!socialUser) {
      throw new Error('Social login failed');
    }

    // Handle the social login
    const result = await SocialLoginManager.handleSocialLogin(socialUser, provider);

    if (result.success) {
      if (!result.existing) {
        showToast('Login successful! Redirecting...', 'success');
        
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 1500);
      }
    } else if (result.needsRegistration) {
      // New user - redirect to signup with social data
      showToast('Please complete your registration', 'info');
      
      // Store social data temporarily
      localStorage.setItem('tempSocialData', JSON.stringify(result.socialData));
      
      setTimeout(() => {
        window.location.href = `/signup.html?provider=${provider}`;
      }, 1500);
    } else {
      showAlert(result.error || 'Social login failed', 'error');
    }

  } catch (error) {
    console.error('Social Login Error:', error);
    showAlert(error.message || 'Social login failed. Please try again.', 'error');
  } finally {
    setButtonLoading('loginBtn', false);
  }
}

// Helper functions
function hideAlert() {
  const alert = document.getElementById('alert');
  if (alert) {
    alert.classList.remove('show');
  }
}

function showAlert(message, type) {
  const alert = document.getElementById('alert');
  if (alert) {
    alert.textContent = message;
    alert.className = `alert alert-${type} show`;
  }
}

function setButtonLoading(buttonId, loading) {
  const button = document.getElementById(buttonId);
  if (!button) return;

  if (loading) {
    button.disabled = true;
    const originalText = button.textContent;
    button.setAttribute('data-original-text', originalText);
    button.innerHTML = '<span class="loading"></span> Loading...';
  } else {
    button.disabled = false;
    const originalText = button.getAttribute('data-original-text');
    if (originalText) {
      button.textContent = originalText;
    }
  }
}

async function handleResponse(response) {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }
  
  return data;
}

function showToast(message, type) {
  // Create toast element
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Auto-refresh session every 30 minutes
setInterval(() => {
  SessionManager.refreshSession();
}, 30 * 60 * 1000);

// Export for global use
window.handleLogin = handleLogin;
window.handleSocialLogin = handleSocialLogin;
window.SessionManager = SessionManager;
window.SocialLoginManager = SocialLoginManager;

// Auto-redirect if already authenticated
if (SessionManager.isAuthenticated()) {
  console.log('✓ User already authenticated, redirecting to dashboard');
  // Don't redirect on login page itself
  if (!window.location.pathname.includes('login.html')) {
    window.location.href = '/dashboard.html';
  }
}
