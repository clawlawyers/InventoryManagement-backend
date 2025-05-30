# Order Invoice PDF Generation API

## Overview
This API generates PDF invoices for completed orders in the Inventory Management System.

## Endpoint
```
GET /api/orders/invoice/:orderId
```

## Authentication
- Requires JWT token in Authorization header
- Format: `Authorization: Bearer <token>`

## Authorization
- **Managers**: Can generate invoices for any order in their company
- **Salesmen**: Can only generate invoices for orders they created

## Parameters
- `orderId` (path parameter): MongoDB ObjectId of the order

## Validation Requirements
1. Order must exist
2. Order status must be "completed"
3. Valid MongoDB ObjectId for orderId

## Success Response
- **Status Code**: 200
- **Content-Type**: `application/pdf`
- **Content-Disposition**: `attachment; filename="order_invoice_{orderId}_{timestamp}.pdf"`
- **Body**: PDF file stream

## Error Responses

### 400 Bad Request
```json
{
  "message": "Invalid order ID"
}
```

```json
{
  "message": "Invoice can only be generated for completed orders",
  "currentStatus": "pending"
}
```

### 401 Unauthorized
```json
{
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "message": "Forbidden: You can only generate invoices for orders you created"
}
```

### 404 Not Found
```json
{
  "message": "Order not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error",
  "error": "Error details"
}
```

## PDF Content Structure

### Header
- Title: "ORDER INVOICE"

### Company Details (FROM section)
- Company name
- Company address  
- GST number (if available)

### Client Details (TO section)
- Client name
- Phone number
- Firm name (if available)
- Firm GST number (if available)
- Address

### Order Information
- Order ID
- Order date
- Invoice generation date
- Order status

### Products Table
| Item Code | Description | Qty | Unit Price | Total |
|-----------|-------------|-----|------------|-------|
| Design/Bail code | Category - Lot | Quantity | ₹XX.XX | ₹XX.XX |

### Financial Summary
- Total Amount: ₹XX.XX
- Paid Amount: ₹XX.XX (if > 0)
- Due Amount: ₹XX.XX (if > 0)
- Payment Status: PAID/PENDING/PARTIAL/OVERDUE

### Footer
- "Thank you for your business!"

## Usage Examples

### cURL Example
```bash
curl -X GET \
  'http://localhost:8800/api/orders/invoice/507f1f77bcf86cd799439011' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  --output invoice.pdf
```

### JavaScript/Fetch Example
```javascript
const response = await fetch('/api/orders/invoice/507f1f77bcf86cd799439011', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

if (response.ok) {
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'invoice.pdf';
  a.click();
}
```

## File Storage
- Generated PDFs are temporarily stored in `uploads/invoices/` directory
- Files are named: `order_invoice_{orderId}_{timestamp}.pdf`
- Files can be optionally deleted after streaming (currently commented out)

## Dependencies
- `pdfkit`: PDF generation library
- `fs`: File system operations
- `path`: Path utilities
- `mongoose`: MongoDB object validation

## Notes
- Only completed orders can have invoices generated
- PDF generation is done server-side using PDFKit
- Files are streamed directly to the client
- Proper error handling for file operations
- Authorization checks ensure data security
