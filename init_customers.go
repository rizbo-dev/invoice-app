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

	customers := []struct {
		name    string
		phone   string
		address string
		country string
	}{
		{"John Smith", "+1-555-0123", "123 Main St, Anytown", "United States"},
		{"Sarah Johnson", "+44-20-7946-0958", "456 Oak Ave, London", "United Kingdom"},
		{"Miguel Rodriguez", "+34-91-123-4567", "789 Plaza Mayor, Madrid", "Spain"},
		{"Emma Chen", "+86-10-1234-5678", "321 Beijing Road, Shanghai", "China"},
		{"Ahmed Hassan", "+971-4-123-4567", "654 Sheikh Zayed Road, Dubai", "United Arab Emirates"},
		{"Anna Kowalski", "+48-22-123-4567", "987 Marszałkowska Street, Warsaw", "Poland"},
		{"Carlos Silva", "+55-11-1234-5678", "147 Rua Augusta, São Paulo", "Brazil"},
		{"Yuki Tanaka", "+81-3-1234-5678", "258 Shibuya Crossing, Tokyo", "Japan"},
	}

	for _, c := range customers {
		_, err := db.Exec("INSERT INTO customers (name, phone, address, country) VALUES (?, ?, ?, ?)", 
			c.name, c.phone, c.address, c.country)
		if err != nil {
			log.Printf("Error inserting customer %s: %v", c.name, err)
		} else {
			log.Printf("Inserted customer: %s - %s", c.name, c.phone)
		}
	}

	log.Println("Sample customer data initialized successfully")
}