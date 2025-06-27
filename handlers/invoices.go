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
	query := `SELECT id, total_price, status, created_at, processed_at FROM invoices WHERE 1=1`
	var args []interface{}

	if createdFrom := r.URL.Query().Get("created_from"); createdFrom != "" {
		query += " AND created_at >= ?"
		args = append(args, createdFrom)
	}
	if createdTo := r.URL.Query().Get("created_to"); createdTo != "" {
		query += " AND created_at <= ?"
		args = append(args, createdTo)
	}
	if processedFrom := r.URL.Query().Get("processed_from"); processedFrom != "" {
		query += " AND processed_at >= ?"
		args = append(args, processedFrom)
	}
	if processedTo := r.URL.Query().Get("processed_to"); processedTo != "" {
		query += " AND processed_at <= ?"
		args = append(args, processedTo)
	}
	if status := r.URL.Query().Get("status"); status != "" {
		statuses := strings.Split(status, ",")
		placeholders := make([]string, len(statuses))
		for i, s := range statuses {
			placeholders[i] = "?"
			args = append(args, s)
		}
		query += fmt.Sprintf(" AND status IN (%s)", strings.Join(placeholders, ","))
	}
	if priceFrom := r.URL.Query().Get("price_from"); priceFrom != "" {
		query += " AND total_price >= ?"
		args = append(args, priceFrom)
	}
	if priceTo := r.URL.Query().Get("price_to"); priceTo != "" {
		query += " AND total_price <= ?"
		args = append(args, priceTo)
	}
	if productQuery := r.URL.Query().Get("product_query"); productQuery != "" {
		query += ` AND id IN (
			SELECT DISTINCT i.id FROM invoices i
			JOIN invoice_items ii ON i.id = ii.invoice_id
			JOIN products p ON ii.product_id = p.id
			WHERE p.name LIKE ?
		)`
		args = append(args, "%"+productQuery+"%")
	}

	query += " ORDER BY created_at DESC"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var invoices []models.Invoice
	for rows.Next() {
		var inv models.Invoice
		if err := rows.Scan(&inv.ID, &inv.TotalPrice, &inv.Status, &inv.CreatedAt, &inv.ProcessedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
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

	result, err := tx.Exec("INSERT INTO invoices (total_price, status) VALUES (?, 'created')", totalPrice)
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
	err = h.db.QueryRow("SELECT id, total_price, status, created_at, processed_at FROM invoices WHERE id = ?", id).
		Scan(&inv.ID, &inv.TotalPrice, &inv.Status, &inv.CreatedAt, &inv.ProcessedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Invoice not found", http.StatusNotFound)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
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