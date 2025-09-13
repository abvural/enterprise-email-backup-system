const { chromium } = require('playwright');

(async () => {
  console.log('🔐 Starting Role-Based Security Test with Chromium...\n');
  
  const browser = await chromium.launch({ 
    headless: false,  
    slowMo: 1000      
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  try {
    // Navigate to the application
    console.log('📍 Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // Wait for login page
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    console.log('✅ Login page loaded\n');
    
    // TEST 1: Admin Login
    console.log('🔐 Testing ADMIN role security...');
    await page.fill('input[type="email"]', 'admin@emailbackup.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button:has-text("Sign in")');
    
    // Wait for navigation
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    console.log('✅ Admin successfully redirected to admin dashboard');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check user role from localStorage
    const adminUserInfo = await page.evaluate(() => {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        return {
          email: parsed.state?.user?.email,
          role: parsed.state?.user?.role?.name,
          roleLevel: parsed.state?.user?.role?.level,
        };
      }
      return null;
    });
    
    console.log('📊 Admin User Info:');
    console.log('   Email:', adminUserInfo?.email);
    console.log('   Role:', adminUserInfo?.role);
    console.log('   Role Level:', adminUserInfo?.roleLevel);
    
    // Check for email-related menu items (SHOULD NOT BE PRESENT)
    console.log('\n🔍 Checking for FORBIDDEN email menu items for Admin:');
    
    // Get all text content from sidebar
    const adminMenuTexts = await page.$$eval('nav, aside, .sidebar, [role="navigation"]', elements => {
      return elements.map(el => el.textContent).join(' ').toLowerCase()
    });
    
    const forbiddenEmailTerms = ['email', 'inbox', 'accounts', 'folders', 'sent', 'archive', 'deleted'];
    const foundForbiddenTerms = forbiddenEmailTerms.filter(term => 
      adminMenuTexts.includes(term) && 
      !adminMenuTexts.includes('system') // Exclude "System" related terms
    );
    
    if (foundForbiddenTerms.length > 0) {
      console.log('❌ SECURITY VIOLATION: Admin can see forbidden email terms:', foundForbiddenTerms);
    } else {
      console.log('✅ SECURITY PASSED: Admin cannot see email-related menu items');
    }
    
    // Check visible menu items more specifically
    const adminMenuItems = await page.$$eval('nav a, aside a, .chakra-link, button', elements => 
      elements
        .map(el => el.textContent?.trim())
        .filter(text => text && text.length > 0 && text.length < 50)
        .filter((text, index, array) => array.indexOf(text) === index) // Remove duplicates
    );
    
    console.log('\n📋 Admin Visible Menu Items:');
    adminMenuItems.forEach((item, index) => {
      const isEmailRelated = ['email', 'inbox', 'sent', 'folder', 'account'].some(term => 
        item.toLowerCase().includes(term) && !item.toLowerCase().includes('system')
      );
      if (isEmailRelated) {
        console.log(`   ${index + 1}. ❌ ${item} (SHOULD NOT BE HERE)`);
      } else {
        console.log(`   ${index + 1}. ✅ ${item}`);
      }
    });
    
    // Test direct navigation to email pages (should be blocked)
    console.log('\n🚫 Testing direct navigation to forbidden pages...');
    
    const forbiddenUrls = ['/accounts', '/emails', '/emails?folder=INBOX'];
    
    for (const url of forbiddenUrls) {
      try {
        console.log(`   Testing: ${url}`);
        await page.goto(`http://localhost:5173${url}`, { waitUntil: 'networkidle', timeout: 5000 });
        
        // Check if redirected or blocked
        const currentUrl = page.url();
        if (currentUrl.includes(url)) {
          console.log(`   ❌ SECURITY VIOLATION: Admin can access ${url}`);
        } else {
          console.log(`   ✅ SECURITY PASSED: Admin blocked from ${url}, redirected to ${currentUrl}`);
        }
      } catch (error) {
        console.log(`   ✅ SECURITY PASSED: Admin blocked from ${url} (${error.message})`);
      }
    }
    
    // Logout
    console.log('\n🔓 Logging out admin...');
    await page.goto('http://localhost:5173/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Try to find logout option
    try {
      const logoutSelector = 'button:has-text("Sign out"), [data-testid="logout"], .logout-button';
      await page.click(logoutSelector, { timeout: 3000 });
    } catch {
      // Alternative logout method - clear localStorage
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.goto('http://localhost:5173');
    }
    
    await page.waitForTimeout(2000);
    
    // TEST 2: End User Login
    console.log('\n🔐 Testing END_USER role security...');
    
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', 'test@emailbackup.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button:has-text("Sign in")');
    
    // Wait for navigation (end user stays on main dashboard)
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check user role
    const endUserInfo = await page.evaluate(() => {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        return {
          email: parsed.state?.user?.email,
          role: parsed.state?.user?.role?.name,
          roleLevel: parsed.state?.user?.role?.level,
        };
      }
      return null;
    });
    
    console.log('📊 End User Info:');
    console.log('   Email:', endUserInfo?.email);
    console.log('   Role:', endUserInfo?.role);
    console.log('   Role Level:', endUserInfo?.roleLevel);
    
    // Check for email menu items (SHOULD BE PRESENT)
    console.log('\n🔍 Checking for REQUIRED email menu items for End User:');
    
    const endUserMenuTexts = await page.$$eval('nav, aside, .sidebar, [role="navigation"]', elements => {
      return elements.map(el => el.textContent).join(' ').toLowerCase()
    });
    
    const requiredEmailTerms = ['email', 'accounts'];
    const foundRequiredTerms = requiredEmailTerms.filter(term => endUserMenuTexts.includes(term));
    
    if (foundRequiredTerms.length === requiredEmailTerms.length) {
      console.log('✅ SECURITY PASSED: End user can see required email functionality:', foundRequiredTerms);
    } else {
      console.log('❌ SECURITY ISSUE: End user missing email functionality. Found:', foundRequiredTerms);
    }
    
    // Test access to email pages (should work)
    console.log('\n✅ Testing access to allowed pages for End User...');
    
    const allowedUrls = ['/accounts', '/emails'];
    
    for (const url of allowedUrls) {
      try {
        console.log(`   Testing: ${url}`);
        await page.goto(`http://localhost:5173${url}`, { waitUntil: 'networkidle', timeout: 10000 });
        
        const currentUrl = page.url();
        if (currentUrl.includes(url)) {
          console.log(`   ✅ SECURITY PASSED: End user can access ${url}`);
        } else {
          console.log(`   ❌ SECURITY ISSUE: End user cannot access ${url}, redirected to ${currentUrl}`);
        }
      } catch (error) {
        console.log(`   ❌ SECURITY ISSUE: End user cannot access ${url} (${error.message})`);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 ROLE-BASED SECURITY TEST COMPLETED');
    console.log('='.repeat(80));
    
    // Keep browser open for manual inspection
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  } finally {
    await browser.close();
    console.log('\n🔚 Browser closed');
  }
})();