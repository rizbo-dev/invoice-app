package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"invoice-app/models"
	"github.com/gorilla/mux"
)

func (h *Handler) GetCustomers(w http.ResponseWriter, r *http.Request) {
	query := "SELECT id, name, phone, address, country, created_at FROM customers"
	var args []interface{}
	
	if search := r.URL.Query().Get("search"); search != "" {
		query += " WHERE name LIKE ? OR phone LIKE ?"
		args = append(args, "%"+search+"%", "%"+search+"%")
	}
	
	query += " ORDER BY created_at DESC"
	
	rows, err := h.db.Query(query, args...)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var customers []models.Customer
	for rows.Next() {
		var c models.Customer
		if err := rows.Scan(&c.ID, &c.Name, &c.Phone, &c.Address, &c.Country, &c.CreatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		customers = append(customers, c)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(customers)
}

func (h *Handler) GetCustomer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid customer ID", http.StatusBadRequest)
		return
	}

	var c models.Customer
	err = h.db.QueryRow("SELECT id, name, phone, address, country, created_at FROM customers WHERE id = ?", id).
		Scan(&c.ID, &c.Name, &c.Phone, &c.Address, &c.Country, &c.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Customer not found", http.StatusNotFound)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(c)
}

func (h *Handler) CreateCustomer(w http.ResponseWriter, r *http.Request) {
	var c models.Customer
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Validate required fields
	if strings.TrimSpace(c.Name) == "" {
		http.Error(w, "Customer name is required", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(c.Phone) == "" {
		http.Error(w, "Customer phone is required", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(c.Address) == "" {
		http.Error(w, "Customer address is required", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(c.Country) == "" {
		http.Error(w, "Customer country is required", http.StatusBadRequest)
		return
	}

	// Basic phone validation (simple check for reasonable length)
	if len(strings.TrimSpace(c.Phone)) < 7 {
		http.Error(w, "Phone number must be at least 7 characters", http.StatusBadRequest)
		return
	}

	// Trim whitespace
	c.Name = strings.TrimSpace(c.Name)
	c.Phone = strings.TrimSpace(c.Phone)
	c.Address = strings.TrimSpace(c.Address)
	c.Country = strings.TrimSpace(c.Country)

	result, err := h.db.Exec("INSERT INTO customers (name, phone, address, country) VALUES (?, ?, ?, ?)", 
		c.Name, c.Phone, c.Address, c.Country)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()
	c.ID = int(id)
	c.CreatedAt = time.Now()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(c)
}

func (h *Handler) UpdateCustomer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid customer ID", http.StatusBadRequest)
		return
	}

	var c models.Customer
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Validate required fields
	if strings.TrimSpace(c.Name) == "" {
		http.Error(w, "Customer name is required", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(c.Phone) == "" {
		http.Error(w, "Customer phone is required", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(c.Address) == "" {
		http.Error(w, "Customer address is required", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(c.Country) == "" {
		http.Error(w, "Customer country is required", http.StatusBadRequest)
		return
	}

	// Basic phone validation
	if len(strings.TrimSpace(c.Phone)) < 7 {
		http.Error(w, "Phone number must be at least 7 characters", http.StatusBadRequest)
		return
	}

	// Trim whitespace
	c.Name = strings.TrimSpace(c.Name)
	c.Phone = strings.TrimSpace(c.Phone)
	c.Address = strings.TrimSpace(c.Address)
	c.Country = strings.TrimSpace(c.Country)

	result, err := h.db.Exec("UPDATE customers SET name = ?, phone = ?, address = ?, country = ? WHERE id = ?", 
		c.Name, c.Phone, c.Address, c.Country, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "Customer not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *Handler) DeleteCustomer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid customer ID", http.StatusBadRequest)
		return
	}

	// Check if customer has any invoices
	var count int
	err = h.db.QueryRow("SELECT COUNT(*) FROM invoices WHERE customer_id = ?", id).Scan(&count)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if count > 0 {
		http.Error(w, "Cannot delete customer that has invoices", http.StatusBadRequest)
		return
	}

	result, err := h.db.Exec("DELETE FROM customers WHERE id = ?", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "Customer not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
}