/**
 * Invoice Detail View Component
 * Detailed invoice view interface for the SPA
 */

export class InvoiceDetailView {
    constructor(app, invoiceId) {
        this.app = app;
        this.invoiceId = invoiceId;
        this.invoice = null;
    }

    async render() {
        // Load invoice data first
        await this.loadData();
        
        if (!this.invoice) {
            return `
                <div style="text-align: center; padding: 4rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                    <h1 style="font-size: 2rem; margin-bottom: 1rem;">Invoice Not Found</h1>
                    <p style="color: var(--gray-600); margin-bottom: 2rem;">The invoice you're looking for doesn't exist or has been deleted.</p>
                    <a href="#/dashboard" class="professional-btn professional-btn-primary">Go to Dashboard</a>
                </div>
            `;
        }
        
        return `
            <!-- Invoice Header -->
            <div style="margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h1 style="font-size: 2.25rem; font-weight: 700; color: var(--gray-900);">
                        Invoice #${String(this.invoice.id).padStart(6, '0')}
                    </h1>
                    <div style="display: flex; gap: 1rem;">
                        <button onclick="invoiceDetailView.printInvoice()" class="professional-btn professional-btn-primary">
                            <span>🖨️</span> Generate PDF
                        </button>
                        ${this.invoice.status === 'created' ? `
                            <button onclick="invoiceDetailView.updateStatus('processed')" class="professional-btn professional-btn-success">
                                <span>✅</span> Mark as Processed
                            </button>
                        ` : ''}
                        <button onclick="invoiceDetailView.updateStatus('deleted')" class="professional-btn professional-btn-danger">
                            <span>🗑️</span> Delete Invoice
                        </button>
                    </div>
                </div>
                <div style="color: var(--gray-600);">
                    Created on ${this.formatDate(this.invoice.created_at)}
                    ${this.invoice.processed_at ? ` • Processed on ${this.formatDate(this.invoice.processed_at)}` : ''}
                </div>
            </div>

            <!-- Invoice Details -->
            ${this.renderInvoiceDetails()}

            <script>
                // Make view instance globally accessible for event handlers
                window.invoiceDetailView = window.currentViewInstance;
            </script>
        `;
    }

    renderInvoiceDetails() {
        const statusBadgeClass = {
            'created': 'professional-badge-info',
            'processed': 'professional-badge-success', 
            'deleted': 'professional-badge-error'
        }[this.invoice.status] || 'professional-badge-neutral';

        const customerSection = this.invoice.customer ? `
            <div class="professional-card" style="margin-bottom: 1.5rem;">
                <div class="professional-card-header">
                    <h3 class="professional-card-title">👤 Customer Information</h3>
                </div>
                <div class="professional-card-content">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div>
                            <div style="font-size: 0.875rem; font-weight: 500; color: var(--gray-600); margin-bottom: 0.25rem;">Name</div>
                            <div style="font-weight: 600;">${this.invoice.customer.name}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; font-weight: 500; color: var(--gray-600); margin-bottom: 0.25rem;">Phone</div>
                            <div>${this.invoice.customer.phone}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; font-weight: 500; color: var(--gray-600); margin-bottom: 0.25rem;">Address</div>
                            <div>${this.invoice.customer.address}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; font-weight: 500; color: var(--gray-600); margin-bottom: 0.25rem;">Country</div>
                            <div>${this.invoice.customer.country}</div>
                        </div>
                    </div>
                </div>
            </div>
        ` : `<div class="professional-card" style="margin-bottom: 1.5rem; border-left: 4px solid var(--error-500);">
                <div class="professional-card-content">
                    <div style="color: var(--error-600); font-weight: 500;">⚠️ No customer information available</div>
                </div>
            </div>`;

        return `
            ${customerSection}
            
            <div class="professional-card" style="margin-bottom: 1.5rem;">
                <div class="professional-card-header">
                    <h3 class="professional-card-title">📄 Invoice Information</h3>
                </div>
                <div class="professional-card-content">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div>
                            <div style="font-size: 0.875rem; font-weight: 500; color: var(--gray-600); margin-bottom: 0.25rem;">Invoice ID</div>
                            <div style="font-weight: 600; color: var(--primary-600);">#${String(this.invoice.id).padStart(6, '0')}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; font-weight: 500; color: var(--gray-600); margin-bottom: 0.25rem;">Status</div>
                            <span class="professional-badge ${statusBadgeClass}">${this.invoice.status.charAt(0).toUpperCase() + this.invoice.status.slice(1)}</span>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; font-weight: 500; color: var(--gray-600); margin-bottom: 0.25rem;">Created Date</div>
                            <div>${this.formatDate(this.invoice.created_at)}</div>
                        </div>
                        ${this.invoice.processed_at ? `<div>
                            <div style="font-size: 0.875rem; font-weight: 500; color: var(--gray-600); margin-bottom: 0.25rem;">Processed Date</div>
                            <div>${this.formatDate(this.invoice.processed_at)}</div>
                        </div>` : ''}
                    </div>
                </div>
            </div>
            
            <div class="professional-table-container" style="margin-bottom: 1.5rem;">
                <div style="padding: 1rem 1.5rem; border-bottom: 1px solid var(--gray-200);">
                    <h3 style="font-size: 1.125rem; font-weight: 600; color: var(--gray-900); margin: 0;">📦 Invoice Items</h3>
                </div>
                <table class="professional-table">
                    <thead class="professional-table-header">
                        <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.invoice.items.map(item => `
                            <tr>
                                <td style="font-weight: 500;">${item.product.name}</td>
                                <td style="text-align: center;">${item.quantity}</td>
                                <td>${this.formatCurrency(item.unit_price)}</td>
                                <td style="font-weight: 600;">${this.formatCurrency(item.total_price)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="professional-card">
                <div class="professional-card-content" style="background: var(--primary-50); text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-700);">
                        💰 Total Amount: ${this.formatCurrency(this.invoice.total_price)}
                    </div>
                </div>
            </div>
        `;
    }

    // Data loading methods
    async loadData() {
        try {
            const response = await fetch(`/api/invoices/${this.invoiceId}`);
            if (response.ok) {
                this.invoice = await response.json();
            } else {
                console.error('Invoice not found');
            }
        } catch (error) {
            console.error('Error loading invoice:', error);
            this.app.showNotification('Failed to load invoice details', 'error');
        }
    }

    // Actions
    async updateStatus(status) {
        const confirmMessages = {
            'processed': 'Mark this invoice as processed?',
            'deleted': 'Delete this invoice? This action cannot be undone.'
        };

        if (!confirm(confirmMessages[status])) {
            return;
        }

        try {
            await this.app.updateInvoiceStatus(this.invoice.id, status);
            
            const successMessages = {
                'processed': 'Invoice marked as processed',
                'deleted': 'Invoice deleted successfully'
            };
            
            this.app.showNotification(successMessages[status], 'success');
            
            // Navigate back to dashboard
            this.app.navigateTo('/dashboard');
            
        } catch (error) {
            this.app.showNotification('Failed to update invoice status', 'error');
        }
    }

    async printInvoice() {
        try {
            const response = await fetch(`/api/invoices/${this.invoice.id}/pdf`);
            
            if (!response.ok) {
                throw new Error('Failed to generate PDF');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice_${String(this.invoice.id).padStart(6, '0')}.pdf`;
            a.click();
            
            window.URL.revokeObjectURL(url);
            this.app.showNotification('PDF downloaded successfully', 'success');
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            this.app.showNotification('Failed to generate PDF. Please try again.', 'error');
        }
    }

    // Helper methods
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
}