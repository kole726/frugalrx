const puppeteer = require('puppeteer');

async function testClientRendering() {
  console.log('Testing client-side rendering of the drug page...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => console.log(`Browser console: ${msg.text()}`));
    
    // Capture network requests
    page.on('request', request => {
      if (request.url().includes('/api/drugs/')) {
        console.log(`Network request: ${request.method()} ${request.url()}`);
      }
    });
    
    // Capture network responses with detailed logging
    page.on('response', async response => {
      if (response.url().includes('/api/drugs/')) {
        console.log(`Network response: ${response.status()} ${response.url()}`);
        try {
          const responseBody = await response.json();
          console.log('Response data:', JSON.stringify(responseBody).substring(0, 200) + '...');
          
          // Check if using mock data
          if (responseBody.usingMockData) {
            console.log('⚠️ API RESPONSE IS USING MOCK DATA ⚠️');
          }
          
          // Log pharmacy count if available
          if (responseBody.pharmacies) {
            console.log(`Pharmacy count: ${responseBody.pharmacies.length}`);
            console.log(`First pharmacy: ${JSON.stringify(responseBody.pharmacies[0])}`);
          }
        } catch (e) {
          console.log('Could not parse response as JSON');
        }
      }
    });
    
    // Navigate to the drug page
    const url = 'https://frugalrx-h0ncxy9uw-kole726s-projects.vercel.app/drug/tylenol';
    console.log(`Navigating to ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    console.log('Page loaded, checking content...');
    
    // Wait for client-side rendering to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Take a screenshot
    await page.screenshot({ path: 'drug-page-client.png' });
    console.log('Screenshot saved to drug-page-client.png');
    
    // Check for environment variables in the page
    const envVars = await page.evaluate(() => {
      // Try to access environment variables from window object
      const env = {};
      
      // Check for Next.js data
      if (window.__NEXT_DATA__) {
        console.log('Found Next.js data');
        env.nextData = true;
        
        // Check for runtime config
        if (window.__NEXT_DATA__.runtimeConfig) {
          env.runtimeConfig = Object.keys(window.__NEXT_DATA__.runtimeConfig);
        }
        
        // Check for build ID
        if (window.__NEXT_DATA__.buildId) {
          env.buildId = window.__NEXT_DATA__.buildId;
        }
      }
      
      // Check for specific environment variables
      env.useMockData = window.useMockData;
      env.useRealApi = window.useRealApi;
      env.apiBaseUrl = window.apiBaseUrl;
      
      return env;
    });
    
    console.log('Environment variables in client:', envVars);
    
    // Check for pharmacy prices section
    const hasPharmacyPrices = await page.evaluate(() => {
      return document.body.innerHTML.includes('Pharmacy Prices');
    });
    console.log(`Has pharmacy prices section: ${hasPharmacyPrices}`);
    
    // Check for brand variations section
    const hasBrandVariations = await page.evaluate(() => {
      return document.body.innerHTML.includes('Brand/Generic Variations');
    });
    console.log(`Has brand variations section: ${hasBrandVariations}`);
    
    // Check for pharmacy list
    const pharmacyList = await page.evaluate(() => {
      // Try multiple selectors to find pharmacy elements
      const pharmacyElements = Array.from(document.querySelectorAll('[data-pharmacy-id]'));
      console.log('Found pharmacy elements by data-pharmacy-id:', pharmacyElements.length);
      
      if (pharmacyElements.length === 0) {
        // Try alternative selectors
        const priceElements = Array.from(document.querySelectorAll('.bg-emerald-50, .bg-emerald-100'));
        console.log('Found price elements:', priceElements.length);
        
        // Try to find elements with price text
        const priceTextElements = Array.from(document.querySelectorAll('div')).filter(
          el => el.textContent && el.textContent.includes('$') && 
               (el.textContent.includes('.') || el.textContent.match(/\$\d+/))
        );
        console.log('Found elements with price text:', priceTextElements.length);
        
        return priceTextElements.map(el => el.textContent.trim());
      }
      
      return pharmacyElements.map(el => el.textContent).filter(text => text && text.includes('$'));
    });
    
    console.log(`Found ${pharmacyList.length} pharmacy elements with prices`);
    if (pharmacyList.length > 0) {
      console.log('First few pharmacies:', pharmacyList.slice(0, 3));
    }
    
    // Check for fallback UI elements
    const hasFallbackUI = await page.evaluate(() => {
      const noPharmacyPrices = document.body.innerHTML.includes('No Pharmacy Prices Found');
      const noBrandVariations = document.body.innerHTML.includes('No Brand Variations Found');
      return { noPharmacyPrices, noBrandVariations };
    });
    console.log(`Fallback UI elements:`, hasFallbackUI);
    
    // Wait a bit longer to see if anything changes
    console.log('Waiting 10 more seconds to see if anything changes...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Take another screenshot
    await page.screenshot({ path: 'drug-page-client-final.png' });
    console.log('Final screenshot saved to drug-page-client-final.png');
    
    // Check again for pharmacy prices section
    const nowHasPharmacyPrices = await page.evaluate(() => {
      return document.body.innerHTML.includes('Pharmacy Prices');
    });
    console.log(`Now has pharmacy prices section: ${nowHasPharmacyPrices}`);
    
    // Check again for pharmacy list with more detailed logging
    const finalPharmacyList = await page.evaluate(() => {
      // Log the entire HTML to help debug
      console.log('Page HTML structure:', document.body.innerHTML.substring(0, 500) + '...');
      
      // Try multiple selectors to find pharmacy elements
      const pharmacyElements = Array.from(document.querySelectorAll('[data-pharmacy-id]'));
      console.log('Found pharmacy elements by data-pharmacy-id:', pharmacyElements.length);
      
      if (pharmacyElements.length === 0) {
        // Try alternative selectors
        const priceElements = Array.from(document.querySelectorAll('.bg-emerald-50, .bg-emerald-100'));
        console.log('Found price elements:', priceElements.length);
        
        // Try to find elements with price text
        const priceTextElements = Array.from(document.querySelectorAll('div')).filter(
          el => el.textContent && el.textContent.includes('$') && 
               (el.textContent.includes('.') || el.textContent.match(/\$\d+/))
        );
        console.log('Found elements with price text:', priceTextElements.length);
        
        return priceTextElements.map(el => el.textContent.trim());
      }
      
      return pharmacyElements.map(el => el.textContent).filter(text => text && text.includes('$'));
    });
    
    console.log(`Finally found ${finalPharmacyList.length} pharmacy elements with prices`);
    if (finalPharmacyList.length > 0) {
      console.log('First few pharmacies:', finalPharmacyList.slice(0, 3));
    }
    
  } catch (error) {
    console.error('Error during client rendering test:', error);
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
}

// Install Puppeteer if not already installed
const { execSync } = require('child_process');
try {
  require.resolve('puppeteer');
  console.log('Puppeteer is already installed');
} catch (e) {
  console.log('Installing Puppeteer...');
  execSync('npm install puppeteer', { stdio: 'inherit' });
}

testClientRendering(); 