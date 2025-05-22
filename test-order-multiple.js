const http = require('http');

// Test data for multiple products order
const multipleProductsData = JSON.stringify({
  products: [
    {
      productName: "Cotton Fabric",
      category: "Textiles",
      quantity: 100
    },
    {
      productName: "Silk Fabric",
      category: "Textiles", 
      quantity: 50
    },
    {
      productName: "Wool Fabric",
      category: "Textiles",
      quantity: 75
    }
  ],
  clientId: "682ec3cd69f35b3e62b6122e"
});

// Test data for single product order (legacy format)
const singleProductData = JSON.stringify({
  productName: "Cotton Fabric",
  category: "Textiles", 
  quantity: 100,
  clientId: "682ec3cd69f35b3e62b6122e"
});

function makeRequest(data, path, description) {
  console.log(`\n=== ${description} ===`);
  
  const options = {
    hostname: 'localhost',
    port: 8800,
    path: path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    
    res.on('end', () => {
      console.log('Response body:');
      try {
        const jsonResponse = JSON.parse(body);
        console.log(JSON.stringify(jsonResponse, null, 2));
      } catch (e) {
        console.log(body);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.write(data);
  req.end();
}

// Test multiple products
makeRequest(multipleProductsData, '/api/orders/test/create-multiple', 'Testing Multiple Products Order');

// Wait a bit then test single product for comparison
setTimeout(() => {
  makeRequest(singleProductData, '/api/orders/test/create', 'Testing Single Product Order (Legacy)');
}, 2000);

// Test single product using new endpoint
setTimeout(() => {
  makeRequest(singleProductData, '/api/orders/test/create-multiple', 'Testing Single Product on Multiple Products Endpoint');
}, 4000);
