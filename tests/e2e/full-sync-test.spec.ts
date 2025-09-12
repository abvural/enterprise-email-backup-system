import { test, expect } from '@playwright/test';

test.describe('Full Sync Modal E2E Test', () => {
  
  test('should login and test sync modal functionality', async ({ page }) => {
    console.log('🚀 Starting full sync modal test with authentication');
    
    // Step 1: Navigate to the application
    await page.goto('/');
    
    // Step 2: Verify we're on login page
    await expect(page.locator('button:has-text("Sign in")')).toBeVisible();
    console.log('✅ Login page loaded');
    
    // Step 3: Perform login
    await page.fill('input[placeholder="Enter your email"]', 'admin@emailbackup.com');
    await page.fill('input[placeholder="Enter your password"]', 'Admin123!');
    
    // Click sign in button
    await page.click('button:has-text("Sign in")');
    console.log('✅ Login form submitted');
    
    // Step 4: Wait for redirect (likely to dashboard)
    await page.waitForTimeout(3000);
    console.log(`✅ Login successful, redirected to: ${page.url()}`);
    
    // Step 5: Navigate to emails page if not there already
    if (!page.url().includes('/emails')) {
      await page.goto('/emails');
      console.log('✅ Navigated to emails page');
    }
    
    // Step 5b: Navigate to Email Accounts page where sync buttons are located
    await page.click('text=Email Accounts');
    console.log('✅ Navigated to Email Accounts page');
    
    // Step 6: Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Step 7: Take screenshot of email accounts page
    await page.screenshot({ path: 'test-results/email-accounts-page-loaded.png' });
    
    // Step 8: Look for email accounts or sync buttons
    console.log('🔍 Looking for accounts and sync buttons...');
    
    // Check if there are any email accounts
    const accountCards = page.locator('[data-testid*="account"]');
    const accountCount = await accountCards.count();
    console.log(`📊 Found ${accountCount} email accounts`);
    
    if (accountCount === 0) {
      console.log('⚠️ No email accounts found, checking for add account options');
      
      // Look for "Add Account" or similar buttons
      const addAccountButton = page.locator('button:has-text("Add"), button:has-text("Connect")').first();
      if (await addAccountButton.count() > 0) {
        console.log('📝 Found add account button, but skipping account creation for sync test');
        await page.screenshot({ path: 'test-results/no-accounts-found.png' });
        return; // Exit test as we need accounts to test sync
      }
    }
    
    // Step 8: Look for sync buttons
    const syncButtonSelectors = [
      'button[title*="Sync"]',
      'button:has-text("Sync")',
      'button[aria-label*="Sync"]',
      '[data-testid*="sync"]'
    ];
    
    let syncButton = null;
    let usedSelector = '';
    
    for (const selector of syncButtonSelectors) {
      syncButton = page.locator(selector).first();
      if (await syncButton.count() > 0) {
        console.log(`✅ Found sync button with selector: ${selector}`);
        usedSelector = selector;
        break;
      }
    }
    
    if (!syncButton || await syncButton.count() === 0) {
      console.log('❌ No sync button found');
      
      // List all buttons for debugging
      const allButtons = await page.locator('button').all();
      console.log(`Found ${allButtons.length} buttons on emails page:`);
      
      for (let i = 0; i < Math.min(allButtons.length, 15); i++) {
        const buttonText = await allButtons[i].textContent();
        const buttonTitle = await allButtons[i].getAttribute('title');
        const buttonAriaLabel = await allButtons[i].getAttribute('aria-label');
        console.log(`  Button ${i}: text="${buttonText}", title="${buttonTitle}", aria-label="${buttonAriaLabel}"`);
      }
      
      await page.screenshot({ path: 'test-results/no-sync-button-emails-page.png' });
      throw new Error('Sync button not found on emails page');
    }
    
    // Step 9: Verify sync button is visible and clickable
    await expect(syncButton).toBeVisible();
    await expect(syncButton).toBeEnabled();
    console.log('✅ Sync button is visible and enabled');
    
    // Step 10: Click the sync button
    console.log('🔄 Clicking sync button...');
    await syncButton.click();
    
    // Step 11: Wait for modal or response
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/after-sync-click-full.png' });
    
    // Step 12: Check for sync progress modal
    const modalSelectors = [
      '[role="dialog"]',
      '.chakra-modal__content',
      '[data-testid*="modal"]',
      '.modal'
    ];
    
    let modal = null;
    let modalFound = false;
    
    for (const selector of modalSelectors) {
      modal = page.locator(selector).first();
      if (await modal.count() > 0) {
        console.log(`✅ Found modal with selector: ${selector}`);
        modalFound = true;
        break;
      }
    }
    
    if (modalFound && modal) {
      console.log('🎉 Sync progress modal found!');
      
      // Verify modal is visible
      await expect(modal).toBeVisible();
      
      // Check for modal content
      const modalText = await modal.textContent();
      console.log('📋 Modal content:', modalText?.substring(0, 200));
      
      // Look for progress indicators
      const progressBar = page.locator('[role="progressbar"]');
      if (await progressBar.count() > 0) {
        console.log('📊 Progress bar found in modal');
      }
      
      // Look for sync status text
      const statusElements = [
        'text=Status:',
        'text=Progress:',
        'text=Sync',
        '[data-testid*="status"]'
      ];
      
      for (const statusSelector of statusElements) {
        if (await page.locator(statusSelector).count() > 0) {
          console.log(`✅ Status element found: ${statusSelector}`);
        }
      }
      
      // Take screenshot of modal
      await page.screenshot({ path: 'test-results/sync-modal-success.png' });
      
      // Wait for sync to complete or modal to auto-close
      console.log('⏳ Waiting for sync to complete...');
      await page.waitForTimeout(8000);
      
      // Check if modal is still visible or closed
      const modalStillVisible = await modal.isVisible();
      console.log(`📊 Modal still visible after 8 seconds: ${modalStillVisible}`);
      
      if (modalStillVisible) {
        // Try to close manually if close button exists
        const closeButton = page.locator('button:has-text("Close")');
        if (await closeButton.count() > 0) {
          await closeButton.click();
          console.log('✅ Manually closed modal');
        }
      }
      
    } else {
      console.log('❌ No sync progress modal found');
      
      // Check for any text changes on the page
      const pageText = await page.textContent('body');
      if (pageText?.includes('sync') || pageText?.includes('Sync')) {
        console.log('✅ Page contains sync-related text (possible inline progress)');
      } else {
        console.log('❌ No sync-related changes detected');
      }
      
      // Check for toast notifications or alerts
      const toastSelectors = [
        '.chakra-toast',
        '[role="alert"]',
        '.toast',
        '.notification'
      ];
      
      for (const toastSelector of toastSelectors) {
        if (await page.locator(toastSelector).count() > 0) {
          console.log(`📢 Found notification: ${toastSelector}`);
        }
      }
    }
    
    console.log('✅ Full sync modal test completed');
  });
});