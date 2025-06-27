package models

import (
	"time"
)

type Customer struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Phone     string    `json:"phone"`
	Address   string    `json:"address"`
	Country   string    `json:"country"`
	CreatedAt time.Time `json:"created_at"`
}

type Product struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Price     float64   `json:"price"`
	CreatedAt time.Time `json:"created_at"`
}

type Invoice struct {
	ID          int              `json:"id"`
	CustomerID  *int             `json:"customer_id,omitempty"`
	Customer    *Customer        `json:"customer,omitempty"`
	TotalPrice  float64          `json:"total_price"`
	Status      string           `json:"status"`
	CreatedAt   time.Time        `json:"created_at"`
	ProcessedAt *time.Time       `json:"processed_at,omitempty"`
	Items       []InvoiceItem    `json:"items,omitempty"`
}

type InvoiceItem struct {
	ID         int     `json:"id"`
	InvoiceID  int     `json:"invoice_id"`
	ProductID  int     `json:"product_id"`
	Quantity   int     `json:"quantity"`
	UnitPrice  float64 `json:"unit_price"`
	TotalPrice float64 `json:"total_price"`
	Product    *Product `json:"product,omitempty"`
}

type CreateInvoiceRequest struct {
	CustomerID int                 `json:"customer_id"`
	Items      []CreateInvoiceItem `json:"items"`
}

type CreateInvoiceItem struct {
	ProductID int `json:"product_id"`
	Quantity  int `json:"quantity"`
}

type UpdateStatusRequest struct {
	Status string `json:"status"`
}