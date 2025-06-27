/**
 * Dashboard View Component
 * Main dashboard interface for the SPA
 */

export class DashboardView {
    constructor(app) {
        this.app = app;
        this.invoices = [];
        this.stats = {
            created: 0,
            processed: 0,
            deleted: 0
        };
        this.filters = {};
        this.currentInvoice = null;
    }

    async render() {
        // Load data first
        await this.loadData();
        
        return `
            <!-- Welcome Section -->
            <div style="margin-bottom: 2rem;">
                <h1 style="font-size: 2.25rem; font-weight: 700; color: var(--gray-900); margin-bottom: 0.5rem;">
                    Welcome to InvoicePro
                </h1>
                <p style="color: var(--gray-600); font-size: 1.125rem;">
                    Manage your business invoices with professional efficiency
                </p>
            </div>

            <!-- Professional Metrics Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;" id="metrics-grid">
                ${this.renderMetrics()}
            </div>
            
            <!-- Advanced Search & Filter Section -->
            <div class="professional-card" style="margin-bottom: 2rem;">
                <div class="professional-card-header">
                    <h2 class="professional-card-title">Advanced Search & Filters</h2>
                    <p class="professional-card-description">Find invoices quickly with powerful search options</p>
                </div>
                <div class="professional-card-content">
                    ${this.renderFilterForm()}
                </div>
                <div class="professional-card-footer">
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <button type="submit" form="filter-form" class="professional-btn professional-btn-primary">
                            <span>🔍</span> Search Invoices
                        </button>
                        <button type="button" onclick="dashboardView.clearFilters()" class="professional-btn professional-btn-secondary">
                            <span>🗑️</span> Clear Filters
                        </button>
                        <div style="margin-left: auto;">
                            <button type="button" onclick="dashboardView.showCreateModal()" class="professional-btn professional-btn-success professional-btn-lg">
                                <span>➕</span> Create New Invoice
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Professional Invoice Table -->
            <div class="professional-table-container">
                <div style="padding: 1.5rem; border-bottom: 1px solid var(--gray-200);">
                    <h2 style="font-size: 1.25rem; font-weight: 600; color: var(--gray-900); margin: 0;">Invoice Management</h2>
                    <p style="color: var(--gray-600); margin: 0.5rem 0 0 0;">View and manage all your business invoices</p>
                </div>
                <table class="professional-table">
                    <thead class="professional-table-header">
                        <tr>
                            <th data-sortable style="cursor: pointer;">📄 Invoice ID</th>
                            <th data-sortable style="cursor: pointer;">👤 Customer</th>
                            <th data-sortable style="cursor: pointer;">💰 Total Amount</th>
                            <th data-sortable style="cursor: pointer;">📊 Status</th>
                            <th data-sortable style="cursor: pointer;">📅 Created Date</th>
                            <th data-sortable style="cursor: pointer;">✅ Processed Date</th>
                            <th>⚡ Actions</th>
                        </tr>
                    </thead>
                    <tbody id="invoice-list">
                        ${this.renderInvoiceList()}
                    </tbody>
                </table>
            </div>

            <!-- Modals -->
            ${this.renderModals()}

            <script>
                // Make view instance globally accessible for event handlers
                window.dashboardView = window.currentViewInstance;
                
                // Initialize view-specific functionality
                setTimeout(() => {
                    if (window.dashboardView && typeof window.dashboardView.initializeView === 'function') {
                        window.dashboardView.initializeView();
                    }
                }, 100);
            </script>
        `;
    }

