# Add Product CRUD Operations to Invoice App

Extend the existing invoice management app with comprehensive product management functionality.

## New Backend API Endpoints

Add these endpoints to your existing Go backend:

### Products CRUD

- `GET /api/products?search={query}` - List all products with optional name search
- `POST /api/products` - Create new product
- `GET /api/products/{id}` - Get single product by ID
- `PUT /api/products/{id}` - Update existing product
- `DELETE /api/products/{id}` - Delete product (with validation)

### Request/Response Models

```json
// POST/PUT Product
{
    "name": "Product Name",
    "price": 29.99
}

// GET Product Response
{
    "id": 1,
    "name": "Product Name",
    "price": 29.99,
    "created_at": "2025-06-27T10:00:00Z"
}
```

## New Frontend Components

### 1. Products Management Page (`products.html`)

- **URL**: `/products.html`
- **Layout**: Clean table displaying all products
- **Columns**: ID, Name, Price, Created Date, Actions
- **Search**: Real-time search by product name
- **Actions**: Edit button, Delete button for each row
- **Navigation**: "Back to Dashboard" button
- **Add Product**: Prominent "Add New Product" button

### 2. Product Modal Component

- **Purpose**: Handle both Create and Edit operations
- **Fields**:
  - Product Name (required, text input)
  - Product Price (required, number input with 2 decimal validation)
- **Buttons**: Save, Cancel
- **Validation**:
  - Name cannot be empty
  - Price must be positive number with max 2 decimals
- **States**: Loading state during save operation

### 3. Dashboard Updates

- Add "Manage Products" navigation button
- Update stats to include total products count
- Ensure existing invoice functionality remains unchanged

## Implementation Requirements

### Backend Validation

- Product name: required, min 1 character
- Product price: required, positive decimal, max 2 decimal places
- Delete validation: prevent deletion if product is used in non-deleted invoices
- Return appropriate HTTP status codes and error messages

### Frontend Functionality

- **Modal Management**: Show/hide modal for create/edit
- **CRUD Operations**:
  - Create: Open modal, POST to API, refresh list
  - Read: Load products list, implement search
  - Update: Pre-populate modal with existing data, PUT to API
  - Delete: Confirmation dialog, DELETE request
- **Error Handling**: Display API errors in user-friendly format
- **Loading States**: Show spinners during API calls

### JavaScript Structure

Create `static/js/products.js` with:

```javascript
// Modal management functions
function openProductModal(mode, productData = null)
function closeProductModal()

// CRUD operations
async function loadProducts(searchQuery = '')
async function saveProduct(formData)
async function deleteProduct(productId)

// Event handlers
function handleSearch()
function handleFormSubmit()
```

### Styling Requirements

- Use existing Tailwind CSS classes
- Modal: centered overlay with backdrop
- Table: responsive design with hover effects
- Buttons: consistent styling with existing app
- Form validation: red borders for invalid fields

## Integration Points

### Navigation Flow

1. Dashboard → "Manage Products" button → Products page
2. Products page → "Back to Dashboard" button → Dashboard
3. Products page → "Add Product" → Modal → Save → Refresh list

### API Integration

- Use existing fetch patterns from invoice functionality
- Maintain consistent error handling approach
- Preserve existing CORS and request formatting

## Files to Create/Modify

### New Files:

- `static/products.html`
- `static/js/products.js`

### Modify:

- `static/index.html` (add navigation button)
- `static/js/dashboard.js` (add products count to stats)
- Go handlers (add product CRUD endpoints)

## Key Business Rules

- Cannot delete products referenced in non-deleted invoices
- Product prices must be positive with max 2 decimal places
- Product names must be unique (add validation)
- Hard delete for products (unlike soft delete for invoices)

## Success Criteria

- Full CRUD operations working for products
- Clean, intuitive UI matching existing app style
- Proper validation and error handling
- Seamless navigation between dashboard and products
- Existing invoice functionality remains unaffected

Focus on maintaining consistency with the existing codebase while adding robust product management capabilities.
