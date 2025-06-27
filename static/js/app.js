let products = [];
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
    tbody.innerHTML = '';
    
    invoices.forEach(invoice => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">${invoice.id}</td>
            <td class="px-6 py-4 whitespace-nowrap">$${invoice.total_price.toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${invoice.status === 'created' ? 'bg-blue-100 text-blue-800' : ''}
                    ${invoice.status === 'processed' ? 'bg-green-100 text-green-800' : ''}
                    ${invoice.status === 'deleted' ? 'bg-red-100 text-red-800' : ''}">
                    ${invoice.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">${new Date(invoice.created_at).toLocaleString()}</td>
            <td class="px-6 py-4 whitespace-nowrap">${invoice.processed_at ? new Date(invoice.processed_at).toLocaleString() : '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button onclick="viewInvoice(${invoice.id})" class="text-blue-600 hover:text-blue-900">View</button>
            </td>
        `;
        tbody.appendChild(row);
    });
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
    
    document.getElementById('created-count').textContent = stats.created;
    document.getElementById('processed-count').textContent = stats.processed;
    document.getElementById('deleted-count').textContent = stats.deleted;
}

function showCreateModal() {
    invoiceItems = [];
    document.getElementById('invoice-items').innerHTML = '';
    document.getElementById('invoice-total').textContent = '0.00';
    addInvoiceItem();
    document.getElementById('create-modal').classList.remove('hidden');
}

function hideCreateModal() {
    document.getElementById('create-modal').classList.add('hidden');
}

function addInvoiceItem() {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'flex gap-4 items-center';
    itemDiv.innerHTML = `
        <select class="flex-1 px-3 py-2 border rounded product-select" onchange="updateTotal()">
            <option value="">Select Product</option>
            ${products.map(p => `<option value="${p.id}" data-price="${p.price}">${p.name} - $${p.price.toFixed(2)}</option>`).join('')}
        </select>
        <input type="number" min="1" value="1" class="w-20 px-3 py-2 border rounded quantity-input" onchange="updateTotal()">
        <button onclick="removeItem(this)" class="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700">Remove</button>
    `;
    document.getElementById('invoice-items').appendChild(itemDiv);
}

function removeItem(button) {
    button.parentElement.remove();
    updateTotal();
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
            body: JSON.stringify({ items })
        });
        
        if (response.ok) {
            hideCreateModal();
            loadInvoices();
        } else {
            alert('Error creating invoice');
        }
    } catch (error) {
        console.error('Error saving invoice:', error);
        alert('Error creating invoice');
    }
}

async function viewInvoice(id) {
    try {
        const response = await fetch(`/api/invoices/${id}`);
        const invoice = await response.json();
        currentInvoice = invoice;
        
        const detailsDiv = document.getElementById('invoice-details');
        detailsDiv.innerHTML = `
            <div class="mb-4">
                <p><strong>Invoice ID:</strong> ${invoice.id}</p>
                <p><strong>Status:</strong> ${invoice.status}</p>
                <p><strong>Created:</strong> ${new Date(invoice.created_at).toLocaleString()}</p>
                ${invoice.processed_at ? `<p><strong>Processed:</strong> ${new Date(invoice.processed_at).toLocaleString()}</p>` : ''}
            </div>
            <table class="w-full mb-4">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${invoice.items.map(item => `
                        <tr>
                            <td class="px-6 py-4">${item.product.name}</td>
                            <td class="px-6 py-4">${item.quantity}</td>
                            <td class="px-6 py-4">$${item.unit_price.toFixed(2)}</td>
                            <td class="px-6 py-4">$${item.total_price.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="text-lg font-semibold">Total: $${invoice.total_price.toFixed(2)}</div>
        `;
        
        const processBtn = document.getElementById('process-btn');
        if (invoice.status === 'created') {
            processBtn.style.display = 'inline-block';
        } else {
            processBtn.style.display = 'none';
        }
        
        document.getElementById('view-modal').classList.remove('hidden');
    } catch (error) {
        console.error('Error viewing invoice:', error);
        alert('Error loading invoice details');
    }
}

function hideViewModal() {
    document.getElementById('view-modal').classList.add('hidden');
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
            loadInvoices();
        } else {
            alert('Error updating invoice status');
        }
    } catch (error) {
        console.error('Error updating invoice:', error);
        alert('Error updating invoice status');
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
    loadInvoices();
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

window.addEventListener('load', async () => {
    await loadProducts();
    await loadInvoices();
    await loadProductCount();
});