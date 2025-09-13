const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting admin login with Chromium...\n');
  
  const browser = await chromium.launch({ 
    headless: false,  // Görünür modda açılacak
    slowMo: 1000      // İşlemleri yavaşlatarak görünür yapacak
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
    
    // Fill login credentials
    console.log('🔐 Entering admin credentials...');
    await page.fill('input[type="email"]', 'admin@emailbackup.com');
    await page.fill('input[type="password"]', 'Admin123!');
    
    // Take screenshot before login
    await page.screenshot({ path: 'before-login.png' });
    console.log('📸 Screenshot saved: before-login.png');
    
    // Click login button
    console.log('🔘 Clicking Sign in button...');
    await page.click('button:has-text("Sign in")');
    
    // Wait for navigation
    console.log('⏳ Waiting for dashboard redirect...');
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    console.log('✅ Successfully redirected to admin dashboard!\n');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Get current URL
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    // Check user info from localStorage
    const userInfo = await page.evaluate(() => {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        return {
          email: parsed.state?.user?.email,
          role: parsed.state?.user?.role?.name,
          roleLevel: parsed.state?.user?.role?.level,
          organizationType: parsed.state?.user?.primary_org?.type
        };
      }
      return null;
    });
    
    console.log('\n📊 Logged in User Info:');
    console.log('   Email:', userInfo?.email);
    console.log('   Role:', userInfo?.role);
    console.log('   Role Level:', userInfo?.roleLevel);
    console.log('   Organization Type:', userInfo?.organizationType);
    
    // Check visible menu items
    console.log('\n🔍 Checking visible menu items:');
    const menuItems = await page.$$eval('nav a, aside a, .chakra-link', elements => 
      elements.map(el => el.textContent?.trim()).filter(text => text && text.length > 0)
    );
    
    console.log('📋 Sidebar Menu Items:');
    menuItems.forEach(item => {
      if (item.toLowerCase().includes('email') || 
          item.toLowerCase().includes('inbox') || 
          item.toLowerCase().includes('folder')) {
        console.log(`   ❌ ${item} (SHOULD NOT BE HERE)`);
      } else {
        console.log(`   ✅ ${item}`);
      }
    });
    
    // Check dashboard content
    const dashboardTitle = await page.textContent('h1, h2', { timeout: 5000 }).catch(() => null);
    console.log('\n📄 Dashboard Title:', dashboardTitle || 'Not found');
    
    // Take final screenshot
    await page.screenshot({ path: 'admin-dashboard.png', fullPage: true });
    console.log('\n📸 Dashboard screenshot saved: admin-dashboard.png');
    
    // Keep browser open for manual inspection
    console.log('\n✅ Login successful! Browser will stay open for 30 seconds...');
    console.log('   You can interact with the application manually.');
    
    await page.waitForTimeout(30000); // Keep open for 30 seconds
    
  } catch (error) {
    console.error('❌ Error during login:', error.message);
    await page.screenshot({ path: 'error-state.png' });
    console.log('📸 Error screenshot saved: error-state.png');
  } finally {
    await browser.close();
    console.log('\n🔚 Browser closed');
  }
})();