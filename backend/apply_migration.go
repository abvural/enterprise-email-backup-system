package main

import (
    "database/sql"
    "fmt"
    "io/ioutil"
    "log"
    "strings"
    
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
    
    // Read migration file
    content, err := ioutil.ReadFile("database/migrations/add_storage_tracking.sql")
    if err != nil {
        log.Fatal("Failed to read migration file:", err)
    }
    
    // Split SQL content by semicolons and execute each statement
    sqlStatements := strings.Split(string(content), ";")
    
    for i, stmt := range sqlStatements {
        stmt = strings.TrimSpace(stmt)
        if stmt == "" {
            continue
        }
        
        // Skip comments
        if strings.HasPrefix(stmt, "--") {
            continue
        }
        
        fmt.Printf("Executing statement %d...\n", i+1)
        
        _, err = db.Exec(stmt)
        if err != nil {
            // Check if it's a "already exists" error which we can ignore
            errStr := err.Error()
            if strings.Contains(errStr, "already exists") {
                fmt.Printf("  Skipping (already exists): %s\n", strings.Split(stmt, "\n")[0])
                continue
            }
            log.Printf("Failed to execute statement %d: %v\n", i+1, err)
            log.Printf("Statement: %s\n", stmt[:min(100, len(stmt))])
        } else {
            fmt.Printf("  Success: %s\n", strings.Split(stmt, "\n")[0])
        }
    }
    
    // Verify tables were created
    fmt.Println("\nVerifying tables...")
    
    tables := []string{"account_storage_stats", "folder_storage_stats"}
    for _, table := range tables {
        var exists bool
        err = db.QueryRow(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = $1
            )`, table).Scan(&exists)
        
        if err != nil {
            log.Printf("Error checking table %s: %v\n", table, err)
        } else if exists {
            fmt.Printf("✓ Table %s exists\n", table)
        } else {
            fmt.Printf("✗ Table %s does not exist\n", table)
        }
    }
    
    // Check if columns were added to email_index
    fmt.Println("\nVerifying email_index columns...")
    
    columns := []string{"email_size", "content_size", "attachment_count", "attachment_size"}
    for _, col := range columns {
        var exists bool
        err = db.QueryRow(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'email_index'
                AND column_name = $1
            )`, col).Scan(&exists)
        
        if err != nil {
            log.Printf("Error checking column %s: %v\n", col, err)
        } else if exists {
            fmt.Printf("✓ Column email_index.%s exists\n", col)
        } else {
            fmt.Printf("✗ Column email_index.%s does not exist\n", col)
        }
    }
    
    fmt.Println("\n✅ Migration process completed!")
}

func min(a, b int) int {
    if a < b {
        return a
    }
    return b
}