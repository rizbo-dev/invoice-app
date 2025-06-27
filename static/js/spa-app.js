/**
 * SPA Application Controller - Main application entry point
 * Manages views, state, and application lifecycle
 */

class InvoiceProApp {
    constructor() {
        this.state = {
            user: null,
            invoices: [],
            customers: [],
            products: [],
            currentView: null,
            loading: false,
            cache: new Map()
        };
        
        this.apiBaseUrl = '/api';
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.viewComponents = new Map();
        
        // Initialize application
        this.init();
    }

    async init() {
        console.log('🚀 Initializing InvoicePro SPA...');
        
        // Setup router first
        this.setupRouter();
        
        // Setup global event handlers
        this.setupEventHandlers();
        
        // Load initial data
        await this.loadInitialData();
        
        // Start router after everything is set up
        try {
            window.SPARouter.start();
        } catch (error) {
            console.error('Error starting router:', error);
            this.showNotification('Failed to initialize application. Please refresh the page.', 'error');
            // Fallback: try to navigate to dashboard manually
            setTimeout(() => {
                window.location.hash = '#/dashboard';
            }, 1000);
        }
        
        // Register service worker for offline support (optional)
        this.registerServiceWorker();
        
        console.log('✅ InvoicePro SPA initialized successfully');
    }

    setupRouter() {
        // Configure router
        window.SPARouter
            .setViewContainer('#app-content')
            .setLoadingTemplate(this.getLoadingTemplate())
            .setNotFoundTemplate(this.get404Template());
        
        // Register routes
        window.SPARouter
            .register('/dashboard', {
                title: 'Dashboard',
                component: async (route) => {
                    const { DashboardView } = await import('./views/dashboard-view.js');
                    const viewInstance = new DashboardView(this);
                    window.currentViewInstance = viewInstance;
                    return viewInstance.render();
                }
            })
            .register('/customers', {
                title: 'Customers',
                component: async (route) => {
                    const { CustomersView } = await import('./views/customers-view.js');
                    const viewInstance = new CustomersView(this);
                    window.currentViewInstance = viewInstance;
                    return viewInstance.render();
                }
            })
            .register('/products', {
                title: 'Products',
                component: async (route) => {
                    const { ProductsView } = await import('./views/products-view.js');
                    const viewInstance = new ProductsView(this);
                    window.currentViewInstance = viewInstance;
                    return viewInstance.render();
                }
            })
            .register('/invoice/:id', {
                title: 'Invoice Details',
                component: async (route) => {
                    const { InvoiceDetailView } = await import('./views/invoice-detail-view.js');
                    const viewInstance = new InvoiceDetailView(this, route.params.id);
                    window.currentViewInstance = viewInstance;
                    return viewInstance.render();
                }
            });
        
        // Set route hooks
        window.SPARouter.beforeRouteChange = async (to, from) => {
            // Add any route guards here
            console.log(`Navigating from ${from?.path || 'none'} to ${to.path}`);
            return true;
        };
        
        window.SPARouter.afterRouteChange = async (to, from) => {
            // Track navigation or update analytics
            this.state.currentView = to.path;
            
            // Update breadcrumb
            this.updateBreadcrumb(to);
        };
    }

    setupEventHandlers() {
        // Handle view mounted events
        window.addEventListener('viewMounted', (e) => {
            console.log('View mounted:', e.detail.route.path);
            
            // Reinitialize any view-specific functionality
            this.initializeViewFeatures();
        });
        
        // Handle global app events
        window.addEventListener('app:refresh', () => {
            this.refreshCurrentView();
        });
        
        window.addEventListener('app:clearCache', () => {
            this.clearCache();
        });
        
        // Handle online/offline events
        window.addEventListener('online', () => {
            this.handleOnline();
        });
        
        window.addEventListener('offline', () => {
            this.handleOffline();
        });
    }

