/**
 * SPA Router - Client-side routing system for InvoicePro
 * Handles navigation, history management, and view loading
 */

class SPARouter {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.previousRoute = null;
        this.viewContainer = null;
        this.beforeRouteChange = null;
        this.afterRouteChange = null;
        this.loadingTemplate = null;
        this.notFoundTemplate = null;
        
        // Initialize router
        this.init();
    }

    init() {
        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleRouteChange());
        
        // Listen for popstate (back/forward buttons)
        window.addEventListener('popstate', () => this.handleRouteChange());
        
        // Intercept all navigation links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link) {
                e.preventDefault();
                const href = link.getAttribute('href');
                this.navigate(href);
            }
        });
    }

    /**
     * Start the router and handle initial route
     * Should be called after routes are registered
     */
    start() {
        console.log('🚀 Starting SPA Router...');
        this.handleRouteChange();
    }

    /**
     * Register a route with its handler
     */
    register(path, config) {
        this.routes.set(path, {
            path,
            title: config.title || 'InvoicePro',
            component: config.component,
            beforeEnter: config.beforeEnter,
            data: config.data || {},
            cache: config.cache !== false, // Cache by default
            transition: config.transition || 'fade'
        });
        return this;
    }

    /**
     * Set the view container element
     */
    setViewContainer(selector) {
        this.viewContainer = document.querySelector(selector);
        if (!this.viewContainer) {
            console.error(`View container not found: ${selector}`);
        }
        return this;
    }

    /**
     * Set loading template
     */
    setLoadingTemplate(template) {
        this.loadingTemplate = template || `
            <div class="professional-loading-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 50vh;">
                <div class="professional-loading" style="width: 48px; height: 48px; margin-bottom: 1rem;"></div>
                <div style="color: var(--gray-600); font-size: 1.125rem;">Loading...</div>
            </div>
        `;
        return this;
    }

    /**
     * Set 404 template
     */
    setNotFoundTemplate(template) {
        this.notFoundTemplate = template || `
            <div style="text-align: center; padding: 4rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">404</div>
                <h1 style="font-size: 2rem; margin-bottom: 1rem;">Page Not Found</h1>
                <p style="color: var(--gray-600); margin-bottom: 2rem;">The page you're looking for doesn't exist.</p>
                <a href="#/dashboard" class="professional-btn professional-btn-primary">Go to Dashboard</a>
            </div>
        `;
        return this;
    }

    /**
     * Navigate to a route
     */
    navigate(path, options = {}) {
        // Normalize path
        if (!path.startsWith('#')) {
            path = '#' + path;
        }
        
        // Update URL
        if (options.replace) {
            window.location.replace(path);
        } else {
            window.location.hash = path;
        }
        
        // Route change will be handled by hashchange event
    }

    /**
     * Handle route changes
     */
    async handleRouteChange() {
        const path = this.getCurrentPath();
        const route = this.findRoute(path);
        
        if (!route) {
            this.render404();
            return;
        }
        
        // Store previous route
        this.previousRoute = this.currentRoute;
        this.currentRoute = route;
        
        // Before route change hook
        if (this.beforeRouteChange) {
            const canProceed = await this.beforeRouteChange(route, this.previousRoute);
            if (canProceed === false) {
                // Restore previous route
                if (this.previousRoute) {
                    window.history.back();
                }
                return;
            }
        }
        
        // Route guard
        if (route.beforeEnter) {
            const canEnter = await route.beforeEnter(route);
            if (canEnter === false) {
                this.navigate('/dashboard', { replace: true });
                return;
            }
        }
        
        // Update document title
        document.title = `${route.title} - InvoicePro`;
        
        // Show loading state
        this.showLoading();
        
        try {
            // Load and render component
            await this.renderRoute(route);
            
            // After route change hook
            if (this.afterRouteChange) {
                await this.afterRouteChange(route, this.previousRoute);
            }
            
            // Update active navigation states
            this.updateActiveStates(path);
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
        } catch (error) {
            console.error('Error rendering route:', error);
            this.renderError(error);
        }
    }

    /**
     * Get current path from hash
     */
    getCurrentPath() {
        let hash = window.location.hash.slice(1); // Remove #
        if (!hash || hash === '/') {
            hash = '/dashboard'; // Default route
        }
        return hash;
    }

    /**
     * Find route by path
     */
    findRoute(path) {
        // Exact match
        if (this.routes.has(path)) {
            return this.routes.get(path);
        }
        
        // Check for parameterized routes
        for (const [routePath, route] of this.routes) {
            const regex = this.pathToRegex(routePath);
            const match = path.match(regex);
            if (match) {
                // Extract params
                const params = this.extractParams(routePath, path);
                return { ...route, params };
            }
        }
        
        return null;
    }

    /**
     * Convert route path to regex for matching
     */
    pathToRegex(path) {
        // Convert :param to regex groups
        const pattern = path
            .replace(/\//g, '\\/')
            .replace(/:(\w+)/g, '([^/]+)');
        return new RegExp(`^${pattern}$`);
    }

    /**
     * Extract parameters from path
     */
    extractParams(routePath, actualPath) {
        const params = {};
        const routeParts = routePath.split('/');
        const actualParts = actualPath.split('/');
        
        routeParts.forEach((part, index) => {
            if (part.startsWith(':')) {
                const paramName = part.slice(1);
                params[paramName] = actualParts[index];
            }
        });
        
        return params;
    }

    /**
     * Show loading state
     */
    showLoading() {
        if (this.viewContainer) {
            this.viewContainer.style.opacity = '0.5';
            this.viewContainer.innerHTML = this.loadingTemplate || '<div>Loading...</div>';
        }
    }

    /**
     * Render route component
     */
    async renderRoute(route) {
        if (!this.viewContainer) {
            throw new Error('View container not set');
        }
        
        // Get component content
        let content;
        if (typeof route.component === 'function') {
            content = await route.component(route);
        } else {
            content = route.component;
        }
        
        // Apply transition
        await this.applyTransition(content, route.transition);
    }

    /**
     * Apply transition effect
     */
    async applyTransition(content, transitionType = 'fade') {
        const container = this.viewContainer;
        
        // Fade out
        container.style.transition = 'opacity 0.2s ease-in-out';
        container.style.opacity = '0';
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Update content
        container.innerHTML = content;
        
        // Fade in
        container.style.opacity = '1';
        
        // Execute any scripts in the new content
        this.executeScripts(container);
        
        // Trigger view mounted event
        window.dispatchEvent(new CustomEvent('viewMounted', { 
            detail: { route: this.currentRoute } 
        }));
    }

    /**
     * Execute scripts in dynamically loaded content
     */
    executeScripts(container) {
        const scripts = container.querySelectorAll('script');
        scripts.forEach(script => {
            const newScript = document.createElement('script');
            if (script.src) {
                newScript.src = script.src;
            } else {
                newScript.textContent = script.textContent;
            }
            script.parentNode.replaceChild(newScript, script);
        });
    }

    /**
     * Render 404 page
     */
    render404() {
        document.title = '404 - Page Not Found';
        if (this.viewContainer) {
            this.viewContainer.innerHTML = this.notFoundTemplate || '<h1>404 - Page Not Found</h1>';
        }
    }

    /**
     * Render error page
     */
    renderError(error) {
        if (this.viewContainer) {
            this.viewContainer.innerHTML = `
                <div style="text-align: center; padding: 4rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                    <h1 style="font-size: 2rem; margin-bottom: 1rem;">Oops! Something went wrong</h1>
                    <p style="color: var(--gray-600); margin-bottom: 2rem;">${error.message || 'An unexpected error occurred'}</p>
                    <a href="#/dashboard" class="professional-btn professional-btn-primary">Go to Dashboard</a>
                </div>
            `;
        }
    }

    /**
     * Update active navigation states
     */
    updateActiveStates(currentPath) {
        // Remove all active classes
        document.querySelectorAll('.router-link-active').forEach(el => {
            el.classList.remove('router-link-active');
        });
        
        // Add active class to current route links
        document.querySelectorAll(`a[href="#${currentPath}"]`).forEach(el => {
            el.classList.add('router-link-active');
        });
        
        // Update navigation styles
        document.querySelectorAll('.professional-nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.substring(1) === currentPath) {
                link.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            } else {
                link.style.backgroundColor = '';
            }
        });
    }

    /**
     * Get current route
     */
    getCurrentRoute() {
        return this.currentRoute;
    }

    /**
     * Get previous route
     */
    getPreviousRoute() {
        return this.previousRoute;
    }

    /**
     * Check if a route exists
     */
    hasRoute(path) {
        return this.routes.has(path);
    }

    /**
     * Reload current route
     */
    reload() {
        this.handleRouteChange();
    }

    /**
     * Go back in history
     */
    back() {
        window.history.back();
    }

    /**
     * Go forward in history
     */
    forward() {
        window.history.forward();
    }
}

// Create and export router instance
window.SPARouter = new SPARouter();