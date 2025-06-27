let currentProduct = null;
let currentMode = 'create';

async function loadProducts(searchQuery = '') {
    try {
        const params = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
        const response = await fetch(`/api/products${params}`);
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Failed to load products');
    }
}

function displayProducts(products) {
    const tbody = document.getElementById('product-list');
    
    if (products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">No products found</td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = products.map(product => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">${product.id}</td>
            <td class="px-6 py-4 whitespace-nowrap font-medium">${product.name}</td>
            <td class="px-6 py-4 whitespace-nowrap">$${product.price.toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap">${new Date(product.created_at).toLocaleDateString()}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button onclick="openProductModal('edit', ${JSON.stringify(product).replace(/"/g, '&quot;')})" 
                        class="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                <button onclick="deleteProduct(${product.id})" 
                        class="text-red-600 hover:text-red-900">Delete</button>
            </td>
        </tr>
    `).join('');
}

function openProductModal(mode, productData = null) {
    currentMode = mode;
    currentProduct = productData;
    
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('modal-title');
    const nameInput = document.getElementById('product-name');
    const priceInput = document.getElementById('product-price');
    
    clearErrors();
    
    if (mode === 'create') {
        title.textContent = 'Add New Product';
        nameInput.value = '';
        priceInput.value = '';
    } else {
        title.textContent = 'Edit Product';
        nameInput.value = productData.name;
        priceInput.value = productData.price;
    }
    
    modal.classList.remove('hidden');
    nameInput.focus();
}

function closeProductModal() {
    document.getElementById('product-modal').classList.add('hidden');
    clearErrors();
}

function clearErrors() {
    document.getElementById('name-error').classList.add('hidden');
    document.getElementById('price-error').classList.add('hidden');
    document.getElementById('product-name').classList.remove('border-red-500');
    document.getElementById('product-price').classList.remove('border-red-500');
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {
        name: formData.get('name').trim(),
        price: parseFloat(formData.get('price'))
    };
    
    clearErrors();
    
    if (!data.name) {
        showFieldError('name', 'Product name is required');
        return;
    }
    
    if (isNaN(data.price) || data.price <= 0) {
        showFieldError('price', 'Price must be a positive number');
        return;
    }
    
    if (Math.round(data.price * 100) / 100 !== data.price) {
        showFieldError('price', 'Price can have maximum 2 decimal places');
        return;
    }
    
    await saveProduct(data);
}

async function saveProduct(formData) {
    const saveBtn = document.getElementById('save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
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
            if (error.includes('already exists')) {
                showFieldError('name', 'A product with this name already exists');
            } else {
                showError(error || 'Failed to save product');
            }
            return;
        }
        
        closeProductModal();
        await loadProducts();
        showSuccess(currentMode === 'create' ? 'Product created successfully' : 'Product updated successfully');
    } catch (error) {
        console.error('Error saving product:', error);
        showError('Failed to save product');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save';
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.text();
            if (error.includes('non-deleted invoices')) {
                showError('Cannot delete product that is used in active invoices');
            } else {
                showError(error || 'Failed to delete product');
            }
            return;
        }
        
        await loadProducts();
        showSuccess('Product deleted successfully');
    } catch (error) {
        console.error('Error deleting product:', error);
        showError('Failed to delete product');
    }
}

function handleSearch() {
    const searchQuery = document.getElementById('search-input').value;
    loadProducts(searchQuery);
}

function showFieldError(field, message) {
    const input = document.getElementById(`product-${field}`);
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
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

window.addEventListener('load', () => {
    loadProducts();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeProductModal();
    }
});