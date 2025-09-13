# PowerShell script to apply storage tracking migration
# This script connects to PostgreSQL and applies the migration

$env:PGPASSWORD = "avural1234"

Write-Host "Applying storage tracking migration to PostgreSQL..." -ForegroundColor Green

# PostgreSQL connection parameters
$pgHost = "172.25.1.148"
$pgPort = "5432"
$pgUser = "postgres"
$pgDatabase = "email_backup_mvp"
$migrationFile = "database\migrations\add_storage_tracking.sql"

# Check if migration file exists
if (-Not (Test-Path $migrationFile)) {
    Write-Host "Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Connecting to PostgreSQL at $pgHost..." -ForegroundColor Yellow

# Create a temporary SQL file that includes the migration
$tempFile = "temp_migration.sql"
@"
-- Connect to the database
\c $pgDatabase

-- Apply the migration
"@ | Out-File -FilePath $tempFile -Encoding UTF8

Get-Content $migrationFile | Out-File -FilePath $tempFile -Append -Encoding UTF8

# Use psql if available, otherwise use a Go program
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue

if ($psqlPath) {
    Write-Host "Using psql to apply migration..." -ForegroundColor Yellow
    psql -h $pgHost -p $pgPort -U $pgUser -d $pgDatabase -f $migrationFile
} else {
    Write-Host "psql not found, creating Go migration program..." -ForegroundColor Yellow
    
    # Create a Go program to apply the migration
    $goMigration = @"
package main

import (
    "database/sql"
    "fmt"
    "io/ioutil"
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
    
    // Read migration file
    content, err := ioutil.ReadFile("database/migrations/add_storage_tracking.sql")
    if err != nil {
        log.Fatal("Failed to read migration file:", err)
    }
    
    // Execute migration
    _, err = db.Exec(string(content))
    if err != nil {
        log.Fatal("Failed to execute migration:", err)
    }
    
    fmt.Println("Migration applied successfully!")
}
"@
    
    $goMigration | Out-File -FilePath "apply_migration.go" -Encoding UTF8
    
    Write-Host "Building migration program..." -ForegroundColor Yellow
    go build -o apply_migration.exe apply_migration.go
    
    Write-Host "Running migration..." -ForegroundColor Yellow
    .\apply_migration.exe
    
    # Clean up
    Remove-Item apply_migration.go -ErrorAction SilentlyContinue
    Remove-Item apply_migration.exe -ErrorAction SilentlyContinue
}

# Clean up temp file
Remove-Item $tempFile -ErrorAction SilentlyContinue

Write-Host "Storage tracking migration completed!" -ForegroundColor Green
Write-Host "Now rebuilding backend with storage features..." -ForegroundColor Yellow