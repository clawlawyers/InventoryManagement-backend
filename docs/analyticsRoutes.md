# Analytics Routes Documentation

## Base URL
```
/api/sales-analytics
```

## Authentication
All routes require authentication. Include the auth token in the request header:
```
Authorization: Bearer <your_token>
```

## Routes

### 1. Get Product Sales Analytics
Get detailed sales analytics for a specific product.

**Endpoint:** `GET /product`

**Query Parameters:**
- `productId` (required): ID of the product
- `companyId` (required): ID of the company
- `startDate` (optional): Start date for filtering (YYYY-MM-DD)
- `endDate` (optional): End date for filtering (YYYY-MM-DD)

**Example Request:**
```javascript
// Frontend code
const response = await axios.get('/api/sales-analytics/product', {
  params: {
    productId: '123',
    companyId: '456',
    startDate: '2024-01-01',
    endDate: '2024-03-31'
  }
});
```

**Response:**
```javascript
{
  "message": "Sales analytics retrieved successfully",
  "salesData": [
    {
      "date": "2024-01-15T00:00:00.000Z",
      "totalQuantity": 50,
      "totalAmount": 2500,
      "averagePrice": 50,
      "orderCount": 2
    }
    // ... more daily data
  ],
  "totals": {
    "totalQuantity": 200,
    "totalAmount": 10000,
    "totalOrders": 5
  }
}
```

### 2. Get All Products Sales Analytics
Get sales analytics for all products in a company.

**Endpoint:** `GET /all`

**Query Parameters:**
- `companyId` (required): ID of the company
- `startDate` (optional): Start date for filtering (YYYY-MM-DD)
- `endDate` (optional): End date for filtering (YYYY-MM-DD)

**Example Request:**
```javascript
const response = await axios.get('/api/sales-analytics/all', {
  params: {
    companyId: '456',
    startDate: '2024-01-01',
    endDate: '2024-03-31'
  }
});
```

**Response:**
```javascript
{
  "message": "Sales analytics retrieved successfully",
  "salesData": [
    {
      "_id": "123",
      "totalQuantity": 100,
      "totalAmount": 5000,
      "averagePrice": 50,
      "orderCount": 3,
      "productDetails": {
        "bail_number": "BAIL001",
        "design_code": "DESIGN001",
        "category_code": "CAT001"
      }
    }
    // ... more products
  ],
  "totals": {
    "totalQuantity": 500,
    "totalAmount": 25000,
    "totalOrders": 15
  }
}
```

### 3. Get Order Payment Statistics
Get payment statistics for orders.

**Endpoint:** `GET /payments`

**Query Parameters:**
- `companyId` (required): ID of the company
- `startDate` (optional): Start date for filtering (YYYY-MM-DD)
- `endDate` (optional): End date for filtering (YYYY-MM-DD)

**Example Request:**
```javascript
const response = await axios.get('/api/sales-analytics/payments', {
  params: {
    companyId: '456',
    startDate: '2024-01-01',
    endDate: '2024-03-31'
  }
});
```

**Response:**
```javascript
{
  "message": "Order payment statistics retrieved successfully",
  "summary": {
    "totalOrders": 50,
    "totalAmount": 50000,
    "totalDueAmount": 20000,
    "totalPaidAmount": 30000,
    "byStatus": {
      "pending": {
        "count": 20,
        "totalAmount": 20000,
        "dueAmount": 20000,
        "paidAmount": 0
      },
      "paid": {
        "count": 30,
        "totalAmount": 30000,
        "dueAmount": 0,
        "paidAmount": 30000
      }
    }
  }
}
```

### 4. Get Cumulative Stock Statistics
Get overall stock statistics.

**Endpoint:** `GET /stock`

**Query Parameters:**
- `companyId` (required): ID of the company

**Example Request:**
```javascript
const response = await axios.get('/api/sales-analytics/stock', {
  params: {
    companyId: '456'
  }
});
```

**Response:**
```javascript
{
  "message": "Cumulative stock statistics retrieved successfully",
  "stats": {
    "totalProducts": 10,
    "totalStock": 1000,
    "totalStockValue": 50000,
    "totalOrders": 50,
    "totalOrderedQuantity": 2000,
    "totalOrderValue": 50000
  }
}
```

### 5. Get Product-wise Stock Statistics
Get stock statistics grouped by products.

**Endpoint:** `GET /stock/products`

**Query Parameters:**
- `companyId` (required): ID of the company

**Example Request:**
```javascript
const response = await axios.get('/api/sales-analytics/stock/products', {
  params: {
    companyId: '456'
  }
});
```

**Response:**
```javascript
{
  "message": "Product-wise stock statistics retrieved successfully",
  "stats": {
    "totalProducts": 10,
    "totalStock": 1000,
    "totalStockValue": 50000,
    "totalOrders": 50,
    "totalOrderedQuantity": 2000,
    "totalOrderValue": 50000
  }
}
```

### 6. Get Design-wise Stock Statistics
Get stock statistics grouped by designs.

**Endpoint:** `GET /stock/designs`

**Query Parameters:**
- `companyId` (required): ID of the company

**Example Request:**
```javascript
const response = await axios.get('/api/sales-analytics/stock/designs', {
  params: {
    companyId: '456'
  }
});
```

**Response:**
```javascript
{
  "message": "Design-wise stock statistics retrieved successfully",
  "stats": {
    "totalDesigns": 5,
    "totalStock": 1000,
    "totalStockValue": 50000,
    "totalOrders": 50,
    "totalOrderedQuantity": 2000,
    "totalOrderValue": 50000
  }
}
```

## Error Responses

All endpoints may return the following error responses:

```javascript
// 400 Bad Request
{
  "message": "Company ID is required"
}

// 404 Not Found
{
  "message": "Company or inventory not found"
}

// 500 Internal Server Error
{
  "message": "Internal server error",
  "error": "Error details"
}
```

## Notes
1. All dates should be in ISO format (YYYY-MM-DD)
2. All monetary values are in the base currency unit
3. All quantities are in the base unit of measurement
4. The `companyId` parameter is required for all endpoints
5. Authentication is required for all endpoints 