const http = require('http');

function makeRequest(data, path, method = 'POST', description) {
  console.log(`\n=== ${description} ===`);
  
  const options = {
    hostname: 'localhost',
    port: 8800,
    path: path,
    method: method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (data && method === 'POST') {
    options.headers['Content-Length'] = data.length;
  }

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

    if (data && method === 'POST') {
      req.write(data);
    }
    req.end();
  });
}

async function testCompleteFlow() {
  try {
    console.log('='.repeat(60));
    console.log('COMPLETE INVENTORY-BASED ORDER FLOW TEST');
    console.log('='.repeat(60));
    
    // Step 1: Create inventory products
    console.log('\nStep 1: Creating inventory products...');
    
    const product1Data = JSON.stringify({
      inventoryId: "682ec3cd69f35b3e62b6122f", // Replace with actual inventory ID
      bail_number: "BAIL001",
      bail_date: "2025-05-22",
      design_code: "COTTON_PREMIUM",
      category_code: "TEXTILES",
      lot_number: "LOT001",
      stock_amount: 100,
      price: 50
    });

    const product2Data = JSON.stringify({
      inventoryId: "682ec3cd69f35b3e62b6122f", // Replace with actual inventory ID
      bail_number: "BAIL002", 
      bail_date: "2025-05-22",
      design_code: "SILK_LUXURY",
      category_code: "TEXTILES",
      lot_number: "LOT002",
      stock_amount: 50,
      price: 120
    });

    console.log('\nNOTE: This test requires an actual inventory ID.');
    console.log('Please replace the inventoryId in the test data with a real inventory ID from your database.');
    console.log('\nTo get an inventory ID, you can:');
    console.log('1. Check your database directly');
    console.log('2. Create an inventory first using the inventory API');
    console.log('3. Use an existing inventory ID from your system');
    
    // Try to create products (will likely fail without proper inventory ID)
    const product1Response = await makeRequest(
      product1Data,
      '/api/inventory/products',
      'POST',
      'Creating Inventory Product 1 (Cotton Premium)'
    );

    if (product1Response && product1Response.product) {
      const product2Response = await makeRequest(
        product2Data,
        '/api/inventory/products',
        'POST',
        'Creating Inventory Product 2 (Silk Luxury)'
      );

      if (product2Response && product2Response.product) {
        // Step 2: Create order using the inventory products
        console.log('\nStep 2: Creating order with inventory products...');
        
        const orderData = JSON.stringify({
          products: [
            {
              inventoryProductId: product1Response.product._id,
              quantity: 10,
              unitPrice: 55 // Override price
            },
            {
              inventoryProductId: product2Response.product._id,
              quantity: 5
              // Use price from inventory product (120)
            }
          ],
          clientId: "682ec3cd69f35b3e62b6122e", // Replace with actual client ID
          paymentDueDate: "2025-06-01"
        });

        const orderResponse = await makeRequest(
          orderData,
          '/api/orders/test/create',
          'POST',
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
          
          // Step 3: Make a payment
          console.log('\nStep 3: Making a payment...');
          
          const paymentData = JSON.stringify({
            orderId: order._id,
            amount: 300,
            paymentMethod: "cash",
            notes: "Partial payment for inventory order"
          });

          const paymentResponse = await makeRequest(
            paymentData,
            '/api/payments/test/create',
            'POST',
            'Making Payment for Order'
          );

          if (paymentResponse && paymentResponse.payment) {
            console.log('\n' + '='.repeat(40));
            console.log('PAYMENT RECORDED SUCCESSFULLY!');
            console.log('='.repeat(40));
            console.log(`Payment Amount: ₹${paymentResponse.payment.amount}`);
            console.log(`Order Payment Status: ${paymentResponse.orderPaymentStatus.paymentStatus}`);
            console.log(`Remaining Due: ₹${paymentResponse.orderPaymentStatus.dueAmount}`);
          }
        }
      }
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the complete flow test
testCompleteFlow();
