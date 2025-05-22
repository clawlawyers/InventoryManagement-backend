const http = require('http');

const data = JSON.stringify({
  productName: "Cotton Fabric",
  category: "Textiles", 
  quantity: 100,
  clientId: "682ec3cd69f35b3e62b6122e"
});

const options = {
  hostname: 'localhost',
  port: 8800,
  path: '/api/orders/test/create',
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
