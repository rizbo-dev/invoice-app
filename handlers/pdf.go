package handlers

import (
	"bytes"
	"database/sql"
	"fmt"
	"html/template"
	"net/http"
	"strconv"
	"strings"
	"time"

	"invoice-app/models"
	"github.com/gorilla/mux"
	"github.com/jung-kurt/gofpdf"
)

type InvoicePDFData struct {
	ID          int
	TotalPrice  float64
	Status      string
	CreatedAt   string
	ProcessedAt string
	Items       []InvoiceItemPDF
	TotalItems  int
	GeneratedAt string
	Customer    *models.Customer
}

type InvoiceItemPDF struct {
	ProductName string
	Quantity    int
	UnitPrice   float64
	TotalPrice  float64
}

func (h *Handler) GenerateInvoicePDF(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid invoice ID", http.StatusBadRequest)
		return
	}

	// Fetch invoice data with customer information
	var invoice struct {
		ID          int
		CustomerID  *int
		TotalPrice  float64
		Status      string
		CreatedAt   time.Time
		ProcessedAt *time.Time
		Customer    *models.Customer
	}
	var customerName, customerPhone, customerAddress, customerCountry sql.NullString
	err = h.db.QueryRow(`
		SELECT i.id, i.customer_id, i.total_price, i.status, i.created_at, i.processed_at,
		       c.name, c.phone, c.address, c.country
		FROM invoices i 
		LEFT JOIN customers c ON i.customer_id = c.id 
		WHERE i.id = ?`, id).
		Scan(&invoice.ID, &invoice.CustomerID, &invoice.TotalPrice, &invoice.Status, &invoice.CreatedAt, &invoice.ProcessedAt,
			&customerName, &customerPhone, &customerAddress, &customerCountry)
	if err != nil {
		http.Error(w, "Invoice not found", http.StatusNotFound)
		return
	}

	// Add customer info if available
	if invoice.CustomerID != nil && customerName.Valid {
		invoice.Customer = &models.Customer{
			ID:      *invoice.CustomerID,
			Name:    customerName.String,
			Phone:   customerPhone.String,
			Address: customerAddress.String,
			Country: customerCountry.String,
		}
	}

	// Fetch invoice items
	rows, err := h.db.Query(`
		SELECT ii.quantity, ii.unit_price, ii.total_price, p.name
		FROM invoice_items ii
		JOIN products p ON ii.product_id = p.id
		WHERE ii.invoice_id = ?
		ORDER BY p.name
	`, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var items []InvoiceItemPDF
	totalItems := 0

	for rows.Next() {
		var item InvoiceItemPDF
		err := rows.Scan(&item.Quantity, &item.UnitPrice, &item.TotalPrice, &item.ProductName)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		items = append(items, item)
		totalItems += item.Quantity
	}

	// Prepare data for template
	pdfData := InvoicePDFData{
		ID:          invoice.ID,
		TotalPrice:  invoice.TotalPrice,
		Status:      invoice.Status,
		CreatedAt:   invoice.CreatedAt.Format("January 2, 2006 3:04 PM"),
		Items:       items,
		TotalItems:  totalItems,
		GeneratedAt: time.Now().Format("January 2, 2006 at 3:04 PM"),
		Customer:    invoice.Customer,
	}
	
	if invoice.ProcessedAt != nil {
		pdfData.ProcessedAt = invoice.ProcessedAt.Format("January 2, 2006 3:04 PM")
	}

	// Generate HTML from template
	htmlContent, err := h.generateInvoiceHTML(pdfData)
	if err != nil {
		http.Error(w, "Failed to generate invoice HTML", http.StatusInternalServerError)
		return
	}

	// Convert HTML to PDF using a simple approach
	pdf := h.htmlToPDF(htmlContent, pdfData)

	// Set response headers
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=invoice_%06d.pdf", pdfData.ID))
	
	// Output PDF
	err = pdf.Output(w)
	if err != nil {
		http.Error(w, "Failed to generate PDF", http.StatusInternalServerError)
		return
	}
}