    renderMetrics() {
        const customerCount = this.app.getState('customers')?.length || 0;
        const productCount = this.app.getState('products')?.length || 0;
        
        return `
            <div class="professional-metric-card">
                <div class="professional-metric-title">Total Customers</div>
                <div class="professional-metric-value" data-count="${customerCount}" id="customer-count">${customerCount}</div>
                <div class="professional-metric-change positive">
                    <span>👥</span>
                    <span>Active clients</span>
                </div>
            </div>
            <div class="professional-metric-card">
                <div class="professional-metric-title">Total Products</div>
                <div class="professional-metric-value" data-count="${productCount}" id="product-count">${productCount}</div>
                <div class="professional-metric-change positive">
                    <span>📦</span>
                    <span>In catalog</span>
                </div>
            </div>
            <div class="professional-metric-card">
                <div class="professional-metric-title">Pending Invoices</div>
                <div class="professional-metric-value" data-count="${this.stats.created}" id="created-count">${this.stats.created}</div>
                <div class="professional-metric-change">
                    <span>⏳</span>
                    <span>Awaiting processing</span>
                </div>
            </div>
            <div class="professional-metric-card">
                <div class="professional-metric-title">Processed Invoices</div>
                <div class="professional-metric-value" data-count="${this.stats.processed}" id="processed-count">${this.stats.processed}</div>
                <div class="professional-metric-change positive">
                    <span>✅</span>
                    <span>Completed</span>
                </div>
            </div>
            <div class="professional-metric-card">
                <div class="professional-metric-title">Deleted Invoices</div>
                <div class="professional-metric-value" data-count="${this.stats.deleted}" id="deleted-count">${this.stats.deleted}</div>
                <div class="professional-metric-change negative">
                    <span>🗑️</span>
                    <span>Removed</span>
                </div>
            </div>
        `;
    }

    renderFilterForm() {
        return `
            <form id="filter-form" class="professional-form" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;" onsubmit="dashboardView.handleFilterSubmit(event)">
                <div class="professional-form-group">
                    <label class="professional-label">📅 Created From</label>
                    <input type="date" name="created_from" class="professional-input">
                </div>
                <div class="professional-form-group">
                    <label class="professional-label">📅 Created To</label>
                    <input type="date" name="created_to" class="professional-input">
                </div>
                <div class="professional-form-group">
                    <label class="professional-label">✅ Processed From</label>
                    <input type="date" name="processed_from" class="professional-input">
                </div>
                <div class="professional-form-group">
                    <label class="professional-label">✅ Processed To</label>
                    <input type="date" name="processed_to" class="professional-input">
                </div>
                <div class="professional-form-group">
                    <label class="professional-label">💰 Price From</label>
                    <input type="number" step="0.01" name="price_from" class="professional-input" placeholder="0.00">
                </div>
                <div class="professional-form-group">
                    <label class="professional-label">💰 Price To</label>
                    <input type="number" step="0.01" name="price_to" class="professional-input" placeholder="0.00">
                </div>
                <div class="professional-form-group">
                    <label class="professional-label">📦 Product Name</label>
                    <input type="text" name="product_query" class="professional-input" placeholder="Search products...">
                </div>
                <div class="professional-form-group">
                    <label class="professional-label">👤 Customer Name</label>
                    <input type="text" name="customer_query" class="professional-input" placeholder="Search customers...">
                </div>
                <div class="professional-form-group">
                    <label class="professional-label">📊 Status</label>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="checkbox" name="status" value="created" style="accent-color: var(--primary-600);">
                            <span class="professional-badge professional-badge-info">Created</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="checkbox" name="status" value="processed" style="accent-color: var(--success-600);">
                            <span class="professional-badge professional-badge-success">Processed</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="checkbox" name="status" value="deleted" style="accent-color: var(--error-600);">
                            <span class="professional-badge professional-badge-error">Deleted</span>
                        </label>
                    </div>
                </div>
            </form>
        `;
    }

