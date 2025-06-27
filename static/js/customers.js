let currentCustomer = null;
let currentMode = 'create';
let customers = []; // Global customers array for easy access

async function loadCustomers(searchQuery = '') {
    try {
        const params = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
        const response = await fetch(`/api/customers${params}`);
        customers = await response.json(); // Update global array
        displayCustomers(customers);
    } catch (error) {
        console.error('Error loading customers:', error);
        showError('Failed to load customers');
    }
}

function displayCustomers(customers) {
    const tbody = document.getElementById('customer-list');
    
    // Update total count with animation
    const totalElement = document.getElementById('total-customers');
    if (totalElement) {
        animateCounterUpdate('total-customers', customers.length);
    }
    
    if (customers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 3rem; color: var(--gray-500);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">👥</div>
                    <div style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">No customers found</div>
                    <div>Add your first customer to get started</div>
                    <button onclick="openCustomerModal('create')" class="professional-btn professional-btn-primary" style="margin-top: 1rem;">
                        <span>➕</span> Add Customer
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    customers.forEach((customer, index) => {
        const row = document.createElement('tr');
        row.style.opacity = '0';
        row.style.transform = 'translateY(20px)';
        row.style.transition = 'all 0.3s ease-in-out';
        
        row.innerHTML = `
            <td style="font-weight: 600; color: var(--primary-600);">#${String(customer.id).padStart(4, '0')}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 2rem; height: 2rem; background: var(--success-100); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; color: var(--success-700);">👤</div>
                    <div>
                        <div style="font-weight: 600;">${customer.name}</div>
                        <div style="font-size: 0.75rem; color: var(--gray-500);">Customer ID: ${customer.id}</div>
                    </div>
                </div>
            </td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="color: var(--gray-400);">📞</span>
                    <span>${customer.phone}</span>
                </div>
            </td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">
                <div style="display: flex; align-items: center; gap: 0.5rem;" title="${customer.address}">
                    <span style="color: var(--gray-400);">📍</span>
                    <span>${customer.address}</span>
                </div>
            </td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="color: var(--gray-400);">🌍</span>
                    <span>${customer.country}</span>
                </div>
            </td>
            <td>${window.professionalInteractions ? window.professionalInteractions.formatDate(customer.created_at) : new Date(customer.created_at).toLocaleDateString()}</td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="openCustomerModal('edit', ${customer.id})" class="professional-btn professional-btn-secondary professional-btn-sm" title="Edit customer">
                        <span>✏️</span> Edit
                    </button>
                    <button onclick="deleteCustomer(${customer.id})" class="professional-btn professional-btn-danger professional-btn-sm" title="Delete customer">
                        <span>🗑️</span> Delete
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
        
        // Animate in with staggered delay
        setTimeout(() => {
            row.style.opacity = '1';
            row.style.transform = 'translateY(0)';
        }, index * 50 + 100);
    });
    
    // Announce to screen readers
    if (window.announceToScreenReader) {
        window.announceToScreenReader(`${customers.length} customers loaded`);
    }
}

function animateCounterUpdate(elementId, newValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const currentValue = parseInt(element.textContent) || 0;
    const increment = (newValue - currentValue) / 20;
    let current = currentValue;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= newValue) || (increment < 0 && current <= newValue)) {
            element.textContent = newValue;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 50);
}

function openCustomerModal(mode, customerIdOrData = null) {
    currentMode = mode;
    
    const modal = document.getElementById('customer-modal');
    const title = document.getElementById('modal-title');
    const nameInput = document.getElementById('customer-name');
    const phoneInput = document.getElementById('customer-phone');
    const addressInput = document.getElementById('customer-address');
    const countryInput = document.getElementById('customer-country');
    
    clearErrors();
    
    if (mode === 'create') {
        title.textContent = '👤 Add New Customer';
        currentCustomer = null;
        nameInput.value = '';
        phoneInput.value = '';
        addressInput.value = '';
        countryInput.value = '';
    } else {
        title.textContent = '✏️ Edit Customer';
        // If customerIdOrData is a number, find the customer by ID
        if (typeof customerIdOrData === 'number') {
            // Find customer in the current customers array (assuming it's available globally)
            const customer = customers.find(c => c.id === customerIdOrData);
            if (customer) {
                currentCustomer = customer;
                nameInput.value = customer.name;
                phoneInput.value = customer.phone;
                addressInput.value = customer.address;
                countryInput.value = customer.country;
            }
        } else {
            // Legacy support for direct customer object
            currentCustomer = customerIdOrData;
            if (customerIdOrData) {
                nameInput.value = customerIdOrData.name;
                phoneInput.value = customerIdOrData.phone;
                addressInput.value = customerIdOrData.address;
                countryInput.value = customerIdOrData.country;
            }
        }
    }
    
    // Use professional modal system
    if (window.openModal) {
        window.openModal('customer-modal');
    } else {
        modal.classList.add('active');
    }
    
    // Focus management
    setTimeout(() => nameInput.focus(), 100);
}

function closeCustomerModal() {
    if (window.closeModal) {
        window.closeModal();
    } else {
        document.getElementById('customer-modal').classList.remove('active');
    }
    clearErrors();
}

function clearErrors() {
    const errorFields = ['name', 'phone', 'address', 'country'];
    errorFields.forEach(field => {
        const errorElement = document.getElementById(`${field}-error`);
        const inputElement = document.getElementById(`customer-${field}`);
        
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        if (inputElement) {
            inputElement.classList.remove('error');
        }
    });
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {
        name: formData.get('name').trim(),
        phone: formData.get('phone').trim(),
        address: formData.get('address').trim(),
        country: formData.get('country').trim()
    };
    
    clearErrors();
    
    // Client-side validation
    let hasErrors = false;
    
    if (!data.name) {
        showFieldError('name', 'Customer name is required');
        hasErrors = true;
    }
    
    if (!data.phone) {
        showFieldError('phone', 'Phone number is required');
        hasErrors = true;
    } else if (data.phone.length < 7) {
        showFieldError('phone', 'Phone number must be at least 7 characters');
        hasErrors = true;
    }
    
    if (!data.address) {
        showFieldError('address', 'Address is required');
        hasErrors = true;
    }
    
    if (!data.country) {
        showFieldError('country', 'Country is required');
        hasErrors = true;
    }
    
    if (hasErrors) {
        return;
    }
    
    await saveCustomer(data);
}

async function saveCustomer(formData) {
    const saveBtn = document.getElementById('save-btn');
    
    // Use professional loading state
    if (window.setButtonLoading) {
        window.setButtonLoading(saveBtn, true);
    } else {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
    }
    
    try {
        const url = currentMode === 'create' 
            ? '/api/customers' 
            : `/api/customers/${currentCustomer.id}`;
        
        const response = await fetch(url, {
            method: currentMode === 'create' ? 'POST' : 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.text();
            if (window.showToast) {
                window.showToast(error || 'Failed to save customer', 'error');
            } else {
                showError(error || 'Failed to save customer');
            }
            return;
        }
        
        const result = await response.json();
        closeCustomerModal();
        await loadCustomers();
        
        // Show success toast
        const message = currentMode === 'create' 
            ? `Customer "${formData.name}" created successfully` 
            : `Customer "${formData.name}" updated successfully`;
            
        if (window.showToast) {
            window.showToast(message, 'success');
        } else {
            showSuccess(message);
        }
        
    } catch (error) {
        console.error('Error saving customer:', error);
        if (window.showToast) {
            window.showToast('Failed to save customer. Please try again.', 'error');
        } else {
            showError('Failed to save customer');
        }
    } finally {
        // Reset button state
        if (window.setButtonLoading) {
            window.setButtonLoading(saveBtn, false);
        } else {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save';
        }
    }
}

async function deleteCustomer(customerId) {
    // Show professional confirmation dialog
    const confirmed = confirm('⚠️ Delete Customer\n\nAre you sure you want to delete this customer? This action cannot be undone.\n\nNote: Customers with existing invoices cannot be deleted.');
    
    if (!confirmed) {
        return;
    }
    
    // Show loading toast
    if (window.showToast) {
        window.showToast('Deleting customer...', 'info', 2000);
    }
    
    try {
        const response = await fetch(`/api/customers/${customerId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.text();
            let errorMessage = error || 'Failed to delete customer';
            
            if (error.includes('has invoices')) {
                errorMessage = 'Cannot delete customer with existing invoices. Please delete or reassign invoices first.';
            }
            
            if (window.showToast) {
                window.showToast(errorMessage, 'error');
            } else {
                showError(errorMessage);
            }
            return;
        }
        
        await loadCustomers();
        
        if (window.showToast) {
            window.showToast('Customer deleted successfully', 'success');
        } else {
            showSuccess('Customer deleted successfully');
        }
        
    } catch (error) {
        console.error('Error deleting customer:', error);
        if (window.showToast) {
            window.showToast('Failed to delete customer. Please try again.', 'error');
        } else {
            showError('Failed to delete customer');
        }
    }
}

function handleSearch() {
    const searchQuery = document.getElementById('search-input').value;
    
    // Add visual feedback for search
    const searchInput = document.getElementById('search-input');
    if (searchQuery.trim()) {
        searchInput.style.borderColor = 'var(--primary-500)';
        searchInput.style.background = 'var(--primary-50)';
    } else {
        searchInput.style.borderColor = '';
        searchInput.style.background = '';
    }
    
    loadCustomers(searchQuery);
}

function showFieldError(field, message) {
    const input = document.getElementById(`customer-${field}`);
    const error = document.getElementById(`${field}-error`);
    
    if (input) {
        input.classList.add('error');
    }
    if (error) {
        error.textContent = message;
        error.style.display = 'flex';
    }
}

function showError(message) {
    if (window.showToast) {
        window.showToast(message, 'error');
    } else {
        alert(message);
    }
}

function showSuccess(message) {
    if (window.showToast) {
        window.showToast(message, 'success');
    } else {
        const toast = document.createElement('div');
        toast.className = 'professional-toast professional-toast-success active';
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div>✅</div>
                <div>
                    <div style="font-weight: 500;">Success</div>
                    <div style="font-size: 0.875rem; color: var(--gray-600);">${message}</div>
                </div>
            </div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.remove('active');
            setTimeout(() => toast.remove(), 200);
        }, 3000);
    }
}

// Initialize page
window.addEventListener('load', () => {
    loadCustomers();
});

// Handle escape key to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeCustomerModal();
    }
});

// Add debounced search
let searchTimeout;
document.getElementById('search-input').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        handleSearch();
    }, 300);
});