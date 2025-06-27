# InvoicePro - Professional Invoice Management System

A modern, professional invoice management system built with Go backend and a sophisticated Single Page Application (SPA) frontend. Features a business-grade UI/UX with offline capabilities and Progressive Web App (PWA) support.

## 🚀 Features

### Core Functionality
- **Customer Management**: Complete CRUD operations with search and sorting
- **Product Catalog**: Inventory management with pricing and search capabilities  
- **Invoice Management**: Create, view, process, and delete invoices with multiple items
- **Advanced Search & Filtering**: Filter by date ranges, status, price, customer, and products
- **PDF Generation**: Professional invoice PDF export functionality
- **Real-time Calculations**: Dynamic price calculations and totals

### Modern UI/UX
- **Professional Design System**: Custom CSS with design tokens and consistent styling
- **Single Page Application (SPA)**: Seamless navigation with client-side routing
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Micro-interactions**: Smooth animations and loading states
- **Toast Notifications**: Professional feedback system
- **Loading States**: Enhanced user experience with proper loading indicators

### Progressive Web App (PWA)
- **Offline Support**: Service Worker for offline functionality
- **App Installation**: Installable on desktop and mobile devices
- **Cached Assets**: Fast loading with intelligent caching strategies
- **Background Sync**: Future-ready for offline operations

### Performance & Architecture
- **Client-side Routing**: Hash-based navigation with dynamic view loading
- **State Management**: Centralized application state with caching
- **API Integration**: RESTful backend integration with error handling
- **Component Architecture**: Modular view components for maintainability

## 🛠 Tech Stack

### Backend
- **Language**: Go (Golang)
- **Framework**: Gorilla Mux for HTTP routing
- **Database**: SQLite with migrations
- **API**: RESTful JSON API with CORS support
- **PDF Generation**: Custom PDF generation for invoices

### Frontend
- **Architecture**: Single Page Application (SPA)
- **JavaScript**: Modern ES6+ with modules
- **Styling**: Tailwind CSS + Custom Professional CSS System
- **Fonts**: Inter font family for professional typography
- **Icons**: Emoji-based icon system for cross-platform compatibility

### Infrastructure
- **PWA**: Service Worker, Web App Manifest
- **Offline**: Cache-first strategies with network fallbacks
- **Build**: No build step required - pure vanilla technologies
- **Deployment**: Static file serving with Go HTTP server

## 📁 Project Structure

```
invoice-claude-code/
├── 📁 database/           # Database schema and connections
├── 📁 handlers/           # HTTP request handlers
│   ├── customers.go       # Customer management endpoints
│   ├── invoices.go        # Invoice management endpoints
│   ├── pdf.go            # PDF generation endpoints
│   └── products.go       # Product management endpoints
├── 📁 models/            # Data models and structures
├── 📁 static/            # Frontend SPA application
│   ├── 📁 css/
│   │   └── modern-professional.css    # Professional design system
│   ├── 📁 js/
│   │   ├── spa-app.js                 # Main application controller
│   │   ├── spa-router.js              # Client-side router
│   │   ├── modern-interactions.js     # UI interactions & animations
│   │   └── 📁 views/                  # SPA view components
│   │       ├── dashboard-view.js      # Main dashboard
│   │       ├── customers-view.js      # Customer management
│   │       ├── products-view.js       # Product catalog
│   │       └── invoice-detail-view.js # Invoice details
│   ├── spa-index.html                 # SPA entry point
│   ├── manifest.json                  # PWA manifest
│   └── sw.js                         # Service Worker
├── main.go               # Application entry point
├── init_customers.go     # Customer data initialization
└── CLAUDE.md            # Development specifications
```

## 🚀 Getting Started

### Prerequisites
- Go 1.19 or higher
- Modern web browser with JavaScript enabled

### Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd invoice-claude-code
```

2. **Install Go dependencies**:
```bash
go get github.com/gorilla/mux
go get github.com/mattn/go-sqlite3
go get github.com/rs/cors
go get github.com/jung-kurt/gofpdf
```

3. **Initialize sample data** (optional):
```bash
go run init_customers.go
```

4. **Start the server**:
```bash
go run main.go
```

5. **Access the application**:
```
http://localhost:9080/spa-index.html
```

## 📚 API Reference

### Customers
- `GET /api/customers` - List all customers with optional search
- `POST /api/customers` - Create new customer
- `PUT /api/customers/{id}` - Update customer
- `DELETE /api/customers/{id}` - Delete customer

### Products
- `GET /api/products` - List all products with optional search
- `POST /api/products` - Create new product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

### Invoices
- `GET /api/invoices` - List invoices with advanced filtering
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/{id}` - Get invoice details with items
- `PUT /api/invoices/{id}/status` - Update invoice status
- `GET /api/invoices/{id}/pdf` - Generate and download PDF

### Search Parameters for GET /api/invoices:
- `created_from` & `created_to` - Date range filters
- `processed_from` & `processed_to` - Processing date filters  
- `status` - Comma-separated status values (created,processed,deleted)
- `price_from` & `price_to` - Price range filters
- `product_query` - Search in product names
- `customer_query` - Search in customer names

## 🎯 Usage Guide

### Dashboard
- **Overview Metrics**: View counts of customers, products, and invoices by status
- **Advanced Search**: Filter invoices by multiple criteria
- **Quick Actions**: Create new invoices directly from dashboard
- **Real-time Updates**: Data refreshes automatically

### Customer Management
- **Add Customers**: Complete contact information with validation
- **Search & Sort**: Find customers quickly by name, phone, or address
- **Edit & Delete**: Full CRUD operations with confirmation dialogs
- **Usage Tracking**: See which customers have associated invoices

### Product Catalog
- **Inventory Management**: Add products with pricing information
- **Search Functionality**: Find products by name or price range
- **Usage Protection**: Prevent deletion of products used in invoices
- **Bulk Operations**: Sort and filter large product catalogs

### Invoice Operations
- **Creation Wizard**: Select customer and add multiple product items
- **Status Workflow**: Progress from created → processed → deleted
- **PDF Export**: Generate professional invoices for printing/email
- **Detail Views**: Comprehensive invoice information with item breakdowns

## 🔧 Development

### Adding New Features
1. **Backend**: Add handlers in `/handlers/` and update routes in `main.go`
2. **Frontend**: Create new view components in `/static/js/views/`
3. **Styling**: Extend the design system in `modern-professional.css`
4. **Routing**: Register new routes in `spa-app.js`

### Database Schema
The application uses SQLite with the following main tables:
- `customers` - Customer information and contact details
- `products` - Product catalog with pricing
- `invoices` - Invoice headers with status and totals
- `invoice_items` - Line items linking invoices to products

### Architecture Decisions
- **No Build Step**: Pure vanilla technologies for simplicity
- **Component-based**: Modular view components for maintainability
- **Progressive Enhancement**: Works without JavaScript (basic functionality)
- **Mobile-first**: Responsive design from mobile up to desktop

## 🚀 Deployment

### Production Considerations
1. **HTTPS**: Required for PWA features and Service Worker
2. **Compression**: Enable gzip compression for static assets
3. **Caching**: Configure appropriate cache headers
4. **Database**: Consider PostgreSQL for production workloads
5. **Monitoring**: Add logging and error tracking

### Environment Variables
- `PORT` - Server port (default: 9080)
- `DB_PATH` - SQLite database path (default: ./invoices.db)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is built for demonstration and educational purposes.

---

**InvoicePro** - Professional invoice management for modern businesses 🚀