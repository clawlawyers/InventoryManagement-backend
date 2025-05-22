# Textile Bot App

A Node.js application for managing textile inventory, companies, and salesmen.

## Setup

1. Install dependencies:

   ```
   npm install
   ```

2. Create a `.env` file in the root directory with the following content:
   ```
   MONGODB_URI=your_mongodb_connection_string
   ```

## Database Seeding

### Basic Seeding

To populate your database with basic sample data, run:

```
npm run seed
```

This will:

- Clear all existing data in the database
- Create sample managers, companies, salesmen, and inventory items
- Establish relationships between these entities

### Full Database Seeding

To populate your database with comprehensive sample data, run:

```
npm run seed:full
```

This will:

- Clear all existing data in the database
- Create sample managers, companies, salesmen, clients, and inventory items
- Create inventory products for each inventory
- Generate sample invoices
- Create sample Excel upload records
- Establish relationships between all entities

## Running the Application

Start the server:

```
npm start
```

For development with auto-restart:

```
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/auth/manager/login` - Manager login
- `POST /api/auth/manager/signup` - Manager signup
- `POST /api/auth/salesman/login` - Salesman login
- `GET /api/auth/getVerify` - Verify authentication token

### Managers

- `GET /api/managers` - Get all managers
- `GET /api/managers/:id` - Get manager by ID
- `POST /api/managers` - Create a new manager
- `GET /api/managers/companies` - Get companies by manager ID

### Companies

- `POST /api/companies/create` - Create a new company
- `GET /api/companies/:id` - Get company by ID
- `GET /api/companies/:id/inventories` - Get inventories by company ID
- `POST /api/companies/:companyId/upload-inventory` - Upload inventory Excel file

### Salesmen

- `POST /api/salesmen` - Create a new salesman
- `GET /api/salesmen` - Get all salesmen
- `GET /api/salesmen/manager/:managerId` - Get salesmen by manager ID

### Clients

- `GET /api/clients` - Get all clients
- `GET /api/clients/:id` - Get client by ID
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client
- `POST /api/salesmen/:salesmanId/clients` - Create a new client for a salesman
- `GET /api/salesmen/:salesmanId/clients` - Get clients by salesman ID

### Inventory

- `POST /api/inventory/create` - Create a new inventory
- `GET /api/inventory/products/:id` - Get products by inventory ID
- `POST /api/inventory/products` - Create a new inventory product
- `GET /api/inventory/:inventoryId/products` - Get all products in an inventory
- `GET /api/inventory/products/:productId` - Get a specific product by ID
- `PUT /api/inventory/products/:productId` - Update a product
- `DELETE /api/inventory/:inventoryId/products/:productId` - Delete a product

### Invoices

- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create a new invoice

### Orders

- `POST /api/orders/create` - Create a new order (Manager/Salesman only) - Supports both single and multiple products
- `POST /api/orders/create-multiple` - Create a new order with multiple products (Manager/Salesman only)
- `GET /api/orders` - Get all orders (Manager sees all, Salesman sees own)
- `GET /api/orders/:id` - Get order by ID

### Payments

- `POST /api/payments/create` - Record a payment for an order (Manager/Salesman only)
- `GET /api/payments` - Get all payments (Manager sees all, Salesman sees own)
- `GET /api/payments/order/:orderId` - Get all payments for a specific order
- `GET /api/payments/:id` - Get payment by ID

#### Order Creation Formats

**Single Product (Legacy format):**

```json
{
  "productName": "Cotton Fabric",
  "category": "Textiles",
  "quantity": 100,
  "clientId": "client_id_here"
}
```

**Inventory-Based Order Creation:**

```json
{
  "products": [
    {
      "inventoryProductId": "inventory_product_id_1",
      "quantity": 10,
      "unitPrice": 50
    },
    {
      "inventoryProductId": "inventory_product_id_2",
      "quantity": 5
    }
  ],
  "clientId": "client_id_here",
  "paymentDueDate": "2025-06-01"
}
```

**Note:**

- Orders now use existing inventory products (bail_number as product name, design_code as category)
- Stock amounts are automatically decreased when orders are created
- Unit price can be overridden or will use the price from inventory product
- System validates stock availability before creating orders