func (h *Handler) generateInvoiceHTML(data InvoicePDFData) (string, error) {
	// Define template functions
	funcMap := template.FuncMap{
		"toUpper": strings.ToUpper,
	}

	// Read the template file
	tmplContent := `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #2c3e50; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
        .info-box { background: #f8f9fa; padding: 15px; border-radius: 5px; }
        .info-label { color: #666; font-size: 12px; text-transform: uppercase; }
        .info-value { font-size: 16px; font-weight: bold; color: #2c3e50; }
        .status-created { color: #3b82f6; }
        .status-processed { color: #22c55e; }
        .status-deleted { color: #ef4444; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #2c3e50; color: white; padding: 10px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background: #f8f9fa; }
        .total-section { text-align: right; margin-top: 30px; }
        .total-box { display: inline-block; background: #2c3e50; color: white; padding: 15px 30px; border-radius: 5px; }
        .footer { margin-top: 50px; text-align: center; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>INVOICE</h1>
    </div>
    
    {{if .Customer}}
    <div style="margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
        <h2 style="color: #2c3e50; margin-bottom: 15px;">BILL TO:</h2>
        <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">{{.Customer.Name}}</div>
        <div style="margin-bottom: 4px;">Phone: {{.Customer.Phone}}</div>
        <div style="margin-bottom: 4px;">Address: {{.Customer.Address}}</div>
        <div>Country: {{.Customer.Country}}</div>
    </div>
    {{end}}
    
    <div class="info-grid">
        <div class="info-box">
            <div class="info-label">Invoice Number</div>
            <div class="info-value">#{{printf "%06d" .ID}}</div>
        </div>
        <div class="info-box">
            <div class="info-label">Status</div>
            <div class="info-value status-{{.Status}}">{{.Status | toUpper}}</div>
        </div>
        <div class="info-box">
            <div class="info-label">Created Date</div>
            <div class="info-value">{{.CreatedAt}}</div>
        </div>
        {{if .ProcessedAt}}
        <div class="info-box">
            <div class="info-label">Processed Date</div>
            <div class="info-value">{{.ProcessedAt}}</div>
        </div>
        {{end}}
    </div>
    
    <h2>Invoice Items</h2>
    <table>
        <thead>
            <tr>
                <th>Product</th>
                <th style="text-align: center;">Quantity</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
            </tr>
        </thead>
        <tbody>
            {{range .Items}}
            <tr>
                <td>{{.ProductName}}</td>
                <td style="text-align: center;">{{.Quantity}}</td>
                <td style="text-align: right;">${{printf "%.2f" .UnitPrice}}</td>
                <td style="text-align: right;">${{printf "%.2f" .TotalPrice}}</td>
            </tr>
            {{end}}
        </tbody>
    </table>
    
    <p>Total Items: <strong>{{.TotalItems}}</strong></p>
    
    <div class="total-section">
        <div class="total-box">
            <div>Invoice Total</div>
            <div style="font-size: 24px;">${{printf "%.2f" .TotalPrice}}</div>
        </div>
    </div>
    
    <div class="footer">
        <p>PDF generated on {{.GeneratedAt}}</p>
        <p style="font-size: 16px; color: #2c3e50;">Thank you for your business!</p>
    </div>
</body>
</html>`

	tmpl, err := template.New("invoice").Funcs(funcMap).Parse(tmplContent)
	if err != nil {
		return "", err
	}
	
	var buf bytes.Buffer
	err = tmpl.Execute(&buf, data)
	if err != nil {
		return "", err
	}
	
	return buf.String(), nil
}

