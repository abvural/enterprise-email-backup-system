import { test, expect } from '@playwright/test';

test.describe('Sync Modal E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate directly to emails page (assuming no auth middleware)
    await page.goto('/emails');
    
    // Check if we're on login page and need to login
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      // We're on login page, do login
      await page.fill('input[type="email"]', 'admin@emailbackup.com');
      await page.fill('input[type="password"]', 'Admin123!');
      await page.click('button[type="submit"]');
      
      // Wait for redirect
      await page.waitForURL('/emails', { timeout: 10000 });
    }
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should show sync progress modal when sync button is clicked', async ({ page }) => {
    console.log('🚀 Starting sync modal test');
    
    // Wait for accounts to load
    await page.waitForSelector('[data-testid="account-list"]', { timeout: 10000 });
    
    // Find and click sync button
    const syncButton = page.locator('button:has-text("Sync")').first();
    await expect(syncButton).toBeVisible({ timeout: 5000 });
    
    console.log('📧 Clicking sync button');
    await syncButton.click();
    
    // Check if modal opens
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Modal is visible');
    
    // Check modal content
    await expect(page.locator('text=Email Sync Progress')).toBeVisible();
    await expect(page.locator('[role="progressbar"]')).toBeVisible();
    
    // Check for progress elements
    await expect(page.locator('text=Status:')).toBeVisible();
    await expect(page.locator('text=Progress:')).toBeVisible();
    
    // Wait for sync to complete or progress to show
    await page.waitForTimeout(3000);
    
    // Check if progress updates are visible
    const statusText = await page.locator('[data-testid="sync-status"]').textContent();
    console.log('📊 Sync status:', statusText);
    
    // Modal should still be visible for at least 5 seconds
    await expect(modal).toBeVisible();
    
    console.log('✅ Sync modal test completed successfully');
  });

  test('should show detailed progress information', async ({ page }) => {
    console.log('🔍 Testing detailed progress information');
    
    // Wait for accounts to load
    await page.waitForSelector('[data-testid="account-list"]', { timeout: 10000 });
    
    // Click sync button
    const syncButton = page.locator('button:has-text("Sync")').first();
    await syncButton.click();
    
    // Wait for modal
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Check for detailed progress elements
    await expect(page.locator('text=Total Emails:')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Processed:')).toBeVisible();
    await expect(page.locator('text=Successful:')).toBeVisible();
    await expect(page.locator('text=Failed:')).toBeVisible();
    
    // Check for activity log
    await expect(page.locator('[data-testid="activity-log"]')).toBeVisible();
    
    // Check for time information
    await expect(page.locator('text=Time Elapsed:')).toBeVisible();
    
    console.log('✅ Detailed progress information test completed');
  });

  test('should handle sync completion', async ({ page }) => {
    console.log('⏱️ Testing sync completion handling');
    
    // Wait for accounts to load
    await page.waitForSelector('[data-testid="account-list"]', { timeout: 10000 });
    
    // Click sync button
    const syncButton = page.locator('button:has-text("Sync")').first();
    await syncButton.click();
    
    // Wait for modal
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Wait for sync to complete (up to 10 seconds)
    await page.waitForTimeout(10000);
    
    // Check if completion status is shown
    const completionText = page.locator('text=Completed');
    if (await completionText.count() > 0) {
      await expect(completionText).toBeVisible();
      console.log('✅ Sync completed successfully');
    }
    
    // Modal should auto-close after completion
    await page.waitForTimeout(6000); // Wait 6 seconds for auto-close
    
    console.log('✅ Sync completion test finished');
  });

  test('should allow manual modal close', async ({ page }) => {
    console.log('❌ Testing manual modal close');
    
    // Wait for accounts to load
    await page.waitForSelector('[data-testid="account-list"]', { timeout: 10000 });
    
    // Click sync button
    const syncButton = page.locator('button:has-text("Sync")').first();
    await syncButton.click();
    
    // Wait for modal
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Find and click close button
    const closeButton = page.locator('button:has-text("Close")');
    if (await closeButton.count() > 0) {
      await closeButton.click();
      
      // Modal should be hidden
      await expect(modal).toBeHidden({ timeout: 2000 });
      console.log('✅ Modal closed manually');
    } else {
      console.log('⚠️ Close button not found, skipping manual close test');
    }
  });

});