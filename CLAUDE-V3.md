# Add Print Invoice PDF Functionality

Add PDF generation and printing capability to the existing invoice management app.

## Requirements

### Backend PDF Generation

- Create API endpoint to generate PDF for a specific invoice
- Endpoint should return a downloadable PDF file
- PDF should be generated on the backend using appropriate Go PDF library
- Set proper HTTP headers for PDF download

### PDF Content Requirements

The generated PDF should include:

**Header Section:**

- Invoice title
- Invoice number and dates
- Current invoice status

**Invoice Details:**

- Complete list of all invoice items
- Product names, quantities, unit prices, and totals
- Proper table formatting for readability

**Summary Section:**

- Subtotal calculations
- Grand total (prominently displayed)
- Total number of items
- Invoice status information

**Footer:**

- PDF generation timestamp
- Professional closing message

### Frontend Integration

- Add "Print Invoice" button to the invoice details/view page
- Button should trigger PDF generation and automatic download
- Show loading state during PDF generation
- Handle errors gracefully with user feedback
- Integrate seamlessly with existing UI styling

### Technical Requirements

- PDF should be professionally formatted and business-ready
- Use appropriate fonts, spacing, and layout
- Handle invoices with varying numbers of items
- Include proper error handling for invalid invoice IDs
- Ensure PDF works for all invoice statuses (created, processed, deleted)

### Data Requirements

- Fetch complete invoice data including all items and product information
- Calculate totals and summaries accurately
- Include all relevant timestamps and status information
- Join product data to show product names in invoice items

## Success Criteria

- Users can click a button and download a professional PDF of any invoice
- PDF contains all invoice information in a clean, readable format
- Integration works smoothly with existing invoice management interface
- Proper error handling for edge cases
- Professional appearance suitable for business use

Let Claude Code decide the best approach for PDF library selection, template design, and implementation details.
