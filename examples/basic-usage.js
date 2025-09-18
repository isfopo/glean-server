/**
 * Basic usage example for the Gleam ATproto Server
 * 
 * This script demonstrates:
 * 1. Creating a user account
 * 2. Logging in
 * 3. Creating an item with a mock photo
 * 4. Querying items by location
 * 5. Getting user profile information
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

// Mock image data for demo (1x1 pixel PNG)
const mockImageBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 
  'base64'
);

async function createFormData(fields, files) {
  const FormData = require('form-data');
  const form = new FormData();
  
  // Add text fields
  for (const [key, value] of Object.entries(fields)) {
    form.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
  }
  
  // Add files
  for (const [key, buffer] of Object.entries(files || {})) {
    form.append(key, buffer, 'demo-image.png');
  }
  
  return form;
}

async function makeRequest(endpoint, options = {}) {
  const fetch = require('node-fetch');
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`${response.status}: ${data.error || 'Request failed'}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Request to ${endpoint} failed:`, error.message);
    throw error;
  }
}

async function runExample() {
  try {
    console.log('🚀 Starting Gleam ATproto Server Example\n');

    // 1. Create a user account
    console.log('1. Creating user account...');
    const accountData = await makeRequest('/api/auth/createAccount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle: 'demo.user',
        password: 'demo_password',
        email: 'demo@example.com',
        profile: {
          displayName: 'Demo User',
          description: 'A demonstration user for the Gleam platform'
        }
      })
    });
    
    console.log(`✅ Account created for ${accountData.handle}`);
    console.log(`   DID: ${accountData.did}`);
    const accessToken = accountData.accessJwt;

    // 2. Create an item with photo and location
    console.log('\n2. Creating an item...');
    
    const itemForm = await createFormData(
      {
        geomarker: {
          lat: 37.7749,
          lng: -122.4194,
          accuracy: 10
        },
        title: 'Golden Gate Bridge Photo',
        description: 'A beautiful photo of the Golden Gate Bridge taken from Crissy Field'
      },
      {
        photo: mockImageBuffer
      }
    );
    
    const itemData = await makeRequest('/api/items', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        ...itemForm.getHeaders()
      },
      body: itemForm
    });
    
    console.log(`✅ Item created with ID: ${itemData.id}`);
    console.log(`   Title: ${itemData.title}`);
    console.log(`   Location: ${itemData.geomarker.lat}, ${itemData.geomarker.lng}`);

    // 3. Query items by location
    console.log('\n3. Querying items by location...');
    const nearbyItems = await makeRequest(
      `/api/items/location?lat=37.7749&lng=-122.4194&radius=10`
    );
    
    console.log(`✅ Found ${nearbyItems.length} items within 10km`);

    // 4. Get all items
    console.log('\n4. Getting all items...');
    const allItems = await makeRequest('/api/items');
    console.log(`✅ Total items in database: ${allItems.length}`);

    // 5. Get user profile
    console.log('\n5. Getting user profile...');
    const userProfile = await makeRequest(`/api/users/${accountData.handle}`);
    console.log(`✅ User profile retrieved:`);
    console.log(`   Display Name: ${userProfile.profile?.displayName || 'Not set'}`);
    console.log(`   Handle: ${userProfile.handle}`);

    // 6. Update user profile
    console.log('\n6. Updating user profile...');
    
    const profileForm = await createFormData(
      {
        displayName: 'Updated Demo User',
        description: 'An updated description for the demo user'
      }
    );
    
    const updatedProfile = await makeRequest('/api/users/profile', {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        ...profileForm.getHeaders()
      },
      body: profileForm
    });
    
    console.log(`✅ Profile updated:`);
    console.log(`   New Display Name: ${updatedProfile.profile.displayName}`);

    // 7. Get session info
    console.log('\n7. Getting session info...');
    const sessionInfo = await makeRequest('/api/auth/getSession', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    console.log(`✅ Session valid for user: ${sessionInfo.handle}`);

    console.log('\n🎉 Example completed successfully!');
    console.log('\nTo explore more:');
    console.log('- Check the server logs for detailed request information');
    console.log('- Visit http://localhost:3000/health for server status');
    console.log('- Try the API endpoints with tools like Postman or curl');

  } catch (error) {
    console.error('\n❌ Example failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('- Make sure the server is running: npm run dev');
    console.log('- Check that port 3000 is available');
    console.log('- Verify all dependencies are installed: npm install');
  }
}

// Check if required dependencies are available
async function checkDependencies() {
  try {
    require('node-fetch');
    require('form-data');
    return true;
  } catch (error) {
    console.log('Installing required dependencies for example...');
    const { execSync } = require('child_process');
    execSync('npm install node-fetch form-data', { stdio: 'inherit' });
    return true;
  }
}

// Run the example
if (require.main === module) {
  checkDependencies()
    .then(() => runExample())
    .catch(error => {
      console.error('Failed to run example:', error.message);
      process.exit(1);
    });
}

module.exports = { runExample };