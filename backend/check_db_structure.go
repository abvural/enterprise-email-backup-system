package main

import (
    "database/sql"
    "fmt"
    "log"
    
    _ "github.com/lib/pq"
)

func main() {
    // Database connection
    connStr := "host=172.25.1.148 port=5432 user=postgres password=avural1234 dbname=email_backup_mvp sslmode=disable"
    db, err := sql.Open("postgres", connStr)
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }
    defer db.Close()
    
    // Test connection
    err = db.Ping()
    if err != nil {
        log.Fatal("Failed to ping database:", err)
    }
    
    fmt.Println("Connected to PostgreSQL successfully!")
    fmt.Println("\n=== Checking existing tables ===")
    
    // Check existing tables
    rows, err := db.Query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
    `)
    if err != nil {
        log.Fatal("Failed to query tables:", err)
    }
    defer rows.Close()
    
    fmt.Println("Existing tables:")
    for rows.Next() {
        var tableName string
        if err := rows.Scan(&tableName); err != nil {
            log.Printf("Error scanning table name: %v\n", err)
            continue
        }
        fmt.Printf("  - %s\n", tableName)
    }
    
    // Check if email_index exists and its columns
    fmt.Println("\n=== Checking email_index table structure ===")
    
    var tableExists bool
    err = db.QueryRow(`
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'email_index'
        )
    `).Scan(&tableExists)
    
    if err != nil {
        log.Printf("Error checking email_index: %v\n", err)
    } else if tableExists {
        fmt.Println("✓ email_index table exists")
        
        // Get columns
        rows, err := db.Query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = 'email_index'
            ORDER BY ordinal_position
        `)
        if err != nil {
            log.Printf("Error getting columns: %v\n", err)
        } else {
            defer rows.Close()
            fmt.Println("Columns:")
            for rows.Next() {
                var colName, dataType, isNullable string
                if err := rows.Scan(&colName, &dataType, &isNullable); err != nil {
                    continue
                }
                fmt.Printf("  - %s (%s) nullable=%s\n", colName, dataType, isNullable)
            }
        }
    } else {
        fmt.Println("✗ email_index table does not exist")
    }
}