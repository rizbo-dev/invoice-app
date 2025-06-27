let currentCustomer = null;
let currentMode = 'create';

async function loadCustomers(searchQuery = '') {
    try {
        const params = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
        const response = await fetch(`/api/customers${params}`);
        const customers = await response.json();
        displayCustomers(customers);
    } catch (error) {
        console.error('Error loading customers:', error);
        showError('Failed to load customers');
    }
}

function displayCustomers(customers) {
    const tbody = document.getElementById('customer-list');
    
    if (customers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">No customers found</td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = customers.map(customer => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">${customer.id}</td>
            <td class="px-6 py-4 whitespace-nowrap font-medium">${customer.name}</td>
            <td class="px-6 py-4 whitespace-nowrap">${customer.phone}</td>
            <td class="px-6 py-4">${customer.address}</td>
            <td class="px-6 py-4 whitespace-nowrap">${customer.country}</td>
            <td class="px-6 py-4 whitespace-nowrap">${new Date(customer.created_at).toLocaleDateString()}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button onclick="openCustomerModal('edit', ${JSON.stringify(customer).replace(/"/g, '&quot;')})" 
                        class="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                <button onclick="deleteCustomer(${customer.id})" 
                        class="text-red-600 hover:text-red-900">Delete</button>
            </td>
        </tr>
    `).join('');
}

function openCustomerModal(mode, customerData = null) {
    currentMode = mode;
    currentCustomer = customerData;
    
    const modal = document.getElementById('customer-modal');
    const title = document.getElementById('modal-title');
    const nameInput = document.getElementById('customer-name');
    const phoneInput = document.getElementById('customer-phone');
    const addressInput = document.getElementById('customer-address');
    const countryInput = document.getElementById('customer-country');
    
    clearErrors();
    
    if (mode === 'create') {
        title.textContent = 'Add New Customer';
        nameInput.value = '';
        phoneInput.value = '';
        addressInput.value = '';
        countryInput.value = '';
    } else {
        title.textContent = 'Edit Customer';
        nameInput.value = customerData.name;
        phoneInput.value = customerData.phone;
        addressInput.value = customerData.address;
        countryInput.value = customerData.country;
    }
    
    modal.classList.remove('hidden');
    nameInput.focus();
}

function closeCustomerModal() {
    document.getElementById('customer-modal').classList.add('hidden');
    clearErrors();
}

function clearErrors() {
    const errorFields = ['name', 'phone', 'address', 'country'];
    errorFields.forEach(field => {
        document.getElementById(`${field}-error`).classList.add('hidden');
        document.getElementById(`customer-${field}`).classList.remove('border-red-500');
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
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
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
            showError(error || 'Failed to save customer');
            return;
        }
        
        closeCustomerModal();
        await loadCustomers();
        showSuccess(currentMode === 'create' ? 'Customer created successfully' : 'Customer updated successfully');
    } catch (error) {
        console.error('Error saving customer:', error);
        showError('Failed to save customer');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save';
    }
}

async function deleteCustomer(customerId) {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/customers/${customerId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.text();
            if (error.includes('has invoices')) {
                showError('Cannot delete customer that has invoices. Please delete or reassign invoices first.');
            } else {
                showError(error || 'Failed to delete customer');
            }
            return;
        }
        
        await loadCustomers();
        showSuccess('Customer deleted successfully');
    } catch (error) {
        console.error('Error deleting customer:', error);
        showError('Failed to delete customer');
    }
}

function handleSearch() {
    const searchQuery = document.getElementById('search-input').value;
    loadCustomers(searchQuery);
}

function showFieldError(field, message) {
    const input = document.getElementById(`customer-${field}`);
    const error = document.getElementById(`${field}-error`);
    
    input.classList.add('border-red-500');
    error.textContent = message;
    error.classList.remove('hidden');
}

function showError(message) {
    alert(message);
}

function showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
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