    renderInvoiceList() {
        if (this.invoices.length === 0) {
            return `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem; color: var(--gray-500);">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📄</div>
                        <div style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">No invoices found</div>
                        <div>Create your first invoice to get started</div>
                        <button onclick="dashboardView.showCreateModal()" class="professional-btn professional-btn-primary" style="margin-top: 1rem;">
                            <span>➕</span> Create Invoice
                        </button>
                    </td>
                </tr>
            `;
        }
        
        return this.invoices.map((invoice, index) => {
            const customerInfo = invoice.customer ? invoice.customer.name : 'No Customer';
            const statusBadgeClass = {
                'created': 'professional-badge-info',
                'processed': 'professional-badge-success',
                'deleted': 'professional-badge-error'
            }[invoice.status] || 'professional-badge-neutral';
            
            return `
                <tr style="opacity: 0; transform: translateY(20px); animation: fadeInUp 0.3s ease-out ${index * 0.05}s forwards;">
                    <td style="font-weight: 600; color: var(--primary-600);">#${String(invoice.id).padStart(6, '0')}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 2rem; height: 2rem; background: var(--primary-100); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.875rem;">👤</div>
                            <div>
                                <div style="font-weight: 500;">${customerInfo}</div>
                                ${invoice.customer ? `<div style="font-size: 0.75rem; color: var(--gray-500);">${invoice.customer.phone || ''}</div>` : ''}
                            </div>
                        </div>
                    </td>
                    <td style="font-weight: 600; font-size: 1.125rem;">$${invoice.total_price.toFixed(2)}</td>
                    <td>
                        <span class="professional-badge ${statusBadgeClass}">
                            ${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                    </td>
                    <td>${this.formatDate(invoice.created_at)}</td>
                    <td>${invoice.processed_at ? this.formatDate(invoice.processed_at) : '-'}</td>
                    <td>
                        <button onclick="dashboardView.viewInvoice(${invoice.id})" class="professional-btn professional-btn-secondary professional-btn-sm" style="padding: 0.25rem 0.75rem;">
                            <span>👁️</span> View
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderModals() {
        return `
            <!-- Create Invoice Modal -->
            <div id="create-modal" class="professional-modal-backdrop">
                <div class="professional-modal" style="max-width: 800px;">
                    <div class="professional-modal-header">
                        <h2 class="professional-modal-title">Create New Invoice</h2>
                        <button class="professional-modal-close" onclick="dashboardView.hideCreateModal()" aria-label="Close modal">&times;</button>
                    </div>
                    <div class="professional-modal-body">
                        ${this.renderCreateForm()}
                    </div>
                    <div class="professional-modal-footer">
                        <button onclick="dashboardView.saveInvoice()" class="professional-btn professional-btn-success">
                            <span>💾</span> Save Invoice
                        </button>
                        <button onclick="dashboardView.hideCreateModal()" class="professional-btn professional-btn-secondary">
                            <span>❌</span> Cancel
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- View Invoice Modal -->
            <div id="view-modal" class="professional-modal-backdrop">
                <div class="professional-modal" style="max-width: 900px;">
                    <div class="professional-modal-header">
                        <h2 class="professional-modal-title">Invoice Details</h2>
                        <button class="professional-modal-close" onclick="dashboardView.hideViewModal()" aria-label="Close modal">&times;</button>
                    </div>
                    <div class="professional-modal-body">
                        <div id="invoice-details"></div>
                    </div>
                    <div class="professional-modal-footer">
                        <button id="print-btn" onclick="dashboardView.printInvoice()" class="professional-btn professional-btn-primary">
                            <span>🖨️</span> Generate PDF
                        </button>
                        <button id="process-btn" onclick="dashboardView.updateInvoiceStatus('processed')" class="professional-btn professional-btn-success">
                            <span>✅</span> Mark as Processed
                        </button>
                        <button onclick="dashboardView.updateInvoiceStatus('deleted')" class="professional-btn professional-btn-danger">
                            <span>🗑️</span> Delete Invoice
                        </button>
                        <button onclick="dashboardView.hideViewModal()" class="professional-btn professional-btn-secondary">
                            <span>❌</span> Close
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderCreateForm() {
        const customers = this.app.getState('customers') || [];
        const products = this.app.getState('products') || [];
        
        return `
            <div class="professional-form-group">
                <label class="professional-label professional-label-required">👤 Select Customer</label>
                <select id="customer-select" class="professional-select">
                    <option value="">Choose a customer...</option>
                    ${customers.map(c => `<option value="${c.id}">${c.name} - ${c.phone}</option>`).join('')}
                </select>
                <div id="customer-error" class="professional-error-message" style="display: none;">Please select a customer</div>
            </div>
            
            <div style="margin: 1.5rem 0;">
                <label class="professional-label">📦 Invoice Items</label>
                <div id="invoice-items" style="display: flex; flex-direction: column; gap: 1rem;"></div>
                <button onclick="dashboardView.addInvoiceItem()" class="professional-btn professional-btn-secondary" style="margin-top: 1rem;">
                    <span>➕</span> Add Item
                </button>
            </div>
            
            <div style="background: var(--gray-50); padding: 1.5rem; border-radius: var(--radius-lg); margin: 1.5rem 0;">
                <div style="font-size: 1.5rem; font-weight: 700; color: var(--gray-900);">
                    💰 Total: $<span id="invoice-total">0.00</span>
                </div>
            </div>
        `;
    }

    // Data loading methods
    async loadData() {
        try {
            this.invoices = await this.app.loadInvoices();
            this.updateStats();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.app.showNotification('Failed to load invoices', 'error');
        }
    }

    updateStats() {
        this.stats = {
            created: 0,
            processed: 0,
            deleted: 0
        };
        
        this.invoices.forEach(invoice => {
            this.stats[invoice.status]++;
        });
    }

    // Event handlers
    async handleFilterSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const params = {};
        
        formData.forEach((value, key) => {
            if (value && key !== 'status') {
                params[key] = value;
            }
        });
        
        // Handle status checkboxes
        const statusCheckboxes = event.target.querySelectorAll('input[name="status"]:checked');
        if (statusCheckboxes.length > 0) {
            params.status = Array.from(statusCheckboxes).map(cb => cb.value).join(',');
        }
        
        try {
            this.invoices = await this.app.loadInvoices(params);
            this.updateStats();
            this.refreshInvoiceList();
        } catch (error) {
            this.app.showNotification('Failed to search invoices', 'error');
        }
    }

    clearFilters() {
        document.getElementById('filter-form').reset();
        this.handleFilterSubmit(new Event('submit'));
    }

    // Modal methods
    showCreateModal() {
        this.invoiceItems = [];
        document.getElementById('invoice-items').innerHTML = '';
        document.getElementById('invoice-total').textContent = '0.00';
        document.getElementById('customer-select').value = '';
        this.addInvoiceItem();
        
        if (window.openModal) {
            window.openModal('create-modal');
        }
    }

    hideCreateModal() {
        if (window.closeModal) {
            window.closeModal();
        }
    }

    async viewInvoice(id) {
        try {
            const response = await fetch(`/api/invoices/${id}`);
            const invoice = await response.json();
            this.currentInvoice = invoice;
            
            // Render invoice details
            const detailsDiv = document.getElementById('invoice-details');
            detailsDiv.innerHTML = this.renderInvoiceDetails(invoice);
            
            // Show/hide process button
            const processBtn = document.getElementById('process-btn');
            processBtn.style.display = invoice.status === 'created' ? 'inline-flex' : 'none';
            
            if (window.openModal) {
                window.openModal('view-modal');
            }
        } catch (error) {
            this.app.showNotification('Failed to load invoice details', 'error');
        }
    }

    hideViewModal() {
        if (window.closeModal) {
            window.closeModal();
        }
    }

    renderInvoiceDetails(invoice) {
        // Similar to existing invoice details rendering
        return `
            <div class="professional-card" style="margin-bottom: 1.5rem;">
                <div class="professional-card-header">
                    <h3 class="professional-card-title">📄 Invoice Information</h3>
                </div>
                <div class="professional-card-content">
                    <!-- Invoice details content -->
                </div>
            </div>
        `;
    }

    // Invoice management
    addInvoiceItem() {
        const products = this.app.getState('products') || [];
        const itemDiv = document.createElement('div');
        itemDiv.style.cssText = 'display: flex; gap: 1rem; align-items: center; padding: 1rem; background: var(--gray-50); border-radius: var(--radius-lg); border: 1px solid var(--gray-200);';
        
        itemDiv.innerHTML = `
            <div style="flex: 1;">
                <label class="professional-label">📦 Product</label>
                <select class="professional-select product-select" onchange="dashboardView.updateTotal()">
                    <option value="">Select Product</option>
                    ${products.map(p => `<option value="${p.id}" data-price="${p.price}">${p.name} - $${p.price.toFixed(2)}</option>`).join('')}
                </select>
            </div>
            <div style="width: 120px;">
                <label class="professional-label">📊 Quantity</label>
                <input type="number" min="1" value="1" class="professional-input quantity-input" onchange="dashboardView.updateTotal()">
            </div>
            <div style="align-self: flex-end;">
                <button onclick="dashboardView.removeItem(this)" class="professional-btn professional-btn-danger professional-btn-sm">
                    <span>🗑️</span> Remove
                </button>
            </div>
        `;
        
        document.getElementById('invoice-items').appendChild(itemDiv);
    }

    removeItem(button) {
        button.closest('div[style*="display: flex"]').remove();
        this.updateTotal();
    }

    updateTotal() {
        let total = 0;
        const items = document.querySelectorAll('#invoice-items > div');
        
        items.forEach(item => {
            const select = item.querySelector('.product-select');
            const quantity = item.querySelector('.quantity-input').value;
            const price = select.selectedOptions[0]?.dataset.price || 0;
            total += parseFloat(price) * parseInt(quantity);
        });
        
        document.getElementById('invoice-total').textContent = total.toFixed(2);
    }

    async saveInvoice() {
        const customerId = document.getElementById('customer-select').value;
        if (!customerId) {
            document.getElementById('customer-error').style.display = 'flex';
            return;
        }
        
        const items = [];
        const itemDivs = document.querySelectorAll('#invoice-items > div');
        
        itemDivs.forEach(item => {
            const productId = item.querySelector('.product-select').value;
            const quantity = item.querySelector('.quantity-input').value;
            
            if (productId) {
                items.push({
                    product_id: parseInt(productId),
                    quantity: parseInt(quantity)
                });
            }
        });
        
        if (items.length === 0) {
            this.app.showNotification('Please add at least one item', 'error');
            return;
        }
        
        try {
            await this.app.createInvoice({
                customer_id: parseInt(customerId),
                items
            });
            
            this.hideCreateModal();
            await this.loadData();
            this.refreshInvoiceList();
            this.app.showNotification('Invoice created successfully', 'success');
        } catch (error) {
            this.app.showNotification('Failed to create invoice', 'error');
        }
    }

    async updateInvoiceStatus(status) {
        if (!this.currentInvoice) return;
        
        try {
            await this.app.updateInvoiceStatus(this.currentInvoice.id, status);
            this.hideViewModal();
            await this.loadData();
            this.refreshInvoiceList();
            
            const message = status === 'processed' ? 'Invoice marked as processed' : 'Invoice deleted successfully';
            this.app.showNotification(message, 'success');
        } catch (error) {
            this.app.showNotification('Failed to update invoice status', 'error');
        }
    }

    async printInvoice() {
        if (!this.currentInvoice) return;
        
        try {
            const response = await fetch(`/api/invoices/${this.currentInvoice.id}/pdf`);
            const blob = await response.blob();
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice_${String(this.currentInvoice.id).padStart(6, '0')}.pdf`;
            a.click();
            
            window.URL.revokeObjectURL(url);
            this.app.showNotification('PDF downloaded successfully', 'success');
        } catch (error) {
            this.app.showNotification('Failed to generate PDF', 'error');
        }
    }

    // Helper methods
    refreshInvoiceList() {
        const tbody = document.getElementById('invoice-list');
        if (tbody) {
            tbody.innerHTML = this.renderInvoiceList();
        }
        
        // Update stats displays
        ['created', 'processed', 'deleted'].forEach(status => {
            const element = document.getElementById(`${status}-count`);
            if (element) {
                element.textContent = this.stats[status];
                element.dataset.count = this.stats[status];
            }
        });
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
        window.dashboardView = this;
        
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
        document.head.appendChild(style);
    }
}