let products = [];
let customers = [];
let currentInvoice = null;
let invoiceItems = [];

async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        products = await response.json();
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

async function loadCustomers() {
    try {
        const response = await fetch('/api/customers');
        customers = await response.json();
        populateCustomerSelect();
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

function populateCustomerSelect() {
    const select = document.getElementById('customer-select');
    select.innerHTML = '<option value="">Choose a customer...</option>';
    
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = `${customer.name} - ${customer.phone}`;
        select.appendChild(option);
    });
}

async function loadInvoices() {
    const form = document.getElementById('filter-form');
    const formData = new FormData(form);
    const params = new URLSearchParams();
    
    formData.forEach((value, key) => {
        if (value && key !== 'status') {
            params.append(key, value);
        }
    });
    
    const statusCheckboxes = form.querySelectorAll('input[name="status"]:checked');
    if (statusCheckboxes.length > 0) {
        const statuses = Array.from(statusCheckboxes).map(cb => cb.value).join(',');
        params.append('status', statuses);
    }
    
    try {
        const response = await fetch(`/api/invoices?${params}`);
        const invoices = await response.json();
        displayInvoices(invoices);
        updateStats(invoices);
    } catch (error) {
        console.error('Error loading invoices:', error);
    }
}

function displayInvoices(invoices) {
    const tbody = document.getElementById('invoice-list');
    
    if (invoices.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 3rem; color: var(--gray-500);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📄</div>
                    <div style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">No invoices found</div>
                    <div>Create your first invoice to get started</div>
                    <button onclick="showCreateModal()" class="professional-btn professional-btn-primary" style="margin-top: 1rem;">
                        <span>➕</span> Create Invoice
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    invoices.forEach((invoice, index) => {
        const customerInfo = invoice.customer ? invoice.customer.name : 'No Customer';
        const row = document.createElement('tr');
        row.style.opacity = '0';
        row.style.transform = 'translateY(20px)';
        row.style.transition = 'all 0.3s ease-in-out';
        
        const statusBadgeClass = {
            'created': 'professional-badge-info',
            'processed': 'professional-badge-success',
            'deleted': 'professional-badge-error'
        }[invoice.status] || 'professional-badge-neutral';
        
        row.innerHTML = `
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
            <td>${window.professionalInteractions ? window.professionalInteractions.formatDate(invoice.created_at) : new Date(invoice.created_at).toLocaleDateString()}</td>
            <td>${invoice.processed_at ? (window.professionalInteractions ? window.professionalInteractions.formatDate(invoice.processed_at) : new Date(invoice.processed_at).toLocaleDateString()) : '-'}</td>
            <td>
                <button onclick="viewInvoice(${invoice.id})" class="professional-btn professional-btn-secondary professional-btn-sm" style="padding: 0.25rem 0.75rem;">
                    <span>👁️</span> View
                </button>
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
        window.announceToScreenReader(`${invoices.length} invoices loaded`);
    }
}

function updateStats(invoices) {
    const stats = {
        created: 0,
        processed: 0,
        deleted: 0
    };
    
    invoices.forEach(invoice => {
        stats[invoice.status]++;
    });
    
    // Animate the count updates
    animateCounterUpdate('created-count', stats.created);
    animateCounterUpdate('processed-count', stats.processed);
    animateCounterUpdate('deleted-count', stats.deleted);
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
            element.dataset.count = newValue;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 50);
}

function showCreateModal() {
    invoiceItems = [];
    document.getElementById('invoice-items').innerHTML = '';
    document.getElementById('invoice-total').textContent = '0.00';
    document.getElementById('customer-select').value = '';
    
    // Clear error states
    const errorElement = document.getElementById('customer-error');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    
    const customerSelect = document.getElementById('customer-select');
    if (customerSelect) {
        customerSelect.classList.remove('error');
    }
    
    addInvoiceItem();
    
    // Use professional modal system
    if (window.openModal) {
        window.openModal('create-modal');
    } else {
        document.getElementById('create-modal').classList.add('active');
    }
}

function hideCreateModal() {
    if (window.closeModal) {
        window.closeModal();
    } else {
        document.getElementById('create-modal').classList.remove('active');
    }
}

function addInvoiceItem() {
    const itemDiv = document.createElement('div');
    itemDiv.style.opacity = '0';
    itemDiv.style.transform = 'translateY(-10px)';
    itemDiv.style.transition = 'all 0.3s ease-in-out';
    itemDiv.style.display = 'flex';
    itemDiv.style.gap = '1rem';
    itemDiv.style.alignItems = 'center';
    itemDiv.style.padding = '1rem';
    itemDiv.style.background = 'var(--gray-50)';
    itemDiv.style.borderRadius = 'var(--radius-lg)';
    itemDiv.style.border = '1px solid var(--gray-200)';
    
    itemDiv.innerHTML = `
        <div style="flex: 1;">
            <label class="professional-label">📦 Product</label>
            <select class="professional-select product-select" onchange="updateTotal()">
                <option value="">Select Product</option>
                ${products.map(p => `<option value="${p.id}" data-price="${p.price}">${p.name} - $${p.price.toFixed(2)}</option>`).join('')}
            </select>
        </div>
        <div style="width: 120px;">
            <label class="professional-label">📊 Quantity</label>
            <input type="number" min="1" value="1" class="professional-input quantity-input" onchange="updateTotal()">
        </div>
        <div style="align-self: flex-end;">
            <button onclick="removeItem(this)" class="professional-btn professional-btn-danger professional-btn-sm">
                <span>🗑️</span> Remove
            </button>
        </div>
    `;
    
    const container = document.getElementById('invoice-items');
    container.appendChild(itemDiv);
    
    // Animate in
    setTimeout(() => {
        itemDiv.style.opacity = '1';
        itemDiv.style.transform = 'translateY(0)';
    }, 50);
}

function removeItem(button) {
    const itemDiv = button.closest('div[style*="display: flex"]');
    if (itemDiv) {
        itemDiv.style.opacity = '0';
        itemDiv.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            itemDiv.remove();
            updateTotal();
        }, 200);
    }
}

function updateTotal() {
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

async function saveInvoice() {
    const saveButton = document.querySelector('[onclick="saveInvoice()"]');
    
    // Validate customer selection
    const customerId = document.getElementById('customer-select').value;
    if (!customerId) {
        const customerSelect = document.getElementById('customer-select');
        const errorElement = document.getElementById('customer-error');
        
        customerSelect.classList.add('error');
        if (errorElement) {
            errorElement.style.display = 'flex';
        }
        
        // Show toast notification
        if (window.showToast) {
            window.showToast('Please select a customer', 'error');
        }
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
        alert('Please add at least one item');
        return;
    }
    
    try {
        const response = await fetch('/api/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                customer_id: parseInt(customerId),
                items 
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            hideCreateModal();
            await loadInvoices();
            
            // Show success toast
            if (window.showToast) {
                window.showToast(`Invoice #${String(result.id).padStart(6, '0')} created successfully`, 'success');
            }
            
            // Reset button state
            if (window.setButtonLoading && saveButton) {
                window.setButtonLoading(saveButton, false);
            }
        } else {
            const error = await response.text();
            if (window.showToast) {
                window.showToast(error || 'Error creating invoice', 'error');
            } else {
                alert(error || 'Error creating invoice');
            }
        }
    } catch (error) {
        console.error('Error saving invoice:', error);
        if (window.showToast) {
            window.showToast('Failed to create invoice. Please try again.', 'error');
        } else {
            alert('Error creating invoice');
        }
    } finally {
        // Always reset button state
        if (window.setButtonLoading && saveButton) {
            window.setButtonLoading(saveButton, false);
        }
    }
}

