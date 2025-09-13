const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting E2E test for admin menu visibility...\n');
  
  const browser = await chromium.launch({ 
    headless: false,  // Set to true for headless mode
    slowMo: 500      // Slow down for visibility
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the application
    console.log('📍 Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173');
    
    // Wait for login page to load
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    console.log('✅ Login page loaded\n');
    
    // Login as admin
    console.log('🔐 Logging in as admin...');
    await page.fill('input[type="email"]', 'admin@emailbackup.com');
    await page.fill('input[type="password"]', 'Admin123!');
    
    // Click login button
    await page.click('button:has-text("Sign in")');
    
    // Wait for navigation after login
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    console.log('✅ Successfully logged in and redirected to admin dashboard\n');
    
    // Check for role information in localStorage
    const authData = await page.evaluate(() => {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        return {
          isAuthenticated: parsed.state?.isAuthenticated,
          userEmail: parsed.state?.user?.email,
          userRole: parsed.state?.user?.role?.name,
          roleLevel: parsed.state?.user?.role?.level
        };
      }
      return null;
    });
    
    console.log('📊 User Authentication Data:');
    console.log('   Email:', authData?.userEmail);
    console.log('   Role:', authData?.userRole);
    console.log('   Role Level:', authData?.roleLevel);
    console.log('   Authenticated:', authData?.isAuthenticated);
    console.log('');
    
    // Check sidebar menu items
    console.log('🔍 Checking sidebar menu items...\n');
    
    // Get all menu items
    const menuItems = await page.$$eval('.chakra-box a, .chakra-button', elements => 
      elements.map(el => ({
        text: el.textContent?.trim(),
        href: el.getAttribute('href') || el.closest('a')?.getAttribute('href')
      })).filter(item => item.text && item.text.length > 0)
    );
    
    console.log('📋 Found menu items:');
    menuItems.forEach(item => {
      console.log(`   - ${item.text}${item.href ? ` (${item.href})` : ''}`);
    });
    console.log('');
    
    // Check for problematic items
    const problematicItems = menuItems.filter(item => 
      item.text?.toLowerCase().includes('email') ||
      item.text?.toLowerCase().includes('inbox') ||
      item.text?.toLowerCase().includes('sent') ||
      item.text?.toLowerCase().includes('folder') ||
      item.href?.includes('/emails') ||
      item.href?.includes('/accounts')
    );
    
    if (problematicItems.length > 0) {
      console.log('❌ PROBLEM DETECTED: Admin has access to email-related menu items:');
      problematicItems.forEach(item => {
        console.log(`   ⚠️ ${item.text}${item.href ? ` (${item.href})` : ''}`);
      });
      console.log('\n🚨 Admin should NOT have email menu items!');
    } else {
      console.log('✅ CORRECT: No email-related menu items found for admin role');
    }
    
    // Check expected admin menu items
    const expectedAdminItems = ['Dashboard', 'Organizations', 'Create Organization', 'System Settings'];
    const foundExpectedItems = [];
    const missingExpectedItems = [];
    
    expectedAdminItems.forEach(expected => {
      const found = menuItems.some(item => item.text?.includes(expected));
      if (found) {
        foundExpectedItems.push(expected);
      } else {
        missingExpectedItems.push(expected);
      }
    });
    
    console.log('\n📌 Expected Admin Menu Items:');
    foundExpectedItems.forEach(item => console.log(`   ✅ ${item}`));
    missingExpectedItems.forEach(item => console.log(`   ❌ ${item} (MISSING)`));
    
    // Take a screenshot for evidence
    await page.screenshot({ path: 'admin-menu-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved as admin-menu-test.png');
    
    // Final verdict
    console.log('\n' + '='.repeat(50));
    if (problematicItems.length === 0 && missingExpectedItems.length === 0) {
      console.log('✅ TEST PASSED: Admin menu is correctly configured');
    } else {
      console.log('❌ TEST FAILED: Admin menu has issues');
      if (problematicItems.length > 0) {
        console.log('   - Has unauthorized email menu items');
      }
      if (missingExpectedItems.length > 0) {
        console.log('   - Missing expected admin menu items');
      }
    }
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('📸 Error screenshot saved as error-screenshot.png');
  } finally {
    await browser.close();
    console.log('\n🔚 Test completed');
  }
})();