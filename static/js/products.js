let currentProduct = null;
let currentMode = 'create';
let products = []; // Global products array for easy access

async function loadProducts(searchQuery = '') {
    try {
        const params = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
        const response = await fetch(`/api/products${params}`);
        products = await response.json(); // Update global array
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Failed to load products');
    }
}

function displayProducts(products) {
    const tbody = document.getElementById('product-list');
    
    // Update total count with animation
    const totalElement = document.getElementById('total-products');
    if (totalElement) {
        animateCounterUpdate('total-products', products.length);
    }
    
    if (products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 3rem; color: var(--gray-500);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
                    <div style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">No products found</div>
                    <div>Add your first product to get started</div>
                    <button onclick="openProductModal('create')" class="professional-btn professional-btn-primary" style="margin-top: 1rem;">
                        <span>➕</span> Add Product
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    products.forEach((product, index) => {
        const row = document.createElement('tr');
        row.style.opacity = '0';
        row.style.transform = 'translateY(20px)';
        row.style.transition = 'all 0.3s ease-in-out';
        
        row.innerHTML = `
            <td style="font-weight: 600; color: var(--primary-600);">#${String(product.id).padStart(4, '0')}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 2rem; height: 2rem; background: var(--info-100); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; color: var(--info-700);">📦</div>
                    <div>
                        <div style="font-weight: 600;">${product.name}</div>
                        <div style="font-size: 0.75rem; color: var(--gray-500);">Product ID: ${product.id}</div>
                    </div>
                </div>
            </td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="color: var(--gray-400);">💰</span>
                    <span style="font-weight: 600; font-size: 1.125rem;">${window.professionalInteractions ? window.professionalInteractions.formatCurrency(product.price) : '$' + product.price.toFixed(2)}</span>
                </div>
            </td>
            <td>${window.professionalInteractions ? window.professionalInteractions.formatDate(product.created_at) : new Date(product.created_at).toLocaleDateString()}</td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="openProductModal('edit', ${product.id})" class="professional-btn professional-btn-secondary professional-btn-sm" title="Edit product">
                        <span>✏️</span> Edit
                    </button>
                    <button onclick="deleteProduct(${product.id})" class="professional-btn professional-btn-danger professional-btn-sm" title="Delete product">
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
        window.announceToScreenReader(`${products.length} products loaded`);
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

function openProductModal(mode, productIdOrData = null) {
    currentMode = mode;
    
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('modal-title');
    const nameInput = document.getElementById('product-name');
    const priceInput = document.getElementById('product-price');
    
    clearErrors();
    
    if (mode === 'create') {
        title.textContent = '📦 Add New Product';
        currentProduct = null;
        nameInput.value = '';
        priceInput.value = '';
    } else {
        title.textContent = '✏️ Edit Product';
        // If productIdOrData is a number, find the product by ID
        if (typeof productIdOrData === 'number') {
            const product = products.find(p => p.id === productIdOrData);
            if (product) {
                currentProduct = product;
                nameInput.value = product.name;
                priceInput.value = product.price;
            }
        } else {
            // Legacy support for direct product object
            currentProduct = productIdOrData;
            if (productIdOrData) {
                nameInput.value = productIdOrData.name;
                priceInput.value = productIdOrData.price;
            }
        }
    }
    
    // Use professional modal system
    if (window.openModal) {
        window.openModal('product-modal');
    } else {
        modal.classList.add('active');
    }
    
    // Focus management
    setTimeout(() => nameInput.focus(), 100);
}

function closeProductModal() {
    if (window.closeModal) {
        window.closeModal();
    } else {
        document.getElementById('product-modal').classList.remove('active');
    }
    clearErrors();
}

function clearErrors() {
    const errorFields = ['name', 'price'];
    errorFields.forEach(field => {
        const errorElement = document.getElementById(`${field}-error`);
        const inputElement = document.getElementById(`product-${field}`);
        
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
        price: parseFloat(formData.get('price'))
    };
    
    clearErrors();
    
    // Client-side validation
    let hasErrors = false;
    
    if (!data.name) {
        showFieldError('name', 'Product name is required');
        hasErrors = true;
    } else if (data.name.length < 2) {
        showFieldError('name', 'Product name must be at least 2 characters');
        hasErrors = true;
    }
    
    if (!data.price || data.price <= 0) {
        showFieldError('price', 'Valid price is required');
        hasErrors = true;
    } else if (data.price > 999999.99) {
        showFieldError('price', 'Price cannot exceed $999,999.99');
        hasErrors = true;
    }
    
    if (hasErrors) {
        return;
    }
    
    await saveProduct(data);
}

async function saveProduct(formData) {
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
            ? '/api/products' 
            : `/api/products/${currentProduct.id}`;
        
        const response = await fetch(url, {
            method: currentMode === 'create' ? 'POST' : 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.text();
            if (window.showToast) {
                window.showToast(error || 'Failed to save product', 'error');
            } else {
                showError(error || 'Failed to save product');
            }
            return;
        }
        
        const result = await response.json();
        closeProductModal();
        await loadProducts();
        
        // Show success toast
        const message = currentMode === 'create' 
            ? `Product "${formData.name}" created successfully` 
            : `Product "${formData.name}" updated successfully`;
            
        if (window.showToast) {
            window.showToast(message, 'success');
        } else {
            showSuccess(message);
        }
        
    } catch (error) {
        console.error('Error saving product:', error);
        if (window.showToast) {
            window.showToast('Failed to save product. Please try again.', 'error');
        } else {
            showError('Failed to save product');
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

async function deleteProduct(productId) {
    // Show professional confirmation dialog
    const confirmed = confirm('⚠️ Delete Product\\n\\nAre you sure you want to delete this product? This action cannot be undone.\\n\\nNote: Products used in existing invoices cannot be deleted.');
    
    if (!confirmed) {
        return;
    }
    
    // Show loading toast
    if (window.showToast) {
        window.showToast('Deleting product...', 'info', 2000);
    }
    
    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.text();
            let errorMessage = error || 'Failed to delete product';
            
            if (error.includes('is used in invoices')) {
                errorMessage = 'Cannot delete product that is used in existing invoices.';
            }
            
            if (window.showToast) {
                window.showToast(errorMessage, 'error');
            } else {
                showError(errorMessage);
            }
            return;
        }
        
        await loadProducts();
        
        if (window.showToast) {
            window.showToast('Product deleted successfully', 'success');
        } else {
            showSuccess('Product deleted successfully');
        }
        
    } catch (error) {
        console.error('Error deleting product:', error);
        if (window.showToast) {
            window.showToast('Failed to delete product. Please try again.', 'error');
        } else {
            showError('Failed to delete product');
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
    
    loadProducts(searchQuery);
}

function showFieldError(field, message) {
    const input = document.getElementById(`product-${field}`);
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
    loadProducts();
});

// Handle escape key to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeProductModal();
    }
});

// Add debounced search
let searchTimeout;
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                handleSearch();
            }, 300);
        });
    }
});