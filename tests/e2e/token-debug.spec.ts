import { test, expect } from '@playwright/test';

test('Debug token persistence and sync flow', async ({ page }) => {
  console.log('🚀 Starting token debug test');
  
  // Step 1: Login
  await page.goto('/');
  await expect(page.locator('button:has-text("Sign in")')).toBeVisible();
  
  await page.fill('input[placeholder="Enter your email"]', 'admin@emailbackup.com');
  await page.fill('input[placeholder="Enter your password"]', 'Admin123!');
  await page.click('button:has-text("Sign in")');
  
  await page.waitForTimeout(3000);
  console.log(`✅ Login completed, current URL: ${page.url()}`);
  
  // Step 2: Check if token exists in localStorage (both keys)
  const tokens = await page.evaluate(() => {
    return {
      token: localStorage.getItem('token'),
      auth_token: localStorage.getItem('auth_token'),
      all_keys: Object.keys(localStorage)
    };
  });
  
  console.log(`🔑 'token' exists: ${tokens.token !== null}`);
  console.log(`🔑 'auth_token' exists: ${tokens.auth_token !== null}`);
  console.log(`🔑 All localStorage keys: ${tokens.all_keys.join(', ')}`);
  
  const token = tokens.auth_token || tokens.token;
  console.log(`🔑 Using token length: ${token ? token.length : 0}`);
  if (token) {
    console.log(`🔑 Token starts with: ${token.substring(0, 30)}...`);
  }
  
  if (!token) {
    console.log('❌ No token found in localStorage after login');
    return;
  }
  
  // Step 3: Navigate to Email Accounts page
  if (!page.url().includes('/emails')) {
    await page.goto('/emails');
  }
  
  await page.click('text=Email Accounts');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  console.log('✅ Navigated to Email Accounts page');
  
  // Step 4: Check token again after navigation
  const tokenAfterNav = await page.evaluate(() => {
    return localStorage.getItem('auth_token');
  });
  
  console.log(`🔑 Token after navigation: ${tokenAfterNav !== null}`);
  console.log(`🔑 Token still same: ${token === tokenAfterNav}`);
  
  // Step 5: Manually test the sync API call
  const syncResult = await page.evaluate(async (authToken) => {
    try {
      console.log('🔄 Making sync API call...');
      const response = await fetch(`http://localhost:8081/api/accounts/4d6d2e74-c2b0-4225-af39-5ae815d8c40b/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      const responseText = await response.text();
      return {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText
      };
    } catch (error) {
      return {
        error: error.message
      };
    }
  }, token);
  
  console.log('📊 Sync API result:', JSON.stringify(syncResult, null, 2));
  
  // Step 6: Try to find sync button and click it
  const syncButton = page.locator('button:has-text("Sync")').first();
  if (await syncButton.count() > 0) {
    console.log('✅ Sync button found');
    
    // Add console listener to catch frontend logs
    page.on('console', msg => {
      if (msg.text().includes('🔄') || msg.text().includes('🔑')) {
        console.log(`📱 Frontend: ${msg.text()}`);
      }
    });
    
    await syncButton.click();
    console.log('✅ Sync button clicked');
    
    // Wait for any async operations
    await page.waitForTimeout(3000);
  } else {
    console.log('❌ Sync button not found');
  }
  
  console.log('✅ Token debug test completed');
});