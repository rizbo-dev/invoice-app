package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"invoice-app/models"
	"github.com/gorilla/mux"
)

func (h *Handler) GetInvoices(w http.ResponseWriter, r *http.Request) {
	query := `SELECT i.id, i.customer_id, i.total_price, i.status, i.created_at, i.processed_at, 
	                 c.name, c.phone, c.address, c.country
	          FROM invoices i 
	          LEFT JOIN customers c ON i.customer_id = c.id 
	          WHERE 1=1`
	var args []interface{}

	if createdFrom := r.URL.Query().Get("created_from"); createdFrom != "" {
		query += " AND i.created_at >= ?"
		args = append(args, createdFrom)
	}
	if createdTo := r.URL.Query().Get("created_to"); createdTo != "" {
		query += " AND i.created_at <= ?"
		args = append(args, createdTo)
	}
	if processedFrom := r.URL.Query().Get("processed_from"); processedFrom != "" {
		query += " AND i.processed_at >= ?"
		args = append(args, processedFrom)
	}
	if processedTo := r.URL.Query().Get("processed_to"); processedTo != "" {
		query += " AND i.processed_at <= ?"
		args = append(args, processedTo)
	}
	if status := r.URL.Query().Get("status"); status != "" {
		statuses := strings.Split(status, ",")
		placeholders := make([]string, len(statuses))
		for i, s := range statuses {
			placeholders[i] = "?"
			args = append(args, s)
		}
		query += fmt.Sprintf(" AND i.status IN (%s)", strings.Join(placeholders, ","))
	}
	if priceFrom := r.URL.Query().Get("price_from"); priceFrom != "" {
		query += " AND i.total_price >= ?"
		args = append(args, priceFrom)
	}
	if priceTo := r.URL.Query().Get("price_to"); priceTo != "" {
		query += " AND i.total_price <= ?"
		args = append(args, priceTo)
	}
	if customerQuery := r.URL.Query().Get("customer_query"); customerQuery != "" {
		query += " AND c.name LIKE ?"
		args = append(args, "%"+customerQuery+"%")
	}
	if productQuery := r.URL.Query().Get("product_query"); productQuery != "" {
		query += ` AND i.id IN (
			SELECT DISTINCT ii.invoice_id FROM invoice_items ii
			JOIN products p ON ii.product_id = p.id
			WHERE p.name LIKE ?
		)`
		args = append(args, "%"+productQuery+"%")
	}

	query += " ORDER BY i.created_at DESC"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var invoices []models.Invoice
	for rows.Next() {
		var inv models.Invoice
		var customerName, customerPhone, customerAddress, customerCountry sql.NullString
		if err := rows.Scan(&inv.ID, &inv.CustomerID, &inv.TotalPrice, &inv.Status, &inv.CreatedAt, &inv.ProcessedAt, 
			&customerName, &customerPhone, &customerAddress, &customerCountry); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		
		// Add customer info if available
		if inv.CustomerID != nil && customerName.Valid {
			inv.Customer = &models.Customer{
				ID:      *inv.CustomerID,
				Name:    customerName.String,
				Phone:   customerPhone.String,
				Address: customerAddress.String,
				Country: customerCountry.String,
			}
		}
		
		invoices = append(invoices, inv)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(invoices)
}

func (h *Handler) CreateInvoice(w http.ResponseWriter, r *http.Request) {
	var req models.CreateInvoiceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Validate customer ID
	if req.CustomerID == 0 {
		http.Error(w, "Customer ID is required", http.StatusBadRequest)
		return
	}

	// Verify customer exists
	var customerExists int
	err := h.db.QueryRow("SELECT COUNT(*) FROM customers WHERE id = ?", req.CustomerID).Scan(&customerExists)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if customerExists == 0 {
		http.Error(w, "Customer not found", http.StatusBadRequest)
		return
	}

	tx, err := h.db.Begin()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	totalPrice := 0.0
	var items []models.InvoiceItem

	for _, item := range req.Items {
		var product models.Product
		err := tx.QueryRow("SELECT id, name, price FROM products WHERE id = ?", item.ProductID).
			Scan(&product.ID, &product.Name, &product.Price)
		if err != nil {
			tx.Rollback()
			http.Error(w, "Product not found", http.StatusBadRequest)
			return
		}

		itemTotal := product.Price * float64(item.Quantity)
		totalPrice += itemTotal

		items = append(items, models.InvoiceItem{
			ProductID:  item.ProductID,
			Quantity:   item.Quantity,
			UnitPrice:  product.Price,
			TotalPrice: itemTotal,
		})
	}

	result, err := tx.Exec("INSERT INTO invoices (customer_id, total_price, status) VALUES (?, ?, 'created')", req.CustomerID, totalPrice)
	if err != nil {
		tx.Rollback()
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	invoiceID, _ := result.LastInsertId()

	for _, item := range items {
		_, err = tx.Exec(
			"INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)",
			invoiceID, item.ProductID, item.Quantity, item.UnitPrice, item.TotalPrice,
		)
		if err != nil {
			tx.Rollback()
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	invoice := models.Invoice{
		ID:         int(invoiceID),
		TotalPrice: totalPrice,
		Status:     "created",
		CreatedAt:  time.Now(),
		Items:      items,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(invoice)
}

func (h *Handler) GetInvoice(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid invoice ID", http.StatusBadRequest)
		return
	}

	var inv models.Invoice
	var customerName, customerPhone, customerAddress, customerCountry sql.NullString
	err = h.db.QueryRow(`
		SELECT i.id, i.customer_id, i.total_price, i.status, i.created_at, i.processed_at,
		       c.name, c.phone, c.address, c.country
		FROM invoices i 
		LEFT JOIN customers c ON i.customer_id = c.id 
		WHERE i.id = ?`, id).
		Scan(&inv.ID, &inv.CustomerID, &inv.TotalPrice, &inv.Status, &inv.CreatedAt, &inv.ProcessedAt,
			&customerName, &customerPhone, &customerAddress, &customerCountry)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Invoice not found", http.StatusNotFound)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	// Add customer info if available
	if inv.CustomerID != nil && customerName.Valid {
		inv.Customer = &models.Customer{
			ID:      *inv.CustomerID,
			Name:    customerName.String,
			Phone:   customerPhone.String,
			Address: customerAddress.String,
			Country: customerCountry.String,
		}
	}

	rows, err := h.db.Query(`
		SELECT ii.id, ii.invoice_id, ii.product_id, ii.quantity, ii.unit_price, ii.total_price,
		       p.id, p.name, p.price
		FROM invoice_items ii
		JOIN products p ON ii.product_id = p.id
		WHERE ii.invoice_id = ?
	`, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var items []models.InvoiceItem
	for rows.Next() {
		var item models.InvoiceItem
		var product models.Product
		err := rows.Scan(&item.ID, &item.InvoiceID, &item.ProductID, &item.Quantity, &item.UnitPrice, &item.TotalPrice,
			&product.ID, &product.Name, &product.Price)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		item.Product = &product
		items = append(items, item)
	}

	inv.Items = items

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(inv)
}

func (h *Handler) UpdateInvoiceStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid invoice ID", http.StatusBadRequest)
		return
	}

	var req models.UpdateStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Status != "created" && req.Status != "processed" && req.Status != "deleted" {
		http.Error(w, "Invalid status", http.StatusBadRequest)
		return
	}

	var currentStatus string
	err = h.db.QueryRow("SELECT status FROM invoices WHERE id = ?", id).Scan(&currentStatus)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Invoice not found", http.StatusNotFound)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	if currentStatus == "processed" && req.Status == "created" {
		http.Error(w, "Cannot change status from processed to created", http.StatusBadRequest)
		return
	}

	query := "UPDATE invoices SET status = ?"
	args := []interface{}{req.Status}

	if req.Status == "processed" {
		query += ", processed_at = ?"
		args = append(args, time.Now())
	}

	query += " WHERE id = ?"
	args = append(args, id)

	_, err = h.db.Exec(query, args...)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}