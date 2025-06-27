/**
 * Products View Component
 * Product management interface for the SPA
 */

export class ProductsView {
    constructor(app) {
        this.app = app;
        this.products = [];
        this.currentProduct = null;
        this.currentMode = 'create';
        this.searchQuery = '';
    }

    async render() {
        // Load data first
        await this.loadData();
        
        return `
            <!-- Welcome Section -->
            <div style="margin-bottom: 2rem;">
                <h1 style="font-size: 2.25rem; font-weight: 700; color: var(--gray-900); margin-bottom: 0.5rem;">
                    Product Management
                </h1>
                <p style="color: var(--gray-600); font-size: 1.125rem;">
                    Manage your product catalog with professional efficiency
                </p>
            </div>

            <!-- Search and Actions Section -->
            <div class="professional-card" style="margin-bottom: 2rem;">
                <div class="professional-card-header">
                    <h2 class="professional-card-title">Search & Actions</h2>
                    <p class="professional-card-description">Find products quickly and manage your inventory catalog</p>
                </div>
                <div class="professional-card-content">
                    <div style="display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;">
                        <div style="flex: 1; min-width: 300px;">
                            <label class="professional-label">🔍 Search Products</label>
                            <input type="text" id="search-input" placeholder="Search by product name..." 
                                   class="professional-input" value="${this.searchQuery}"
                                   oninput="productsView.handleSearch(this.value)">
                        </div>
                        <div>
                            <button onclick="productsView.showCreateModal()" class="professional-btn professional-btn-success professional-btn-lg">
                                <span>➕</span> Add New Product
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Professional Product Table -->
            <div class="professional-table-container">
                <div style="padding: 1.5rem; border-bottom: 1px solid var(--gray-200); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h2 style="font-size: 1.25rem; font-weight: 600; color: var(--gray-900); margin: 0;">Product Catalog</h2>
                        <p style="color: var(--gray-600); margin: 0.5rem 0 0 0;">Comprehensive list of all your business products and services</p>
                    </div>
                    <div id="product-stats" style="display: flex; gap: 1rem; align-items: center;">
                        <div style="text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-600);" id="total-products">${this.products.length}</div>
                            <div style="font-size: 0.75rem; color: var(--gray-500); text-transform: uppercase;">Total Products</div>
                        </div>
                    </div>
                </div>
                <table class="professional-table">
                    <thead class="professional-table-header">
                        <tr>
                            <th data-sortable style="cursor: pointer;" onclick="productsView.sortTable('id')">📦 Product ID</th>
                            <th data-sortable style="cursor: pointer;" onclick="productsView.sortTable('name')">📝 Product Name</th>
                            <th data-sortable style="cursor: pointer;" onclick="productsView.sortTable('price')">💰 Price</th>
                            <th data-sortable style="cursor: pointer;" onclick="productsView.sortTable('created_at')">📅 Created Date</th>
                            <th>⚡ Actions</th>
                        </tr>
                    </thead>
                    <tbody id="product-list">
                        ${this.renderProductList()}
                    </tbody>
                </table>
            </div>

            <!-- Modals -->
            ${this.renderModals()}

            <script>
                // Make view instance globally accessible for event handlers
                window.productsView = window.currentViewInstance;
                
                // Initialize view-specific functionality
                setTimeout(() => {
                    if (window.productsView && typeof window.productsView.initializeView === 'function') {
                        window.productsView.initializeView();
                    }
                }, 100);
            </script>
        `;
    }

