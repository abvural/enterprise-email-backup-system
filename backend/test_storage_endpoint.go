package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
)

func main() {
	// Login first
	loginURL := "http://localhost:8081/auth/login"
	loginBody := `{"email":"admin@emailbackup.com","password":"Admin123!"}`
	
	resp, err := http.Post(loginURL, "application/json", strings.NewReader(loginBody))
	if err != nil {
		fmt.Printf("Login failed: %v\n", err)
		return
	}
	defer resp.Body.Close()
	
	body, _ := ioutil.ReadAll(resp.Body)
	fmt.Printf("Login response: %s\n", string(body))
	
	// Extract token (manually for simplicity)
	// In a real app, you'd parse the JSON properly
	tokenStart := strings.Index(string(body), `"token":"`) + 9
	tokenEnd := strings.Index(string(body)[tokenStart:], `"`)
	token := string(body)[tokenStart : tokenStart+tokenEnd]
	
	fmt.Printf("\nToken obtained: %.50s...\n", token)
	
	// Test storage endpoint
	testEndpoints := []string{
		"http://localhost:8081/api/storage/total",
		"http://localhost:8081/api/storage/accounts", 
		"http://localhost:8081/api/accounts",
	}
	
	client := &http.Client{}
	
	for _, endpoint := range testEndpoints {
		fmt.Printf("\n=== Testing %s ===\n", endpoint)
		
		req, err := http.NewRequest("GET", endpoint, nil)
		if err != nil {
			fmt.Printf("Error creating request: %v\n", err)
			continue
		}
		
		req.Header.Add("Authorization", "Bearer "+token)
		
		resp, err := client.Do(req)
		if err != nil {
			fmt.Printf("Error making request: %v\n", err)
			continue
		}
		
		body, _ := ioutil.ReadAll(resp.Body)
		resp.Body.Close()
		
		fmt.Printf("Status: %d\n", resp.StatusCode)
		fmt.Printf("Response: %s\n", string(body))
	}
}