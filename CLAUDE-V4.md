# Add Customer CRUD Operations and Invoice Integration

Add comprehensive customer management functionality and integrate customers with invoice creation and PDF generation.

## Customer Data Structure

### Customer Fields

- **Name**: Customer full name (required)
- **Phone Number**: Customer contact number (required)
- **Address**: Customer address (required)
- **Country**: Customer country (required)

## Requirements

### Backend Customer CRUD

- Create API endpoints for full customer CRUD operations
- Customer listing with optional search functionality
- Create, read, update, and delete customer records
- Validate all required customer fields
- Handle customer deletion properly (consider invoice references)

### Database Integration

- Create customers table with appropriate schema
- Modify invoices table to include customer relationship
- Ensure referential integrity between customers and invoices
- Handle customer deletion when customer has existing invoices

### Frontend Customer Management

- Create customer management interface (page or modal-based)
- Customer list view with search capabilities
- Add/Edit customer forms with all required fields
- Delete customer functionality with appropriate warnings
- Seamless navigation between customer management and main application

### Invoice Creation Integration

- Modify invoice creation process to require customer selection
- Add customer dropdown/selector to invoice creation form
- Show customer information during invoice creation
- Validate that customer is selected before allowing invoice creation
- Update existing invoice views to display customer information

### Customer Information in PDF

Enhance the existing PDF invoice generation to include customer details:

**Customer Section in PDF:**

- Customer name prominently displayed
- Complete customer address
- Customer phone number
- Customer country
- Position customer information appropriately in invoice layout (typically below company info, above invoice details)

### Search and Filter Enhancements

- Add customer-based filtering to invoice search
- Allow searching invoices by customer name
- Include customer information in invoice list views
- Enable customer selection in invoice filters

### Data Validation Requirements

- All customer fields must be validated (non-empty, appropriate formats)
- Phone number format validation
- Prevent deletion of customers who have active invoices
- Handle customer updates and their impact on existing invoices

### UI/UX Requirements

- Integrate customer management seamlessly with existing interface
- Provide clear navigation between customers and invoices
- Show customer information clearly in invoice views
- Maintain consistent styling with existing application
- Provide user-friendly error messages and validation feedback

## Success Criteria

- Complete CRUD operations for customers working smoothly
- Invoice creation requires and properly handles customer selection
- Customer information appears correctly in PDF invoices
- Customer data is properly integrated throughout the application
- Existing invoice functionality remains unaffected
- Professional presentation of customer information in all views
- Proper data validation and error handling throughout

Let Claude Code determine the best approach for database schema, API design, UI implementation, and PDF integration while meeting all specified requirements.
