# Invoice Management Web App

Build a complete invoice management web application with the following specifications:

## Tech Stack

- **Backend**: Go (Golang) with Gorilla Mux or Gin for routing
- **Frontend**: Plain HTML + JavaScript (ES6+)
- **Styling**: Tailwind CSS (CDN)
- **Database**: SQLite with appropriate Go driver
- **Architecture**: REST API backend serving static frontend

## Database Schema

### Products Table

```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Invoices Table

```sql
CREATE TABLE invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total_price DECIMAL(10,2) NOT NULL,
    status TEXT CHECK(status IN ('created', 'processed', 'deleted')) DEFAULT 'created',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME NULL
);
```

### Invoice Items Table

```sql
CREATE TABLE invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

## Backend API Endpoints

### Products

- `GET /api/products` - List all products
- `POST /api/products` - Create new product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

### Invoices

- `GET /api/invoices` - List invoices with search filters
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/{id}` - Get invoice details with items
- `PUT /api/invoices/{id}/status` - Update invoice status (created → processed, any → deleted)

### Search Parameters for GET /api/invoices:

- `created_from` & `created_to` (date range)
- `processed_from` & `processed_to` (date range)
- `status` (comma-separated: created,processed,deleted)
- `price_from` & `price_to` (price range)
- `product_query` (search in product names within invoices)

## Frontend Features

### Main Dashboard

- Invoice list with search/filter form
- Create new invoice button
- Quick stats (total invoices by status)

### Invoice Creation Page

- Product selection dropdown (populated from API)
- Add multiple items with quantities
- Real-time price calculation on frontend
- Save as "created" status

### Invoice Management

- View invoice details
- Mark as processed (only from created status)
- Delete invoice (soft delete - status becomes "deleted")
- Edit items before processing

### Search & Filter Interface

- Date range pickers for created/processed dates
- Multi-select dropdown for status
- Price range inputs (from/to)
- Product name search input
- Clear filters button

## Implementation Requirements

### Backend (Go)

- Use proper HTTP status codes
- JSON responses for all API endpoints
- Input validation and error handling
- CORS headers for frontend communication
- Database connection pooling
- Prepared statements for SQL queries

### Frontend (HTML/JS)

- Responsive design with Tailwind CSS
- Modern JavaScript (async/await, fetch API)
- Client-side price calculations
- Form validation
- Loading states and error handling
- Clean, intuitive UI

### Key Business Logic

- Invoice total = sum of (quantity × unit_price) for all items
- Status transitions: created → processed → deleted (deleted can be from any status)
- Processed timestamp only set when status changes to "processed"
- Soft delete: don't remove from DB, just set status to "deleted"

## File Structure

```
invoice-app/
├── main.go
├── handlers/
├── models/
├── database/
├── static/
│   ├── index.html
│   ├── js/
│   └── css/
└── go.mod
```

## Getting Started

1. Initialize Go module
2. Set up SQLite database with schema
3. Create REST API handlers
4. Build frontend interface
5. Test all functionality

Focus on clean, maintainable code with proper separation of concerns. The app should be fully functional for invoice management within the 2.5 hour timeframe.
