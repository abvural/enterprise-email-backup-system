import { test, expect } from '@playwright/test';

// Test admin menu security - Admin should NOT see EMAIL MANAGEMENT
test.describe('Admin Menu Security Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:5173/login');
    
    // Wait for login form to be ready
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('Admin should NOT see EMAIL MANAGEMENT menu', async ({ page }) => {
    // Login as admin
    await page.fill('input[type="email"]', 'admin@emailbackup.com');
    await page.fill('input[type="password"]', 'Admin123!');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/admin/dashboard');
    
    // Wait for sidebar to be loaded
    await expect(page.locator('text=Dashboard').first()).toBeVisible();
    
    // Verify admin sees correct menu items
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Organizations')).toBeVisible();
    await expect(page.locator('text=System Management')).toBeVisible();
    await expect(page.locator('button:has-text("Settings")').first()).toBeVisible();
    
    // CRITICAL: Verify admin does NOT see EMAIL MANAGEMENT items in the sidebar menu
    const sidebar = page.locator('[role="navigation"], aside, [data-testid="sidebar"], div:has(button:has-text("Dashboard"))').first();
    
    // These menu items should NOT exist in the sidebar for admin
    await expect(sidebar.locator('text=EMAIL MANAGEMENT')).not.toBeVisible();
    await expect(sidebar.locator('text=Email Management')).not.toBeVisible();
    await expect(sidebar.locator('button:has-text("Email Accounts")')).not.toBeVisible();
    await expect(sidebar.locator('button:has-text("Emails")')).not.toBeVisible();
    await expect(sidebar.locator('text=Inbox')).not.toBeVisible();
    await expect(sidebar.locator('text=Sent Items')).not.toBeVisible();
    
    // Take screenshot for verification
    await page.screenshot({ path: 'admin-menu-security.png', fullPage: true });
    
    console.log('✅ Admin menu security test passed - EMAIL MANAGEMENT is NOT visible');
  });

  test('Admin can access Organizations page', async ({ page }) => {
    // Login as admin
    await page.fill('input[type="email"]', 'admin@emailbackup.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/admin/dashboard');
    
    // Click on Organizations menu
    await page.click('text=Organizations');
    
    // Verify navigation to organizations page
    await page.waitForURL('**/admin/organizations');
    await expect(page.locator('h1, h2').filter({ hasText: /organization/i }).first()).toBeVisible();
    
    console.log('✅ Admin can access Organizations page');
  });

  test('End user SHOULD see EMAIL MANAGEMENT menu', async ({ page }) => {
    // First logout if logged in
    await page.goto('http://localhost:5173/login');
    
    // Login as end user (using a valid test account)
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="password"]', 'User123!');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForURL('**/dashboard');
    
    // Verify end user DOES see EMAIL MANAGEMENT items
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Email Management')).toBeVisible();
    
    // Click to expand Email Management if needed
    const emailManagement = page.locator('text=Email Management');
    if (await emailManagement.isVisible()) {
      await emailManagement.click();
      // Wait a bit for menu to expand
      await page.waitForTimeout(500);
    }
    
    // These should be visible for end users
    await expect(page.locator('text=Emails').first()).toBeVisible();
    await expect(page.locator('text=Email Accounts')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'enduser-menu-email-visible.png', fullPage: true });
    
    console.log('✅ End user can see EMAIL MANAGEMENT menu as expected');
  });

  test('Visual comparison of admin vs end user menus', async ({ page, browser }) => {
    // Test admin menu
    await page.fill('input[type="email"]', 'admin@emailbackup.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard');
    
    // Take admin screenshot
    await page.screenshot({ path: 'menu-admin.png', fullPage: false });
    
    // Get all visible menu text for admin
    const adminMenuItems = await page.locator('[role="button"], button').allTextContents();
    console.log('Admin menu items:', adminMenuItems.filter(item => item.trim()));
    
    // Open new page for end user
    const context = await browser.newContext();
    const page2 = await context.newPage();
    
    await page2.goto('http://localhost:5173/login');
    await page2.fill('input[type="email"]', 'user@example.com');
    await page2.fill('input[type="password"]', 'User123!');
    await page2.click('button[type="submit"]');
    await page2.waitForURL('**/dashboard');
    
    // Take end user screenshot
    await page2.screenshot({ path: 'menu-enduser.png', fullPage: false });
    
    // Get all visible menu text for end user
    const endUserMenuItems = await page2.locator('[role="button"], button').allTextContents();
    console.log('End user menu items:', endUserMenuItems.filter(item => item.trim()));
    
    // Close second context
    await context.close();
    
    console.log('✅ Visual comparison screenshots saved');
  });
});