    renderProductList() {
        if (this.products.length === 0) {
            return `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 3rem; color: var(--gray-500);">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
                        <div style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">No products found</div>
                        <div>Add your first product to get started</div>
                        <button onclick="productsView.showCreateModal()" class="professional-btn professional-btn-primary" style="margin-top: 1rem;">
                            <span>➕</span> Add Product
                        </button>
                    </td>
                </tr>
            `;
        }
        
        return this.products.map((product, index) => `
            <tr style="opacity: 0; transform: translateY(20px); animation: fadeInUp 0.3s ease-out ${index * 0.05}s forwards;">
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
                        <span style="font-weight: 600; font-size: 1.125rem;">$${product.price.toFixed(2)}</span>
                    </div>
                </td>
                <td>${this.formatDate(product.created_at)}</td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button onclick="productsView.showEditModal(${product.id})" class="professional-btn professional-btn-secondary professional-btn-sm" title="Edit product">
                            <span>✏️</span> Edit
                        </button>
                        <button onclick="productsView.deleteProduct(${product.id})" class="professional-btn professional-btn-danger professional-btn-sm" title="Delete product">
                            <span>🗑️</span> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderModals() {
        return `
            <!-- Product Modal -->
            <div id="product-modal" class="professional-modal-backdrop">
                <div class="professional-modal">
                    <div class="professional-modal-header">
                        <h2 id="modal-title" class="professional-modal-title">Add New Product</h2>
                        <button class="professional-modal-close" onclick="productsView.hideModal()" aria-label="Close modal">&times;</button>
                    </div>
                    <div class="professional-modal-body">
                        ${this.renderProductForm()}
                    </div>
                    <div class="professional-modal-footer">
                        <button onclick="productsView.saveProduct()" id="save-btn" class="professional-btn professional-btn-success">
                            <span>💾</span> Save Product
                        </button>
                        <button onclick="productsView.hideModal()" class="professional-btn professional-btn-secondary">
                            <span>❌</span> Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderProductForm() {
        return `
            <form id="product-form" class="professional-form" onsubmit="event.preventDefault(); productsView.saveProduct()">
                <div class="professional-form-group">
                    <label class="professional-label professional-label-required">📝 Product Name</label>
                    <input type="text" id="product-name" name="name" required
                           class="professional-input" placeholder="Enter product name">
                    <div id="name-error" class="professional-error-message" style="display: none;"></div>
                </div>
                
                <div class="professional-form-group">
                    <label class="professional-label professional-label-required">💰 Product Price</label>
                    <div style="position: relative;">
                        <span style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--gray-500); font-weight: 500;">$</span>
                        <input type="number" id="product-price" name="price" step="0.01" min="0.01" required
                               class="professional-input" style="padding-left: 2rem;" placeholder="0.00">
                    </div>
                    <div id="price-error" class="professional-error-message" style="display: none;"></div>
                    <div style="font-size: 0.875rem; color: var(--gray-500); margin-top: 0.25rem;">
                        Enter the price in USD (e.g., 29.99)
                    </div>
                </div>
            </form>
        `;
    }

    // Data loading methods
    async loadData() {
        try {
            this.products = await this.app.loadProducts(this.searchQuery);
        } catch (error) {
            console.error('Error loading products:', error);
            this.app.showNotification('Failed to load products', 'error');
        }
    }

    // Event handlers
    async handleSearch(query) {
        this.searchQuery = query;
        
        // Add visual feedback for search
        const searchInput = document.getElementById('search-input');
        if (query.trim()) {
            searchInput.style.borderColor = 'var(--primary-500)';
            searchInput.style.background = 'var(--primary-50)';
        } else {
            searchInput.style.borderColor = '';
            searchInput.style.background = '';
        }
        
        // Debounced search
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(async () => {
            await this.loadData();
            this.refreshProductList();
        }, 300);
    }

    sortTable(column) {
        // Simple sorting implementation
        this.products.sort((a, b) => {
            let aVal = a[column];
            let bVal = b[column];
            
            if (typeof aVal === 'string') {
                return aVal.localeCompare(bVal);
            } else {
                return aVal - bVal;
            }
        });
        
        this.refreshProductList();
    }

    // Modal methods
    showCreateModal() {
        this.currentMode = 'create';
        this.currentProduct = null;
        
        document.getElementById('modal-title').textContent = '📦 Add New Product';
        this.clearForm();
        this.clearErrors();
        
        if (window.openModal) {
            window.openModal('product-modal');
        }
        
        setTimeout(() => document.getElementById('product-name').focus(), 100);
    }

    showEditModal(productId) {
        this.currentMode = 'edit';
        this.currentProduct = this.products.find(p => p.id === productId);
        
        if (!this.currentProduct) {
            this.app.showNotification('Product not found', 'error');
            return;
        }
        
        document.getElementById('modal-title').textContent = '✏️ Edit Product';
        this.populateForm(this.currentProduct);
        this.clearErrors();
        
        if (window.openModal) {
            window.openModal('product-modal');
        }
        
        setTimeout(() => document.getElementById('product-name').focus(), 100);
    }

    hideModal() {
        if (window.closeModal) {
            window.closeModal();
        }
        this.clearErrors();
    }

    // Form methods
    clearForm() {
        document.getElementById('product-name').value = '';
        document.getElementById('product-price').value = '';
    }

    populateForm(product) {
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-price').value = product.price;
    }

    clearErrors() {
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

    showFieldError(field, message) {
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

    validateForm() {
        const name = document.getElementById('product-name').value.trim();
        const price = parseFloat(document.getElementById('product-price').value);
        
        let hasErrors = false;
        this.clearErrors();
        
        if (!name) {
            this.showFieldError('name', 'Product name is required');
            hasErrors = true;
        } else if (name.length < 2) {
            this.showFieldError('name', 'Product name must be at least 2 characters');
            hasErrors = true;
        }
        
        if (!price || price <= 0) {
            this.showFieldError('price', 'Valid price is required');
            hasErrors = true;
        } else if (price > 999999.99) {
            this.showFieldError('price', 'Price cannot exceed $999,999.99');
            hasErrors = true;
        }
        
        return !hasErrors;
    }

    // Product management
    async saveProduct() {
        if (!this.validateForm()) {
            return;
        }
        
        const formData = {
            name: document.getElementById('product-name').value.trim(),
            price: parseFloat(document.getElementById('product-price').value)
        };
        
        const saveBtn = document.getElementById('save-btn');
        const originalText = saveBtn.innerHTML;
        
        try {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="professional-loading"></span> Saving...';
            
            if (this.currentMode === 'create') {
                await this.app.createProduct(formData);
                this.app.showNotification(`Product "${formData.name}" created successfully`, 'success');
            } else {
                await this.app.updateProduct(this.currentProduct.id, formData);
                this.app.showNotification(`Product "${formData.name}" updated successfully`, 'success');
            }
            
            this.hideModal();
            await this.loadData();
            this.refreshProductList();
            
        } catch (error) {
            console.error('Error saving product:', error);
            this.app.showNotification('Failed to save product. Please try again.', 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
        }
    }

    async deleteProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        const confirmed = confirm(`⚠️ Delete Product\n\nAre you sure you want to delete "${product.name}"? This action cannot be undone.\n\nNote: Products used in existing invoices cannot be deleted.`);
        
        if (!confirmed) return;
        
        try {
            await this.app.deleteProduct(productId);
            this.app.showNotification('Product deleted successfully', 'success');
            
            await this.loadData();
            this.refreshProductList();
            
        } catch (error) {
            console.error('Error deleting product:', error);
            const errorMessage = error.message.includes('is used in invoices') 
                ? 'Cannot delete product that is used in existing invoices.'
                : 'Failed to delete product. Please try again.';
                
            this.app.showNotification(errorMessage, 'error');
        }
    }

    // Helper methods
    refreshProductList() {
        const tbody = document.getElementById('product-list');
        if (tbody) {
            tbody.innerHTML = this.renderProductList();
        }
        
        // Update total count
        const totalElement = document.getElementById('total-products');
        if (totalElement) {
            totalElement.textContent = this.products.length;
        }
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    initializeView() {
        // Make this instance available globally for event handlers
        window.productsView = this;
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        if (!document.head.querySelector('style[data-products-view]')) {
            style.setAttribute('data-products-view', 'true');
            document.head.appendChild(style);
        }
        
        // Initialize debounced search
        this.searchTimeout = null;
    }
}