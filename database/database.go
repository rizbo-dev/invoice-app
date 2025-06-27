package database

import (
	"database/sql"
	_ "github.com/mattn/go-sqlite3"
)

func Initialize() (*sql.DB, error) {
	db, err := sql.Open("sqlite3", "./invoice.db")
	if err != nil {
		return nil, err
	}

	if err := createTables(db); err != nil {
		return nil, err
	}

	return db, nil
}

func createTables(db *sql.DB) error {
	schemas := []string{
		`CREATE TABLE IF NOT EXISTS products (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			price DECIMAL(10,2) NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS invoices (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			total_price DECIMAL(10,2) NOT NULL,
			status TEXT CHECK(status IN ('created', 'processed', 'deleted')) DEFAULT 'created',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			processed_at DATETIME NULL
		)`,
		`CREATE TABLE IF NOT EXISTS invoice_items (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			invoice_id INTEGER NOT NULL,
			product_id INTEGER NOT NULL,
			quantity INTEGER NOT NULL,
			unit_price DECIMAL(10,2) NOT NULL,
			total_price DECIMAL(10,2) NOT NULL,
			FOREIGN KEY (invoice_id) REFERENCES invoices(id),
			FOREIGN KEY (product_id) REFERENCES products(id)
		)`,
	}

	for _, schema := range schemas {
		if _, err := db.Exec(schema); err != nil {
			return err
		}
	}

	return nil
}