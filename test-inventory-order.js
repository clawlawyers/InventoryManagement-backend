const http = require('http');

// Test data for order using inventory products
// Note: You'll need to replace these with actual inventory product IDs from your database
const inventoryOrderData = JSON.stringify({
  products: [
    {
      inventoryProductId: "682ec3cd69f35b3e62b6122f", // Replace with actual inventory product ID
      quantity: 10,
      unitPrice: 50 // Optional: override the price from inventory
    },
    {
      inventoryProductId: "682ec3cd69f35b3e62b61230", // Replace with actual inventory product ID  
      quantity: 5
      // unitPrice not provided, will use price from inventory product
    }
  ],
  clientId: "682ec3cd69f35b3e62b6122e", // Replace with actual client ID
  paymentDueDate: "2025-06-01"
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

    req.write(data);
    req.end();
  });
}

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

async function testInventoryOrder() {
  try {
    console.log('='.repeat(60));
    console.log('TESTING INVENTORY-BASED ORDER SYSTEM');
    console.log('='.repeat(60));
    
    console.log('\nNOTE: This test requires actual inventory product IDs from your database.');
    console.log('Please update the inventoryProductId values in the test data with real IDs.');
    console.log('\nTo get inventory product IDs, you can:');
    console.log('1. Check your database directly');
    console.log('2. Use the inventory API endpoints');
    console.log('3. Create inventory products first if none exist');
    
    // Test creating order with inventory products
    const orderResponse = await makeRequest(
      inventoryOrderData,
      '/api/orders/test/create',
      'Creating Order with Inventory Products'
    );

    if (orderResponse && orderResponse.order) {
      console.log('\n' + '='.repeat(40));
      console.log('ORDER CREATED SUCCESSFULLY!');
      console.log('='.repeat(40));
      
      const order = orderResponse.order;
      console.log(`Order ID: ${order._id}`);
      console.log(`Total Amount: ₹${order.totalAmount}`);
      console.log(`Payment Status: ${order.paymentStatus}`);
      console.log(`Products Count: ${order.products.length}`);
      
      if (order.products && order.products.length > 0) {
        console.log('\nProducts in Order:');
        order.products.forEach((product, index) => {
          console.log(`  ${index + 1}. Quantity: ${product.quantity}, Unit Price: ₹${product.unitPrice}, Total: ₹${product.totalPrice}`);
          if (product.inventoryProduct) {
            console.log(`     Bail Number: ${product.inventoryProduct.bail_number}`);
            console.log(`     Design Code: ${product.inventoryProduct.design_code}`);
            console.log(`     Remaining Stock: ${product.inventoryProduct.stock_amount}`);
          }
        });
      }
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testInventoryOrder();
