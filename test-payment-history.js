const http = require('http');

function makeGetRequest(path, description) {
  console.log(`\n=== ${description} ===`);
  
  const options = {
    hostname: 'localhost',
    port: 8800,
    path: path,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        console.log('Response body:');
        try {
          const jsonResponse = JSON.parse(body);
          console.log(JSON.stringify(jsonResponse, null, 2));
          resolve(jsonResponse);
        } catch (e) {
          console.log(body);
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      console.error(`Problem with request: ${e.message}`);
      reject(e);
    });

    req.end();
  });
}

async function testPaymentHistory() {
  try {
    // Test getting payment history for a specific order
    // Using the order ID from the previous test
    const orderId = "682f1489134376677868db9e"; // Replace with actual order ID
    
    await makeGetRequest(
      `/api/payments/order/${orderId}`, 
      `Getting Payment History for Order ${orderId}`
    );

    // Test getting all payments
    await new Promise(resolve => setTimeout(resolve, 1000));
    await makeGetRequest(
      '/api/payments/', 
      'Getting All Payments'
    );

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Note: This test requires authentication, so it will fail with 401
// But it demonstrates the API endpoints
console.log('Note: These endpoints require authentication and will return 401 Unauthorized');
console.log('In a real application, you would include authentication headers');

testPaymentHistory();
