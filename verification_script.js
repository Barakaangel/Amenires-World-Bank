const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Test Home Page
  await page.goto('http://localhost:3000');
  await page.screenshot({ path: '/home/jules/verification/home_page.png' });
  console.log('Home page screenshot saved.');

  // Test Login Page
  await page.goto('http://localhost:3000/login.html');
  await page.screenshot({ path: '/home/jules/verification/login_page.png' });
  console.log('Login page screenshot saved.');

  // Test Signup Page
  await page.goto('http://localhost:3000/signup.html');
  await page.screenshot({ path: '/home/jules/verification/signup_page.png' });
  console.log('Signup page screenshot saved.');

  await browser.close();
})();
