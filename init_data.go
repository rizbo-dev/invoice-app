package main

import (
	"log"
	"invoice-app/database"
)

func main() {
	db, err := database.Initialize()
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	products := []struct {
		name  string
		price float64
	}{
		{"Laptop", 999.99},
		{"Wireless Mouse", 29.99},
		{"USB-C Hub", 49.99},
		{"Monitor 27\"", 299.99},
		{"Keyboard", 79.99},
		{"Webcam HD", 89.99},
		{"Desk Lamp", 39.99},
		{"Phone Stand", 19.99},
	}

	for _, p := range products {
		_, err := db.Exec("INSERT INTO products (name, price) VALUES (?, ?)", p.name, p.price)
		if err != nil {
			log.Printf("Error inserting product %s: %v", p.name, err)
		} else {
			log.Printf("Inserted product: %s - $%.2f", p.name, p.price)
		}
	}

	log.Println("Sample data initialized successfully")
}