#### Payment Creation Format

```json
{
  "orderId": "order_id_here",
  "amount": 3000,
  "paymentMethod": "cash",
  "paymentReference": "TXN123456",
  "notes": "Partial payment received"
}
```

## Models

### Manager

- name: String (required)
- email: String (required, unique)
- password: String (required, hashed)
- phoneNumber: String (required)
- GSTNumber: String (required)
- companies: Array of Company references
- salesmen: Array of Salesman references

### Company

- name: String (required)
- address: String (required)
- city: String (required)
- state: String (required)
- zipCode: String (required)
- phoneNumber: String (required)
- email: String (required)
- inventory: Reference to Inventory

### Inventory

- inventoryName: String (required)
- company: Reference to Company (required)
- products: Array of InventoryProduct references

### InventoryProduct

- bail_number: String (required) - Used as product name in orders
- bail_date: Date (default: current date)
- design_code: String - Used as category in orders
- category_code: String
- lot_number: String
- stock_amount: Number (default: 0) - Automatically decreased when orders are created
- price: Number (min: 0, default: 0) - Unit price for the product
- image: String (optional)

### Salesman

- user_id: String (required, unique)
- name: String (required)
- user_type: String (required, default: "salesman")
- phone: String (required)
- password: String (required)
- permissions: Reference to Permission
- manager: Reference to Manager (required)

### Client

- name: String (required)
- phone: String (required, unique)
- email: String
- address: String (required)
- city: String (required)
- state: String (required)
- zipCode: String (required)
- notes: String
- salesman: Reference to Salesman (required)
- invoices: Array of Invoice references

### Invoice

- name: String (required)
- address: String (required)
- item: Reference to Inventory (required)
- purchased: Number (default: 0)
- paid: Number (default: 0)
- pending_total: Number (default: 0)
- amount: Number (default: 0)

### Order

- products: Array of OrderProduct objects (required, at least one product)
  - inventoryProduct: Reference to InventoryProduct (required)
  - quantity: Number (required, min: 1)
  - unitPrice: Number (required, min: 0)
  - totalPrice: Number (required, calculated from unitPrice \* quantity)
- productName: String (legacy field for backward compatibility)
- category: String (legacy field for backward compatibility)
- quantity: Number (legacy field for backward compatibility)
- client: Reference to Client (required)
- createdBy: Reference to Manager or Salesman (required)
- creatorType: String (required, enum: ["Manager", "Salesman"])
- status: String (enum: ["pending", "confirmed", "processing", "completed", "cancelled"], default: "pending")
- totalAmount: Number (calculated from products, default: 0)
- paidAmount: Number (sum of all payments, default: 0)
- dueAmount: Number (totalAmount - paidAmount, calculated automatically)
- paymentStatus: String (enum: ["pending", "partial", "paid", "overdue"], default: "pending")
- paymentDueDate: Date (optional)
- payments: Array of Payment references
- createdAt: Date (default: current date)
- updatedAt: Date (default: current date)

### Payment

- order: Reference to Order (required)
- client: Reference to Client (required)
- amount: Number (required, min: 0)
- paymentMethod: String (enum: ["cash", "bank_transfer", "cheque", "upi", "card", "other"], default: "cash")
- paymentReference: String (optional, for transaction ID, cheque number, etc.)
- paymentDate: Date (default: current date)
- notes: String (optional)
- receivedBy: Reference to Manager or Salesman (required)
- receivedByType: String (required, enum: ["Manager", "Salesman"])
- status: String (enum: ["pending", "confirmed", "failed", "refunded"], default: "confirmed")
- createdAt: Date (default: current date)
- updatedAt: Date (default: current date)

### Permission

- add: Boolean
- delete: Boolean
- description: String
- salesman: Reference to Salesman

### ExcelUpload

- filename: String (required)
- originalname: String (required)
- path: String (required)
- size: Number (required)
- uploadDate: Date (default: current date)
- salesman: Reference to Salesman
- processed: Boolean (default: false)
- processingResults: Object with success count, error count, and details
