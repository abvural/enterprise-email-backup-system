const { chromium } = require('playwright');

(async () => {
  console.log('🔒 Quick Security Test...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newContext().then(c => c.newPage());
  
  // Enable console logs
  page.on('console', (msg) => {
    if (msg.text().includes('SECURITY') || msg.text().includes('🔐') || msg.text().includes('❌') || msg.text().includes('✅')) {
      console.log('Browser Console:', msg.text());
    }
  });
  
  try {
    // Login as admin
    await page.goto('http://localhost:5173');
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', 'admin@emailbackup.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button:has-text("Sign in")');
    await page.waitForLoadState('networkidle');
    
    console.log('\n🔐 Testing admin access to forbidden pages...');
    
    // Test direct navigation to /accounts
    console.log('Testing /accounts...');
    await page.goto('http://localhost:5173/accounts');
    await page.waitForTimeout(3000);
    
    const accountsUrl = page.url();
    const accountsContent = await page.textContent('body').catch(() => '');
    
    if (accountsContent.includes('SECURITY VIOLATION') || accountsContent.includes('Access Denied')) {
      console.log('✅ /accounts correctly blocked for admin');
    } else {
      console.log('❌ /accounts accessible by admin - SECURITY ISSUE');
    }
    
    // Test direct navigation to /emails
    console.log('Testing /emails...');
    await page.goto('http://localhost:5173/emails');
    await page.waitForTimeout(3000);
    
    const emailsUrl = page.url();
    const emailsContent = await page.textContent('body').catch(() => '');
    
    if (emailsContent.includes('SECURITY VIOLATION') || emailsContent.includes('Access Denied')) {
      console.log('✅ /emails correctly blocked for admin');
    } else {
      console.log('❌ /emails accessible by admin - SECURITY ISSUE');
    }
    
    console.log(`\nFinal URLs: accounts=${accountsUrl}, emails=${emailsUrl}`);
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
})();