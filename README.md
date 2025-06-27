# Invoice Management Web App

A complete invoice management system built with Go backend and vanilla JavaScript frontend.

## Features

- Product management (CRUD operations)
- Invoice creation with multiple items
- Invoice status management (created → processed → deleted)
- Advanced search and filtering
- Real-time price calculations
- Responsive UI with Tailwind CSS

## Tech Stack

- **Backend**: Go with Gorilla Mux
- **Frontend**: HTML + JavaScript (ES6+)
- **Styling**: Tailwind CSS (CDN)
- **Database**: SQLite

## Getting Started

1. Install dependencies:
```bash
go get github.com/gorilla/mux github.com/mattn/go-sqlite3 github.com/rs/cors
```

2. Initialize sample data (optional):
```bash
go run init_data.go
```

3. Start the server:
```bash
go run main.go
```

4. Open your browser and navigate to:
```
http://localhost:9080
```

## API Endpoints

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create new product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

### Invoices
- `GET /api/invoices` - List invoices with filters
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/{id}` - Get invoice details
- `PUT /api/invoices/{id}/status` - Update invoice status

## Usage

1. **Creating an Invoice**: Click "Create New Invoice", select products and quantities, then save.
2. **Viewing Invoices**: Click "View" on any invoice to see details.
3. **Processing Invoices**: From the view modal, click "Mark as Processed".
4. **Filtering**: Use the search form to filter by date ranges, status, price, or product names.