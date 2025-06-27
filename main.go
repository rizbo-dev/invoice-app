package main

import (
	"log"
	"net/http"

	"invoice-app/database"
	"invoice-app/handlers"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

func main() {
	db, err := database.Initialize()
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	h := handlers.New(db)
	r := mux.NewRouter()

	r.HandleFunc("/api/customers", h.GetCustomers).Methods("GET")
	r.HandleFunc("/api/customers", h.CreateCustomer).Methods("POST")
	r.HandleFunc("/api/customers/{id}", h.GetCustomer).Methods("GET")
	r.HandleFunc("/api/customers/{id}", h.UpdateCustomer).Methods("PUT")
	r.HandleFunc("/api/customers/{id}", h.DeleteCustomer).Methods("DELETE")

	r.HandleFunc("/api/products", h.GetProducts).Methods("GET")
	r.HandleFunc("/api/products", h.CreateProduct).Methods("POST")
	r.HandleFunc("/api/products/{id}", h.GetProduct).Methods("GET")
	r.HandleFunc("/api/products/{id}", h.UpdateProduct).Methods("PUT")
	r.HandleFunc("/api/products/{id}", h.DeleteProduct).Methods("DELETE")

	r.HandleFunc("/api/invoices", h.GetInvoices).Methods("GET")
	r.HandleFunc("/api/invoices", h.CreateInvoice).Methods("POST")
	r.HandleFunc("/api/invoices/{id}", h.GetInvoice).Methods("GET")
	r.HandleFunc("/api/invoices/{id}/status", h.UpdateInvoiceStatus).Methods("PUT")
	r.HandleFunc("/api/invoices/{id}/pdf", h.GenerateInvoicePDF).Methods("GET")

	r.PathPrefix("/").Handler(http.FileServer(http.Dir("./static/")))

	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE"},
		AllowedHeaders: []string{"Content-Type"},
	})

	handler := c.Handler(r)

	log.Println("Server starting on :9080")
	if err := http.ListenAndServe(":9080", handler); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}