async function viewInvoice(id) {
    // Show loading state
    if (window.showToast) {
        window.showToast('Loading invoice details...', 'info', 2000);
    }
    
    try {
        const response = await fetch(`/api/invoices/${id}`);
        if (!response.ok) {
            throw new Error('Failed to load invoice');
        }
        
        const invoice = await response.json();
        currentInvoice = invoice;
        
        const detailsDiv = document.getElementById('invoice-details');
        
        const statusBadgeClass = {
            'created': 'professional-badge-info',
            'processed': 'professional-badge-success',
            'deleted': 'professional-badge-error'
        }[invoice.status] || 'professional-badge-neutral';
        
        const customerSection = invoice.customer ? `
            <div class="professional-card" style="margin-bottom: 1.5rem;">
                <div class="professional-card-header">
                    <h3 class="professional-card-title">👤 Customer Information</h3>
                </div>
                <div class="professional-card-content">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div>
                            <div style="font-size: 0.875rem; font-weight: 500; color: var(--gray-600); margin-bottom: 0.25rem;">Name</div>
                            <div style="font-weight: 600;">${invoice.customer.name}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; font-weight: 500; color: var(--gray-600); margin-bottom: 0.25rem;">Phone</div>
                            <div>${invoice.customer.phone}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; font-weight: 500; color: var(--gray-600); margin-bottom: 0.25rem;">Address</div>
                            <div>${invoice.customer.address}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; font-weight: 500; color: var(--gray-600); margin-bottom: 0.25rem;">Country</div>
                            <div>${invoice.customer.country}</div>
                        </div>
                    </div>
                </div>
            </div>
        ` : `<div class="professional-card" style="margin-bottom: 1.5rem; border-left: 4px solid var(--error-500);">
                <div class="professional-card-content">
                    <div style="color: var(--error-600); font-weight: 500;">⚠️ No customer information available</div>
                </div>
            </div>`;
        
        detailsDiv.innerHTML = customerSection + `
            <div class="professional-card" style="margin-bottom: 1.5rem;">
                <div class="professional-card-header">
                    <h3 class="professional-card-title">📄 Invoice Information</h3>
                </div>
                <div class="professional-card-content">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div>
                            <div style="font-size: 0.875rem; font-weight: 500; color: var(--gray-600); margin-bottom: 0.25rem;">Invoice ID</div>
                            <div style="font-weight: 600; color: var(--primary-600);">#${String(invoice.id).padStart(6, '0')}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; font-weight: 500; color: var(--gray-600); margin-bottom: 0.25rem;">Status</div>
                            <span class="professional-badge ${statusBadgeClass}">${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</span>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; font-weight: 500; color: var(--gray-600); margin-bottom: 0.25rem;">Created Date</div>
                            <div>${window.professionalInteractions ? window.professionalInteractions.formatDate(invoice.created_at) : new Date(invoice.created_at).toLocaleDateString()}</div>
                        </div>
                        ${invoice.processed_at ? `<div>
                            <div style="font-size: 0.875rem; font-weight: 500; color: var(--gray-600); margin-bottom: 0.25rem;">Processed Date</div>
                            <div>${window.professionalInteractions ? window.professionalInteractions.formatDate(invoice.processed_at) : new Date(invoice.processed_at).toLocaleDateString()}</div>
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
                        ${invoice.items.map(item => `
                            <tr>
                                <td style="font-weight: 500;">${item.product.name}</td>
                                <td style="text-align: center;">${item.quantity}</td>
                                <td>${window.professionalInteractions ? window.professionalInteractions.formatCurrency(item.unit_price) : '$' + item.unit_price.toFixed(2)}</td>
                                <td style="font-weight: 600;">${window.professionalInteractions ? window.professionalInteractions.formatCurrency(item.total_price) : '$' + item.total_price.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="professional-card">
                <div class="professional-card-content" style="background: var(--primary-50); text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-700);">
                        💰 Total Amount: ${window.professionalInteractions ? window.professionalInteractions.formatCurrency(invoice.total_price) : '$' + invoice.total_price.toFixed(2)}
                    </div>
                </div>
            </div>
        `;
        
        const processBtn = document.getElementById('process-btn');
        if (invoice.status === 'created') {
            processBtn.style.display = 'inline-block';
        } else {
            processBtn.style.display = 'none';
        }
        
        // Use professional modal system
        if (window.openModal) {
            window.openModal('view-modal');
        } else {
            document.getElementById('view-modal').classList.add('active');
        }
    } catch (error) {
        console.error('Error viewing invoice:', error);
        if (window.showToast) {
            window.showToast('Failed to load invoice details', 'error');
        } else {
            alert('Error loading invoice details');
        }
    }
}

function hideViewModal() {
    if (window.closeModal) {
        window.closeModal();
    } else {
        document.getElementById('view-modal').classList.remove('active');
    }
}

async function updateInvoiceStatus(status) {
    if (!currentInvoice) return;
    
    try {
        const response = await fetch(`/api/invoices/${currentInvoice.id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            hideViewModal();
            await loadInvoices();
            
            // Show success message
            const statusMessages = {
                'processed': 'Invoice marked as processed',
                'deleted': 'Invoice deleted successfully'
            };
            
            if (window.showToast) {
                window.showToast(statusMessages[status] || 'Status updated', 'success');
            }
        } else {
            const errorText = await response.text();
            if (window.showToast) {
                window.showToast(errorText || 'Error updating invoice status', 'error');
            } else {
                alert('Error updating invoice status');
            }
        }
    } catch (error) {
        console.error('Error updating invoice:', error);
        if (window.showToast) {
            window.showToast('Failed to update invoice status', 'error');
        } else {
            alert('Error updating invoice status');
        }
    }
}

async function printInvoice() {
    if (!currentInvoice) return;
    
    const printBtn = document.getElementById('print-btn');
    const originalText = printBtn.textContent;
    
    try {
        printBtn.disabled = true;
        printBtn.textContent = 'Generating PDF...';
        
        const response = await fetch(`/api/invoices/${currentInvoice.id}/pdf`);
        
        if (!response.ok) {
            throw new Error('Failed to generate PDF');
        }
        
        // Create blob from response
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `invoice_${String(currentInvoice.id).padStart(6, '0')}.pdf`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Show success message
        showSuccessToast('PDF downloaded successfully');
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to generate PDF. Please try again.');
    } finally {
        printBtn.disabled = false;
        printBtn.textContent = originalText;
    }
}

function showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function clearFilters() {
    document.getElementById('filter-form').reset();
    
    // Animate the clear action
    const form = document.getElementById('filter-form');
    form.style.opacity = '0.5';
    
    setTimeout(() => {
        form.style.opacity = '1';
        loadInvoices();
    }, 200);
    
    if (window.showToast) {
        window.showToast('Filters cleared', 'info', 2000);
    }
}

document.getElementById('filter-form').addEventListener('submit', (e) => {
    e.preventDefault();
    loadInvoices();
});

async function loadProductCount() {
    try {
        const response = await fetch('/api/products');
        const products = await response.json();
        document.getElementById('product-count').textContent = products.length;
    } catch (error) {
        console.error('Error loading product count:', error);
    }
}

async function loadCustomerCount() {
    try {
        const response = await fetch('/api/customers');
        const customers = await response.json();
        document.getElementById('customer-count').textContent = customers.length;
    } catch (error) {
        console.error('Error loading customer count:', error);
    }
}

window.addEventListener('load', async () => {
    await loadProducts();
    await loadCustomers();
    await loadInvoices();
    await loadProductCount();
    await loadCustomerCount();
});