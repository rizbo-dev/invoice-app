/**
 * Customers View Component
 * Customer management interface for the SPA
 */

export class CustomersView {
    constructor(app) {
        this.app = app;
        this.customers = [];
        this.currentCustomer = null;
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
                    Customer Management
                </h1>
                <p style="color: var(--gray-600); font-size: 1.125rem;">
                    Manage your customer database with professional efficiency
                </p>
            </div>

            <!-- Search and Actions Section -->
            <div class="professional-card" style="margin-bottom: 2rem;">
                <div class="professional-card-header">
                    <h2 class="professional-card-title">Search & Actions</h2>
                    <p class="professional-card-description">Find customers quickly and manage your client database</p>
                </div>
                <div class="professional-card-content">
                    <div style="display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;">
                        <div style="flex: 1; min-width: 300px;">
                            <label class="professional-label">🔍 Search Customers</label>
                            <input type="text" id="search-input" placeholder="Search by name, phone, or address..." 
                                   class="professional-input" value="${this.searchQuery}"
                                   oninput="customersView.handleSearch(this.value)">
                        </div>
                        <div>
                            <button onclick="customersView.showCreateModal()" class="professional-btn professional-btn-success professional-btn-lg">
                                <span>➕</span> Add New Customer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Professional Customer Table -->
            <div class="professional-table-container">
                <div style="padding: 1.5rem; border-bottom: 1px solid var(--gray-200); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h2 style="font-size: 1.25rem; font-weight: 600; color: var(--gray-900); margin: 0;">Customer Directory</h2>
                        <p style="color: var(--gray-600); margin: 0.5rem 0 0 0;">Comprehensive list of all your business customers</p>
                    </div>
                    <div id="customer-stats" style="display: flex; gap: 1rem; align-items: center;">
                        <div style="text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-600);" id="total-customers">${this.customers.length}</div>
                            <div style="font-size: 0.75rem; color: var(--gray-500); text-transform: uppercase;">Total Customers</div>
                        </div>
                    </div>
                </div>
                <table class="professional-table">
                    <thead class="professional-table-header">
                        <tr>
                            <th data-sortable style="cursor: pointer;" onclick="customersView.sortTable('id')">👤 Customer ID</th>
                            <th data-sortable style="cursor: pointer;" onclick="customersView.sortTable('name')">📝 Name</th>
                            <th data-sortable style="cursor: pointer;" onclick="customersView.sortTable('phone')">📞 Phone</th>
                            <th data-sortable style="cursor: pointer;" onclick="customersView.sortTable('address')">📍 Address</th>
                            <th data-sortable style="cursor: pointer;" onclick="customersView.sortTable('country')">🌍 Country</th>
                            <th data-sortable style="cursor: pointer;" onclick="customersView.sortTable('created_at')">📅 Joined Date</th>
                            <th>⚡ Actions</th>
                        </tr>
                    </thead>
                    <tbody id="customer-list">
                        ${this.renderCustomerList()}
                    </tbody>
                </table>
            </div>

            <!-- Modals -->
            ${this.renderModals()}

            <script>
                // Make view instance globally accessible for event handlers
                window.customersView = window.currentViewInstance;
                
                // Initialize view-specific functionality
                setTimeout(() => {
                    if (window.customersView && typeof window.customersView.initializeView === 'function') {
                        window.customersView.initializeView();
                    }
                }, 100);
            </script>
        `;
    }

    renderCustomerList() {
        if (this.customers.length === 0) {
            return `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem; color: var(--gray-500);">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">👥</div>
                        <div style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">No customers found</div>
                        <div>Add your first customer to get started</div>
                        <button onclick="customersView.showCreateModal()" class="professional-btn professional-btn-primary" style="margin-top: 1rem;">
                            <span>➕</span> Add Customer
                        </button>
                    </td>
                </tr>
            `;
        }
        
        return this.customers.map((customer, index) => `
            <tr style="opacity: 0; transform: translateY(20px); animation: fadeInUp 0.3s ease-out ${index * 0.05}s forwards;">
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
                <td>${this.formatDate(customer.created_at)}</td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button onclick="customersView.showEditModal(${customer.id})" class="professional-btn professional-btn-secondary professional-btn-sm" title="Edit customer">
                            <span>✏️</span> Edit
                        </button>
                        <button onclick="customersView.deleteCustomer(${customer.id})" class="professional-btn professional-btn-danger professional-btn-sm" title="Delete customer">
                            <span>🗑️</span> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderModals() {
        return `
            <!-- Customer Modal -->
            <div id="customer-modal" class="professional-modal-backdrop">
                <div class="professional-modal">
                    <div class="professional-modal-header">
                        <h2 id="modal-title" class="professional-modal-title">Add New Customer</h2>
                        <button class="professional-modal-close" onclick="customersView.hideModal()" aria-label="Close modal">&times;</button>
                    </div>
                    <div class="professional-modal-body">
                        ${this.renderCustomerForm()}
                    </div>
                    <div class="professional-modal-footer">
                        <button onclick="customersView.saveCustomer()" id="save-btn" class="professional-btn professional-btn-success">
                            <span>💾</span> Save Customer
                        </button>
                        <button onclick="customersView.hideModal()" class="professional-btn professional-btn-secondary">
                            <span>❌</span> Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderCustomerForm() {
        return `
            <form id="customer-form" class="professional-form" onsubmit="event.preventDefault(); customersView.saveCustomer()">
                <div class="professional-form-group">
                    <label class="professional-label professional-label-required">👤 Customer Name</label>
                    <input type="text" id="customer-name" name="name" required
                           class="professional-input" placeholder="Enter full name">
                    <div id="name-error" class="professional-error-message" style="display: none;"></div>
                </div>
                
                <div class="professional-form-group">
                    <label class="professional-label professional-label-required">📞 Phone Number</label>
                    <input type="tel" id="customer-phone" name="phone" required
                           class="professional-input" placeholder="Enter phone number">
                    <div id="phone-error" class="professional-error-message" style="display: none;"></div>
                </div>
                
                <div class="professional-form-group">
                    <label class="professional-label professional-label-required">📍 Address</label>
                    <textarea id="customer-address" name="address" required rows="3"
                              class="professional-textarea" placeholder="Enter complete address"></textarea>
                    <div id="address-error" class="professional-error-message" style="display: none;"></div>
                </div>
                
                <div class="professional-form-group">
                    <label class="professional-label professional-label-required">🌍 Country</label>
                    <input type="text" id="customer-country" name="country" required
                           class="professional-input" placeholder="Enter country">
                    <div id="country-error" class="professional-error-message" style="display: none;"></div>
                </div>
            </form>
        `;
    }

    // Data loading methods
    async loadData() {
        try {
            this.customers = await this.app.loadCustomers(this.searchQuery);
        } catch (error) {
            console.error('Error loading customers:', error);
            this.app.showNotification('Failed to load customers', 'error');
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
            this.refreshCustomerList();
        }, 300);
    }

    sortTable(column) {
        // Simple sorting implementation
        this.customers.sort((a, b) => {
            let aVal = a[column];
            let bVal = b[column];
            
            if (typeof aVal === 'string') {
                return aVal.localeCompare(bVal);
            } else {
                return aVal - bVal;
            }
        });
        
        this.refreshCustomerList();
    }

    // Modal methods
    showCreateModal() {
        this.currentMode = 'create';
        this.currentCustomer = null;
        
        document.getElementById('modal-title').textContent = '👤 Add New Customer';
        this.clearForm();
        this.clearErrors();
        
        if (window.openModal) {
            window.openModal('customer-modal');
        }
        
        setTimeout(() => document.getElementById('customer-name').focus(), 100);
    }

    showEditModal(customerId) {
        this.currentMode = 'edit';
        this.currentCustomer = this.customers.find(c => c.id === customerId);
        
        if (!this.currentCustomer) {
            this.app.showNotification('Customer not found', 'error');
            return;
        }
        
        document.getElementById('modal-title').textContent = '✏️ Edit Customer';
        this.populateForm(this.currentCustomer);
        this.clearErrors();
        
        if (window.openModal) {
            window.openModal('customer-modal');
        }
        
        setTimeout(() => document.getElementById('customer-name').focus(), 100);
    }

    hideModal() {
        if (window.closeModal) {
            window.closeModal();
        }
        this.clearErrors();
    }

    // Form methods
    clearForm() {
        document.getElementById('customer-name').value = '';
        document.getElementById('customer-phone').value = '';
        document.getElementById('customer-address').value = '';
        document.getElementById('customer-country').value = '';
    }

    populateForm(customer) {
        document.getElementById('customer-name').value = customer.name;
        document.getElementById('customer-phone').value = customer.phone;
        document.getElementById('customer-address').value = customer.address;
        document.getElementById('customer-country').value = customer.country;
    }

    clearErrors() {
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

    showFieldError(field, message) {
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

    validateForm() {
        const name = document.getElementById('customer-name').value.trim();
        const phone = document.getElementById('customer-phone').value.trim();
        const address = document.getElementById('customer-address').value.trim();
        const country = document.getElementById('customer-country').value.trim();
        
        let hasErrors = false;
        this.clearErrors();
        
        if (!name) {
            this.showFieldError('name', 'Customer name is required');
            hasErrors = true;
        }
        
        if (!phone) {
            this.showFieldError('phone', 'Phone number is required');
            hasErrors = true;
        } else if (phone.length < 7) {
            this.showFieldError('phone', 'Phone number must be at least 7 characters');
            hasErrors = true;
        }
        
        if (!address) {
            this.showFieldError('address', 'Address is required');
            hasErrors = true;
        }
        
        if (!country) {
            this.showFieldError('country', 'Country is required');
            hasErrors = true;
        }
        
        return !hasErrors;
    }

    // Customer management
    async saveCustomer() {
        if (!this.validateForm()) {
            return;
        }
        
        const formData = {
            name: document.getElementById('customer-name').value.trim(),
            phone: document.getElementById('customer-phone').value.trim(),
            address: document.getElementById('customer-address').value.trim(),
            country: document.getElementById('customer-country').value.trim()
        };
        
        const saveBtn = document.getElementById('save-btn');
        const originalText = saveBtn.innerHTML;
        
        try {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="professional-loading"></span> Saving...';
            
            if (this.currentMode === 'create') {
                await this.app.createCustomer(formData);
                this.app.showNotification(`Customer "${formData.name}" created successfully`, 'success');
            } else {
                await this.app.updateCustomer(this.currentCustomer.id, formData);
                this.app.showNotification(`Customer "${formData.name}" updated successfully`, 'success');
            }
            
            this.hideModal();
            await this.loadData();
            this.refreshCustomerList();
            
        } catch (error) {
            console.error('Error saving customer:', error);
            this.app.showNotification('Failed to save customer. Please try again.', 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
        }
    }

    async deleteCustomer(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) return;
        
        const confirmed = confirm(`⚠️ Delete Customer\n\nAre you sure you want to delete "${customer.name}"? This action cannot be undone.\n\nNote: Customers with existing invoices cannot be deleted.`);
        
        if (!confirmed) return;
        
        try {
            await this.app.deleteCustomer(customerId);
            this.app.showNotification('Customer deleted successfully', 'success');
            
            await this.loadData();
            this.refreshCustomerList();
            
        } catch (error) {
            console.error('Error deleting customer:', error);
            const errorMessage = error.message.includes('has invoices') 
                ? 'Cannot delete customer with existing invoices. Please delete or reassign invoices first.'
                : 'Failed to delete customer. Please try again.';
                
            this.app.showNotification(errorMessage, 'error');
        }
    }

    // Helper methods
    refreshCustomerList() {
        const tbody = document.getElementById('customer-list');
        if (tbody) {
            tbody.innerHTML = this.renderCustomerList();
        }
        
        // Update total count
        const totalElement = document.getElementById('total-customers');
        if (totalElement) {
            totalElement.textContent = this.customers.length;
        }
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    initializeView() {
        // Make this instance available globally for event handlers
        window.customersView = this;
        
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
        if (!document.head.querySelector('style[data-customers-view]')) {
            style.setAttribute('data-customers-view', 'true');
            document.head.appendChild(style);
        }
        
        // Initialize debounced search
        this.searchTimeout = null;
    }
}