    async loadInitialData() {
        try {
            // Load data that's needed across multiple views
            const [customers, products] = await Promise.all([
                this.fetchWithCache('/customers', 'customers'),
                this.fetchWithCache('/products', 'products')
            ]);
            
            this.state.customers = customers;
            this.state.products = products;
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    /**
     * Fetch data with caching support
     */
    async fetchWithCache(endpoint, cacheKey, options = {}) {
        const fullUrl = `${this.apiBaseUrl}${endpoint}`;
        const cached = this.getFromCache(cacheKey);
        
        // Return cached data if valid
        if (cached && !options.forceRefresh) {
            return cached;
        }
        
        try {
            const response = await fetch(fullUrl, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Cache the response
            this.setCache(cacheKey, data);
            
            return data;
        } catch (error) {
            // If offline and have cached data, return it
            if (!navigator.onLine && cached) {
                console.log('Offline - returning cached data for:', cacheKey);
                return cached;
            }
            throw error;
        }
    }

    /**
     * Make API request without caching
     */
    async apiRequest(endpoint, options = {}) {
        const fullUrl = `${this.apiBaseUrl}${endpoint}`;
        
        try {
            // Show loading state
            this.setLoading(true);
            
            const response = await fetch(fullUrl, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || response.statusText);
            }
            
            const data = await response.json();
            return data;
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Cache management
     */
    getFromCache(key) {
        const cached = this.state.cache.get(key);
        if (!cached) return null;
        
        // Check if cache is expired
        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.state.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    setCache(key, data) {
        this.state.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clearCache(key = null) {
        if (key) {
            this.state.cache.delete(key);
        } else {
            this.state.cache.clear();
        }
    }

    /**
     * State management
     */
    setState(updates) {
        this.state = { ...this.state, ...updates };
        
        // Trigger state change event
        window.dispatchEvent(new CustomEvent('app:stateChanged', {
            detail: { state: this.state, updates }
        }));
    }

    getState(key = null) {
        return key ? this.state[key] : this.state;
    }

    setLoading(loading) {
        this.setState({ loading });
        
        // Update UI loading state
        if (loading) {
            document.body.classList.add('app-loading');
        } else {
            document.body.classList.remove('app-loading');
        }
    }

    /**
     * View management
     */
    refreshCurrentView() {
        window.SPARouter.reload();
    }

    navigateTo(path, options = {}) {
        window.SPARouter.navigate(path, options);
    }

    initializeViewFeatures() {
        // Reinitialize professional interactions for dynamically loaded content
        if (window.professionalInteractions) {
            window.professionalInteractions.initCountAnimations();
            window.professionalInteractions.initTableInteractions();
            window.professionalInteractions.initFormInteractions();
        }
        
        // Initialize any view-specific features
        this.initializeTooltips();
        this.initializePopovers();
    }

    /**
     * UI Helper methods
     */
    updateBreadcrumb(route) {
        const breadcrumb = document.querySelector('.professional-breadcrumb');
        if (!breadcrumb) return;
        
        const pathMap = {
            '/dashboard': '🏠 Dashboard',
            '/customers': '<a href="#/dashboard">🏠 Dashboard</a> / 👥 Customers',
            '/products': '<a href="#/dashboard">🏠 Dashboard</a> / 📦 Products',
            '/invoice': '<a href="#/dashboard">🏠 Dashboard</a> / 📄 Invoice Details'
        };
        
        const path = route.path.startsWith('/invoice/') ? '/invoice' : route.path;
        breadcrumb.innerHTML = pathMap[path] || '🏠 Dashboard';
    }

    showNotification(message, type = 'info', duration = 4000) {
        if (window.showToast) {
            window.showToast(message, type, duration);
        }
    }

    /**
     * Template helpers
     */
    getLoadingTemplate() {
        return `
            <div class="professional-loading-view" style="min-height: 60vh; display: flex; align-items: center; justify-content: center;">
                <div style="text-align: center;">
                    <div class="professional-loading" style="width: 64px; height: 64px; margin: 0 auto 1.5rem;"></div>
                    <div style="font-size: 1.25rem; color: var(--gray-600); margin-bottom: 0.5rem;">Loading content...</div>
                    <div style="font-size: 0.875rem; color: var(--gray-500);">Please wait a moment</div>
                </div>
            </div>
        `;
    }

    get404Template() {
        return `
            <div class="professional-404-view" style="min-height: 60vh; display: flex; align-items: center; justify-content: center;">
                <div style="text-align: center; max-width: 500px;">
                    <div style="font-size: 6rem; font-weight: 700; color: var(--gray-300); margin-bottom: 1rem;">404</div>
                    <h1 style="font-size: 2rem; font-weight: 600; color: var(--gray-900); margin-bottom: 1rem;">Page Not Found</h1>
                    <p style="color: var(--gray-600); margin-bottom: 2rem; font-size: 1.125rem;">
                        Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
                    </p>
                    <div style="display: flex; gap: 1rem; justify-content: center;">
                        <a href="#/dashboard" class="professional-btn professional-btn-primary professional-btn-lg">
                            <span>🏠</span> Go to Dashboard
                        </a>
                        <button onclick="window.history.back()" class="professional-btn professional-btn-secondary professional-btn-lg">
                            <span>↩️</span> Go Back
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Offline support
     */
    handleOnline() {
        this.showNotification('Connection restored', 'success');
        // Sync any queued actions
        this.syncOfflineQueue();
    }

    handleOffline() {
        this.showNotification('You are currently offline', 'warning');
    }

    async syncOfflineQueue() {
        // Implement offline queue synchronization
        console.log('Syncing offline queue...');
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            // Service worker registration for offline support
            // This is optional and can be implemented later
        }
    }

    /**
     * Utility methods
     */
    initializeTooltips() {
        // Initialize tooltips for dynamically loaded content
        document.querySelectorAll('[data-tooltip]').forEach(el => {
            // Tooltip initialization logic
        });
    }

    initializePopovers() {
        // Initialize popovers for dynamically loaded content
        document.querySelectorAll('[data-popover]').forEach(el => {
            // Popover initialization logic
        });
    }

    /**
     * Global API methods for views
     */
    async loadInvoices(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/invoices?${queryString}` : '/invoices';
        return await this.fetchWithCache(endpoint, 'invoices', { forceRefresh: true });
    }

    async loadCustomers(search = '') {
        const endpoint = search ? `/customers?search=${encodeURIComponent(search)}` : '/customers';
        return await this.fetchWithCache(endpoint, 'customers', { forceRefresh: true });
    }

    async loadProducts(search = '') {
        const endpoint = search ? `/products?search=${encodeURIComponent(search)}` : '/products';
        return await this.fetchWithCache(endpoint, 'products', { forceRefresh: true });
    }

    async createInvoice(data) {
        const result = await this.apiRequest('/invoices', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        this.clearCache('invoices');
        return result;
    }

    async updateInvoiceStatus(id, status) {
        const result = await this.apiRequest(`/invoices/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        this.clearCache('invoices');
        return result;
    }

    async createCustomer(data) {
        const result = await this.apiRequest('/customers', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        this.clearCache('customers');
        return result;
    }

    async updateCustomer(id, data) {
        const result = await this.apiRequest(`/customers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        this.clearCache('customers');
        return result;
    }

    async deleteCustomer(id) {
        const result = await this.apiRequest(`/customers/${id}`, {
            method: 'DELETE'
        });
        this.clearCache('customers');
        return result;
    }

    async createProduct(data) {
        const result = await this.apiRequest('/products', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        this.clearCache('products');
        return result;
    }

    async updateProduct(id, data) {
        const result = await this.apiRequest(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        this.clearCache('products');
        return result;
    }

    async deleteProduct(id) {
        const result = await this.apiRequest(`/products/${id}`, {
            method: 'DELETE'
        });
        this.clearCache('products');
        return result;
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.InvoiceProApp = new InvoiceProApp();
});