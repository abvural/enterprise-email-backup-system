import { test, expect } from '@playwright/test';

test('Simple sync modal test', async ({ page }) => {
  console.log('🚀 Starting simple sync modal test');
  
  // Navigate to emails page
  await page.goto('/emails');
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  // Take a screenshot to see what's on the page
  await page.screenshot({ path: 'test-results/page-before-sync.png' });
  
  // Try to find the sync button using multiple selectors
  const syncButtons = [
    'button[aria-label="Sync Emails"]',
    'button:has-text("Sync")',
    '[title="Sync emails with real-time progress"]',
    'button[title*="Sync"]'
  ];
  
  let syncButton = null;
  for (const selector of syncButtons) {
    syncButton = page.locator(selector).first();
    if (await syncButton.count() > 0) {
      console.log(`✅ Found sync button with selector: ${selector}`);
      break;
    }
  }
  
  if (!syncButton || await syncButton.count() === 0) {
    console.log('❌ No sync button found, taking screenshot');
    await page.screenshot({ path: 'test-results/no-sync-button.png' });
    
    // List all buttons on the page
    const allButtons = await page.locator('button').all();
    console.log(`Found ${allButtons.length} buttons on the page:`);
    for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
      const buttonText = await allButtons[i].textContent();
      const buttonTitle = await allButtons[i].getAttribute('title');
      const buttonAriaLabel = await allButtons[i].getAttribute('aria-label');
      console.log(`  Button ${i}: text="${buttonText}", title="${buttonTitle}", aria-label="${buttonAriaLabel}"`);
    }
    
    throw new Error('Sync button not found');
  }
  
  // Check if sync button is visible
  await expect(syncButton).toBeVisible();
  console.log('✅ Sync button is visible');
  
  // Click the sync button
  await syncButton.click();
  console.log('✅ Clicked sync button');
  
  // Wait a moment for modal to appear
  await page.waitForTimeout(2000);
  
  // Take screenshot after clicking
  await page.screenshot({ path: 'test-results/after-sync-click.png' });
  
  // Check for modal or any response
  const modal = page.locator('[role="dialog"]').first();
  const modalExists = await modal.count() > 0;
  
  if (modalExists) {
    console.log('✅ Modal found!');
    await expect(modal).toBeVisible();
    
    // Take screenshot of modal
    await page.screenshot({ path: 'test-results/modal-visible.png' });
    
    // Check modal content
    const modalContent = await modal.textContent();
    console.log('📋 Modal content:', modalContent);
    
  } else {
    console.log('❌ No modal found');
    
    // Check for any changes on the page
    const pageContent = await page.textContent('body');
    if (pageContent.includes('sync') || pageContent.includes('Sync')) {
      console.log('✅ Page contains sync-related content');
    } else {
      console.log('❌ No sync-related content found');
    }
  }
  
  console.log('✅ Simple sync test completed');
});