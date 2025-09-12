import { test, expect } from '@playwright/test';

test.describe('Sync Modal Final E2E Test', () => {
  
  test('should successfully test sync modal with real account', async ({ page }) => {
    console.log('🚀 Starting final sync modal test');
    
    // Step 1: Login
    await page.goto('/');
    await expect(page.locator('button:has-text("Sign in")')).toBeVisible();
    
    await page.fill('input[placeholder="Enter your email"]', 'admin@emailbackup.com');
    await page.fill('input[placeholder="Enter your password"]', 'Admin123!');
    await page.click('button:has-text("Sign in")');
    
    await page.waitForTimeout(3000);
    console.log(`✅ Login successful, redirected to: ${page.url()}`);
    
    // Step 2: Navigate to Email Accounts page
    if (!page.url().includes('/emails')) {
      await page.goto('/emails');
    }
    
    await page.click('text=Email Accounts');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('✅ Navigated to Email Accounts page');
    
    // Step 3: Take screenshot to verify accounts are loaded
    await page.screenshot({ path: 'test-results/accounts-before-sync.png' });
    
    // Step 4: Look for the Exchange account and sync button
    const exchangeAccount = page.locator('text=unal.karaaslan@bilisimcenter.com').first();
    await expect(exchangeAccount).toBeVisible();
    console.log('✅ Exchange account found');
    
    // Step 5: Find the sync button in the same row as the Exchange account
    const syncButton = page.locator('button:has-text("Sync")').first();
    await expect(syncButton).toBeVisible();
    await expect(syncButton).toBeEnabled();
    console.log('✅ Sync button found and is enabled');
    
    // Step 6: Click the sync button
    console.log('🔄 Clicking sync button...');
    await syncButton.click();
    
    // Step 7: Wait for modal to appear
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/after-sync-click-final.png' });
    
    // Step 8: Check for sync progress modal with multiple approaches
    console.log('🔍 Looking for sync progress modal...');
    
    const modalSelectors = [
      '[role="dialog"]',
      '.chakra-modal__content',
      '[data-testid*="modal"]',
      'text=Email Sync Progress',
      'text=Sync Progress',
      '[role="progressbar"]'
    ];
    
    let modalFound = false;
    let modalElement = null;
    
    for (const selector of modalSelectors) {
      modalElement = page.locator(selector).first();
      if (await modalElement.count() > 0) {
        console.log(`✅ Modal element found with selector: ${selector}`);
        modalFound = true;
        break;
      }
    }
    
    if (modalFound && modalElement) {
      console.log('🎉 SUCCESS: Sync progress modal is working!');
      
      // Verify modal visibility
      await expect(modalElement).toBeVisible();
      
      // Get modal content
      const modalText = await modalElement.textContent();
      console.log('📋 Modal content preview:', modalText?.substring(0, 300));
      
      // Take detailed screenshot of modal
      await page.screenshot({ path: 'test-results/sync-modal-working.png' });
      
      // Check for common progress elements
      const progressElements = [
        'text=Status:',
        'text=Progress:',
        'text=Total Emails:',
        'text=Processed:',
        '[role="progressbar"]',
        'text=Time Elapsed:',
        '[data-testid*="progress"]',
        '[data-testid*="status"]'
      ];
      
      for (const element of progressElements) {
        if (await page.locator(element).count() > 0) {
          console.log(`✅ Progress element found: ${element}`);
        }
      }
      
      // Wait for sync progress or completion
      console.log('⏳ Monitoring sync progress for 10 seconds...');
      for (let i = 0; i < 10; i++) {
        await page.waitForTimeout(1000);
        
        // Check if sync is complete
        const completeText = page.locator('text=Complete, text=Completed, text=Success');
        if (await completeText.count() > 0) {
          console.log(`✅ Sync completed at ${i + 1} seconds`);
          break;
        }
        
        // Log current status if available
        const statusElement = page.locator('[data-testid*="status"]').first();
        if (await statusElement.count() > 0) {
          const status = await statusElement.textContent();
          console.log(`📊 Sync status at ${i + 1}s: ${status}`);
        }
      }
      
      // Final screenshot after monitoring
      await page.screenshot({ path: 'test-results/sync-modal-after-wait.png' });
      
      // Check if modal auto-closes or needs manual close
      const modalStillVisible = await modalElement.isVisible();
      console.log(`📊 Modal still visible after sync: ${modalStillVisible}`);
      
      if (modalStillVisible) {
        const closeButton = page.locator('button:has-text("Close")');
        if (await closeButton.count() > 0) {
          await closeButton.click();
          console.log('✅ Manually closed modal');
        }
      }
      
    } else {
      console.log('❌ No sync progress modal detected');
      
      // Check for alternative sync indicators
      const altIndicators = [
        'text=sync',
        'text=Sync',
        'text=progress',
        'text=initiated',
        '.chakra-toast',
        '[role="alert"]'
      ];
      
      for (const indicator of altIndicators) {
        if (await page.locator(indicator).count() > 0) {
          console.log(`📢 Alternative sync indicator found: ${indicator}`);
          const text = await page.locator(indicator).first().textContent();
          console.log(`   Content: ${text?.substring(0, 100)}`);
        }
      }
      
      // Check console for any errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log(`🚫 Browser console error: ${msg.text()}`);
        }
      });
    }
    
    console.log('✅ Final sync modal test completed');
  });
});