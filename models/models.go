package models

import (
	"time"
)

type Product struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Price     float64   `json:"price"`
	CreatedAt time.Time `json:"created_at"`
}

type Invoice struct {
	ID          int              `json:"id"`
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
	Items []CreateInvoiceItem `json:"items"`
}

type CreateInvoiceItem struct {
	ProductID int `json:"product_id"`
	Quantity  int `json:"quantity"`
}

type UpdateStatusRequest struct {
	Status string `json:"status"`
}