// Simple HTML to PDF conversion using gofpdf
func (h *Handler) htmlToPDF(htmlContent string, data InvoicePDFData) *gofpdf.Fpdf {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()
	
	// Since gofpdf doesn't directly support HTML, we'll create a structured PDF
	// that matches the HTML template layout
	
	// Header
	pdf.SetFont("Arial", "B", 24)
	pdf.Cell(190, 12, "INVOICE")
	pdf.Ln(20)
	
	// Customer Information Section
	if data.Customer != nil {
		pdf.SetFont("Arial", "B", 14)
		pdf.SetTextColor(44, 62, 80)
		pdf.Cell(190, 8, "BILL TO:")
		pdf.Ln(10)
		
		pdf.SetFont("Arial", "B", 12)
		pdf.SetTextColor(0, 0, 0)
		pdf.Cell(190, 6, data.Customer.Name)
		pdf.Ln(6)
		
		pdf.SetFont("Arial", "", 10)
		pdf.SetTextColor(70, 70, 70)
		pdf.Cell(190, 5, fmt.Sprintf("Phone: %s", data.Customer.Phone))
		pdf.Ln(5)
		pdf.Cell(190, 5, fmt.Sprintf("Address: %s", data.Customer.Address))
		pdf.Ln(5)
		pdf.Cell(190, 5, fmt.Sprintf("Country: %s", data.Customer.Country))
		pdf.Ln(15)
	}
	
	// Invoice Info Grid
	pdf.SetFont("Arial", "", 9)
	pdf.SetTextColor(102, 102, 102)
	pdf.Cell(47.5, 5, "INVOICE NUMBER")
	pdf.Cell(47.5, 5, "STATUS")
	pdf.Cell(47.5, 5, "CREATED DATE")
	if data.ProcessedAt != "" {
		pdf.Cell(47.5, 5, "PROCESSED DATE")
	}
	pdf.Ln(5)
	
	pdf.SetFont("Arial", "B", 12)
	pdf.SetTextColor(44, 62, 80)
	pdf.Cell(47.5, 8, fmt.Sprintf("#%06d", data.ID))
	
	// Status color
	switch data.Status {
	case "created":
		pdf.SetTextColor(59, 130, 246)
	case "processed":
		pdf.SetTextColor(34, 197, 94)
	case "deleted":
		pdf.SetTextColor(239, 68, 68)
	}
	pdf.Cell(47.5, 8, strings.ToUpper(data.Status))
	
	pdf.SetTextColor(44, 62, 80)
	pdf.Cell(47.5, 8, data.CreatedAt)
	if data.ProcessedAt != "" {
		pdf.Cell(47.5, 8, data.ProcessedAt)
	}
	pdf.Ln(15)
	
	// Invoice Items
	pdf.SetFont("Arial", "B", 14)
	pdf.Cell(190, 8, "Invoice Items")
	pdf.Ln(10)
	
	// Table Header
	pdf.SetFont("Arial", "B", 10)
	pdf.SetFillColor(44, 62, 80)
	pdf.SetTextColor(255, 255, 255)
	pdf.CellFormat(90, 8, "Product", "1", 0, "L", true, 0, "")
	pdf.CellFormat(30, 8, "Quantity", "1", 0, "C", true, 0, "")
	pdf.CellFormat(35, 8, "Unit Price", "1", 0, "R", true, 0, "")
	pdf.CellFormat(35, 8, "Total", "1", 0, "R", true, 0, "")
	pdf.Ln(8)
	
	// Table Rows
	pdf.SetTextColor(0, 0, 0)
	pdf.SetFont("Arial", "", 10)
	for i, item := range data.Items {
		if i%2 == 0 {
			pdf.SetFillColor(248, 249, 250)
		} else {
			pdf.SetFillColor(255, 255, 255)
		}
		pdf.CellFormat(90, 8, item.ProductName, "LR", 0, "L", true, 0, "")
		pdf.CellFormat(30, 8, fmt.Sprintf("%d", item.Quantity), "LR", 0, "C", true, 0, "")
		pdf.CellFormat(35, 8, fmt.Sprintf("$%.2f", item.UnitPrice), "LR", 0, "R", true, 0, "")
		pdf.CellFormat(35, 8, fmt.Sprintf("$%.2f", item.TotalPrice), "LR", 0, "R", true, 0, "")
		pdf.Ln(8)
	}
	pdf.Cell(190, 0, "")
	
	// Total Items
	pdf.Ln(10)
	pdf.SetFont("Arial", "", 11)
	pdf.Cell(190, 6, fmt.Sprintf("Total Items: %d", data.TotalItems))
	
	// Total Box
	pdf.Ln(15)
	pdf.SetX(130)
	pdf.SetFillColor(44, 62, 80)
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Arial", "", 12)
	pdf.CellFormat(60, 8, "Invoice Total", "1", 0, "C", true, 0, "")
	pdf.Ln(8)
	pdf.SetX(130)
	pdf.SetFont("Arial", "B", 18)
	pdf.CellFormat(60, 10, fmt.Sprintf("$%.2f", data.TotalPrice), "1", 0, "C", true, 0, "")
	
	// Footer
	pdf.SetY(-40)
	pdf.SetTextColor(102, 102, 102)
	pdf.SetFont("Arial", "I", 9)
	pdf.Cell(190, 5, fmt.Sprintf("PDF generated on %s", data.GeneratedAt))
	pdf.Ln(5)
	pdf.SetFont("Arial", "", 12)
	pdf.SetTextColor(44, 62, 80)
	pdf.Cell(190, 5, "Thank you for your business!")
	
	return pdf
}