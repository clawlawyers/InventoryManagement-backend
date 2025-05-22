const http = require('http');

// Test data for order with pricing
const orderWithPricingData = JSON.stringify({
  products: [
    {
      productName: "Cotton Fabric",
      category: "Textiles",
      quantity: 100,
      unitPrice: 50 // ₹50 per unit
    },
    {
      productName: "Silk Fabric",
      category: "Textiles", 
      quantity: 50,
      unitPrice: 120 // ₹120 per unit
    }
  ],
  clientId: "682ec3cd69f35b3e62b6122e",
  paymentDueDate: "2025-06-01" // Due date for payment
});

// Test data for single product with pricing (legacy format)
const singleProductWithPricingData = JSON.stringify({
  productName: "Wool Fabric",
  category: "Textiles", 
  quantity: 75,
  unitPrice: 80, // ₹80 per unit
  clientId: "682ec3cd69f35b3e62b6122e",
  paymentDueDate: "2025-06-15"
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

function makePayment(orderId, amount, description) {
  console.log(`\n=== ${description} ===`);
  
  const paymentData = JSON.stringify({
    orderId: orderId,
    amount: amount,
    paymentMethod: "cash",
    notes: "Partial payment received"
  });

  const options = {
    hostname: 'localhost',
    port: 8800,
    path: '/api/payments/test/create',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': paymentData.length
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

    req.write(paymentData);
    req.end();
  });
}

async function runTests() {
  try {
    // Test 1: Create order with multiple products and pricing
    const multipleProductOrder = await makeRequest(
      orderWithPricingData, 
      '/api/orders/test/create-multiple', 
      'Creating Order with Multiple Products and Pricing'
    );

    if (multipleProductOrder && multipleProductOrder.order) {
      const orderId = multipleProductOrder.order._id;
      const totalAmount = multipleProductOrder.paymentSummary.totalAmount;
      
      console.log(`\nOrder created with ID: ${orderId}`);
      console.log(`Total Amount: ₹${totalAmount}`);
      
      // Test 2: Make partial payment
      await new Promise(resolve => setTimeout(resolve, 1000));
      const partialPayment = await makePayment(
        orderId, 
        3000, 
        `Making Partial Payment of ₹3000 (out of ₹${totalAmount})`
      );
      
      // Test 3: Make another partial payment
      await new Promise(resolve => setTimeout(resolve, 1000));
      const secondPayment = await makePayment(
        orderId, 
        2000, 
        'Making Second Partial Payment of ₹2000'
      );
      
      // Test 4: Make final payment
      await new Promise(resolve => setTimeout(resolve, 1000));
      const finalPayment = await makePayment(
        orderId, 
        6000, 
        'Making Final Payment of ₹6000'
      );
    }

    // Test 5: Create single product order with pricing
    await new Promise(resolve => setTimeout(resolve, 2000));
    const singleProductOrder = await makeRequest(
      singleProductWithPricingData, 
      '/api/orders/test/create', 
      'Creating Single Product Order with Pricing'
    );

    if (singleProductOrder && singleProductOrder.order) {
      const orderId = singleProductOrder.order._id;
      const totalAmount = singleProductOrder.paymentSummary.totalAmount;
      
      console.log(`\nSingle product order created with ID: ${orderId}`);
      console.log(`Total Amount: ₹${totalAmount}`);
      
      // Test 6: Make full payment
      await new Promise(resolve => setTimeout(resolve, 1000));
      const fullPayment = await makePayment(
        orderId, 
        totalAmount, 
        `Making Full Payment of ₹${totalAmount}`
      );
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the tests
runTests();
