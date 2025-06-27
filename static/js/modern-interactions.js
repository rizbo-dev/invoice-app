/**
 * Modern Professional Interactions
 * Handles animations, micro-interactions, and UX enhancements
 */

class ProfessionalInteractions {
  constructor() {
    this.init();
  }

  init() {
    this.initPageTransitions();
    this.initModals();
    this.initToasts();
    this.initLoadingStates();
    this.initFormInteractions();
    this.initTableInteractions();
    this.initCountAnimations();
    this.initAccessibility();
  }

  /**
   * Page Transition Animations
   */
  initPageTransitions() {
    // Fade in animation for page load
    document.addEventListener('DOMContentLoaded', () => {
      document.body.style.opacity = '0';
      document.body.style.transition = 'opacity 0.3s ease-in-out';
      
      setTimeout(() => {
        document.body.style.opacity = '1';
      }, 50);
    });

    // Smooth page transitions for navigation
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.href && !link.href.includes('#') && !link.target) {
        e.preventDefault();
        this.transitionToPage(link.href);
      }
    });
  }

  transitionToPage(url) {
    document.body.style.opacity = '0';
    setTimeout(() => {
      window.location.href = url;
    }, 150);
  }

  /**
   * Modal System with Professional Animations
   */
  initModals() {
    this.activeModal = null;
    
    // Handle modal triggers
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-modal-trigger]');
      if (trigger) {
        const modalId = trigger.dataset.modalTrigger;
        this.openModal(modalId);
      }

      const close = e.target.closest('[data-modal-close]');
      if (close) {
        this.closeModal();
      }
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.closeModal();
      }
    });

    // Handle backdrop click
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('professional-modal-backdrop')) {
        this.closeModal();
      }
    });
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    this.activeModal = modal;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Focus management
    const firstFocusable = modal.querySelector('input, button, textarea, select, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
      setTimeout(() => firstFocusable.focus(), 100);
    }
  }

  closeModal() {
    if (!this.activeModal) return;

    this.activeModal.classList.remove('active');
    document.body.style.overflow = '';
    
    setTimeout(() => {
      this.activeModal = null;
    }, 200);
  }

  /**
   * Toast Notification System
   */
  initToasts() {
    this.toastContainer = this.createToastContainer();
  }

  createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.top = '1rem';
    container.style.right = '1rem';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
  }

  showToast(message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `professional-toast professional-toast-${type}`;
    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <div style="flex-shrink: 0;">
          ${this.getToastIcon(type)}
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 500; margin-bottom: 0.25rem;">${this.getToastTitle(type)}</div>
          <div style="font-size: 0.875rem; color: var(--gray-600);">${message}</div>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: var(--gray-400); cursor: pointer; padding: 0.25rem;">
          ✕
        </button>
      </div>
    `;

    this.toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('active'), 50);
    
    // Auto remove
    setTimeout(() => {
      toast.classList.remove('active');
      setTimeout(() => toast.remove(), 200);
    }, duration);

    return toast;
  }

  getToastIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || icons.info;
  }

  getToastTitle(type) {
    const titles = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Information'
    };
    return titles[type] || titles.info;
  }

  /**
   * Loading States and Spinners
   */
  initLoadingStates() {
    // Add loading to buttons on form submit
    document.addEventListener('submit', (e) => {
      const form = e.target;
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        this.setButtonLoading(submitButton, true);
      }
    });
  }

  setButtonLoading(button, loading) {
    if (loading) {
      button.dataset.originalText = button.textContent;
      button.innerHTML = `
        <span class="professional-loading"></span>
        <span>Loading...</span>
      `;
      button.disabled = true;
    } else {
      button.textContent = button.dataset.originalText || 'Submit';
      button.disabled = false;
    }
  }

  createSkeleton(element, lines = 3) {
    const skeleton = document.createElement('div');
    skeleton.className = 'professional-skeleton-container';
    
    for (let i = 0; i < lines; i++) {
      const line = document.createElement('div');
      line.className = 'professional-skeleton';
      line.style.height = '1rem';
      line.style.marginBottom = '0.5rem';
      line.style.width = `${Math.random() * 40 + 60}%`;
      skeleton.appendChild(line);
    }
    
    element.appendChild(skeleton);
    return skeleton;
  }

  removeSkeleton(element) {
    const skeleton = element.querySelector('.professional-skeleton-container');
    if (skeleton) {
      skeleton.remove();
    }
  }

  /**
   * Form Interactions and Validation
   */
  initFormInteractions() {
    // Real-time validation
    document.addEventListener('input', (e) => {
      if (e.target.matches('.professional-input, .professional-select, .professional-textarea')) {
        this.validateField(e.target);
      }
    });

    // Form submission enhancement
    document.addEventListener('submit', (e) => {
      const form = e.target;
      if (form.classList.contains('professional-form')) {
        if (!this.validateForm(form)) {
          e.preventDefault();
        }
      }
    });
  }

  validateField(field) {
    const isValid = field.checkValidity();
    const errorElement = field.parentElement.querySelector('.professional-error-message');
    
    if (isValid) {
      field.classList.remove('error');
      if (errorElement) {
        errorElement.style.display = 'none';
      }
    } else {
      field.classList.add('error');
      if (errorElement) {
        errorElement.style.display = 'flex';
        errorElement.textContent = field.validationMessage;
      }
    }
    
    return isValid;
  }

  validateForm(form) {
    const fields = form.querySelectorAll('.professional-input, .professional-select, .professional-textarea');
    let isValid = true;
    
    fields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });
    
    return isValid;
  }

  /**
   * Table Interactions
   */
  initTableInteractions() {
    // Sortable headers
    document.addEventListener('click', (e) => {
      const header = e.target.closest('[data-sortable]');
      if (header) {
        this.sortTable(header);
      }
    });

    // Row selection
    document.addEventListener('click', (e) => {
      const row = e.target.closest('tr[data-selectable]');
      if (row && !e.target.closest('button, a')) {
        this.toggleRowSelection(row);
      }
    });
  }

  sortTable(header) {
    const table = header.closest('table');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const column = Array.from(header.parentElement.children).indexOf(header);
    const isAscending = !header.classList.contains('sort-asc');
    
    // Clear other sort indicators
    header.parentElement.querySelectorAll('th').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
    });
    
    // Add sort indicator
    header.classList.add(isAscending ? 'sort-asc' : 'sort-desc');
    
    // Sort rows
    rows.sort((a, b) => {
      const aValue = a.children[column].textContent.trim();
      const bValue = b.children[column].textContent.trim();
      
      const result = aValue.localeCompare(bValue, undefined, { numeric: true });
      return isAscending ? result : -result;
    });
    
    // Reorder rows with animation
    rows.forEach((row, index) => {
      row.style.transform = `translateY(${index * 100}%)`;
      tbody.appendChild(row);
      
      setTimeout(() => {
        row.style.transform = '';
      }, 50);
    });
  }

  toggleRowSelection(row) {
    row.classList.toggle('selected');
  }

  /**
   * Count-up Animations for Metrics
   */
  initCountAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateCount(entry.target);
          observer.unobserve(entry.target);
        }
      });
    });

    document.querySelectorAll('[data-count]').forEach(el => {
      observer.observe(el);
    });
  }

  animateCount(element) {
    const target = parseInt(element.dataset.count) || parseInt(element.textContent);
    const duration = 1000;
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        element.textContent = target;
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current);
      }
    }, 16);
  }

  /**
   * Accessibility Enhancements
   */
  initAccessibility() {
    // Focus management
    this.initFocusManagement();
    
    // Keyboard navigation
    this.initKeyboardNavigation();
    
    // ARIA live regions
    this.initAriaLiveRegions();
  }

  initFocusManagement() {
    // Skip to main content link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'sr-only';
    skipLink.style.position = 'absolute';
    skipLink.style.top = '-1000px';
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '0';
      skipLink.style.left = '0';
      skipLink.style.zIndex = '9999';
      skipLink.style.background = 'var(--primary-600)';
      skipLink.style.color = 'white';
      skipLink.style.padding = '0.5rem 1rem';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-1000px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  initKeyboardNavigation() {
    // Tab navigation for modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && this.activeModal) {
        this.trapFocus(e, this.activeModal);
      }
    });
  }

  trapFocus(e, container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }

  initAriaLiveRegions() {
    // Create live region for dynamic content announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'live-region';
    document.body.appendChild(liveRegion);
  }

  announceToScreenReader(message) {
    const liveRegion = document.getElementById('live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }

  /**
   * Utility Methods
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  }

  generateId() {
    return 'professional-' + Math.random().toString(36).substr(2, 9);
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }

  /**
   * Component Factory Methods
   */
  createMetricCard(title, value, change, changeType) {
    const card = document.createElement('div');
    card.className = 'professional-metric-card';
    card.innerHTML = `
      <div class="professional-metric-title">${title}</div>
      <div class="professional-metric-value" data-count="${value}">0</div>
      ${change ? `<div class="professional-metric-change ${changeType}">
        <span>${changeType === 'positive' ? '↗' : '↘'}</span>
        <span>${change}</span>
      </div>` : ''}
    `;
    return card;
  }

  createButton(text, type = 'primary', size = 'base') {
    const button = document.createElement('button');
    button.className = `professional-btn professional-btn-${type} professional-btn-${size}`;
    button.textContent = text;
    return button;
  }

  createBadge(text, type = 'neutral') {
    const badge = document.createElement('span');
    badge.className = `professional-badge professional-badge-${type}`;
    badge.textContent = text;
    return badge;
  }
}

// Initialize professional interactions when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.professionalInteractions = new ProfessionalInteractions();
});

// Global utility functions for easy access
window.showToast = (message, type, duration) => {
  return window.professionalInteractions.showToast(message, type, duration);
};

window.setButtonLoading = (button, loading) => {
  return window.professionalInteractions.setButtonLoading(button, loading);
};

window.openModal = (modalId) => {
  return window.professionalInteractions.openModal(modalId);
};

window.closeModal = () => {
  return window.professionalInteractions.closeModal();
};

window.announceToScreenReader = (message) => {
  return window.professionalInteractions.announceToScreenReader(message);
};