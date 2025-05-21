# Textile Bot App

A Node.js application for managing textile inventory, companies, and salesmen with OCR capabilities for textile product information extraction and Excel file processing.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory with the following content:

   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```

3. Install additional dependencies for OCR functionality:
   ```bash
   npm install tesseract.js sharp
   ```

## Database Seeding

To populate your database with sample data, run:

```bash
npm run seed
```

This will:

- Clear all existing data in the database
- Create sample managers, companies, salesmen, and inventory items
- Establish relationships between these entities

## Running the Application

### Backend

Start the server:

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

### Frontend

The application includes a React frontend in the `frontend` directory.

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000` and will automatically proxy API requests to the backend at `http://localhost:8800`.

## API Routes Reference Table

The following table provides a quick reference for all API routes, including HTTP methods, required parameters, and request body requirements:

| Route                                         | Method | Description                        | Required Parameters               | Required Body                                                             | Response                                   |
| --------------------------------------------- | ------ | ---------------------------------- | --------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------ |
| `/auth/manager/signup`                        | POST   | Register a new manager             | None                              | `name`, `email`, `password`, `phoneNumber`, `GSTNumber`                   | Manager object with token                  |
| `/auth/manager/login`                         | POST   | Login as a manager                 | None                              | `email`, `password`                                                       | Manager object with token                  |
| `/auth/salesman/login`                        | POST   | Login as a salesman                | None                              | `user_id`, `password`                                                     | Salesman object with token                 |
| `/managers`                                   | GET    | Get all managers                   | None                              | None                                                                      | Array of manager objects                   |
| `/managers/:id`                               | GET    | Get manager by ID                  | `id` (path)                       | None                                                                      | Manager object                             |
| `/managers/:id/companies`                     | GET    | Get companies by manager ID        | `id` (path)                       | None                                                                      | Array of company objects                   |
| `/managers/companies`                         | GET    | Get companies by manager ID        | `managerId` (query)               | None                                                                      | Array of company objects                   |
| `/companies/create`                           | POST   | Create a new company               | None                              | `name`, `address`, `GSTNumber`                                            | Company object                             |
| `/companies/:id`                              | GET    | Get company by ID                  | `id` (path)                       | None                                                                      | Company object                             |
| `/companies/:id/inventory`                    | GET    | Get inventory by company ID        | `id` (path)                       | None                                                                      | Inventory object or null                   |
| `/companies/:companyId/upload-inventory`      | POST   | Upload inventory Excel file        | `companyId` (path)                | FormData with `excelFile`                                                 | Processing results                         |
| `/inventory/create`                           | POST   | Create a new inventory             | None                              | `inventoryName`, `companyId`                                              | Updated company object                     |
| `/inventory/:inventoryId/products`            | GET    | Get products by inventory ID       | `inventoryId` (path)              | None                                                                      | Array of product objects                   |
| `/inventory/:inventoryId/products`            | POST   | Add product manually               | `inventoryId` (path)              | `bail_number`, `bail_date`, `category_code`, `lot_number`, `stock_amount` | Success message with product object        |
| `/inventory/products/:productId`              | GET    | Get product by ID                  | `productId` (path)                | None                                                                      | Product object                             |
| `/inventory/products/:productId`              | PUT    | Update product                     | `productId` (path)                | Fields to update                                                          | Updated product object                     |
| `/inventory/:inventoryId/products/:productId` | DELETE | Delete product                     | `inventoryId`, `productId` (path) | None                                                                      | Success message                            |
| `/salesmen`                                   | POST   | Create a new salesman              | None                              | `name`, `phone`, `managerId`                                              | Salesman object with generated credentials |
| `/salesmen`                                   | GET    | Get all salesmen                   | None                              | None                                                                      | Array of salesman objects                  |
| `/salesmen/manager/:managerId`                | GET    | Get salesmen by manager ID         | `managerId` (path)                | None                                                                      | Array of salesman objects                  |
| `/salesmen/:salesmanId/clients`               | POST   | Create a new client                | `salesmanId` (path)               | `name`, `phone`, `address`, `city`, `state`, `zipCode`                    | Client object                              |
| `/salesmen/:salesmanId/clients`               | GET    | Get clients by salesman ID         | `salesmanId` (path)               | None                                                                      | Array of client objects                    |
| `/clients`                                    | GET    | Get all clients                    | None                              | None                                                                      | Array of client objects                    |
| `/clients/:id`                                | GET    | Get client by ID                   | `id` (path)                       | None                                                                      | Client object                              |
| `/clients/:id`                                | PUT    | Update client                      | `id` (path)                       | Fields to update                                                          | Updated client object                      |
| `/clients/:id`                                | DELETE | Delete client                      | `id` (path)                       | None                                                                      | Success message                            |
| `/salesmen/:salesmanId/upload`                | POST   | Upload Excel file with client data | `salesmanId` (path)               | FormData with `excelFile`                                                 | Processing results                         |
| `/salesmen/:salesmanId/uploads`               | GET    | Get Excel upload history           | `salesmanId` (path)               | None                                                                      | Array of upload objects                    |
| `/ocr/process`                                | POST   | Process image with OCR             | None                              | FormData with `image` and `userId`                                        | Extracted text and structured data         |
| `/ocr/designs/:userId`                        | GET    | Get designs extracted by OCR       | `userId` (path)                   | None                                                                      | Array of design objects                    |

## Frontend Routes

The frontend application uses React Router for navigation. Here are the main routes:

| Route                             | Description               | Component               |
| --------------------------------- | ------------------------- | ----------------------- |
| `/`                               | Home page                 | `Home`                  |
| `/dashboard`                      | Manager dashboard         | `ManagerDashboard`      |
| `/companies`                      | List of companies         | `CompanyList`           |
| `/companies/:id`                  | Company details           | `CompanyDetails`        |
| `/companies/:companyId/inventory` | Manage inventory products | `InventoryProductsPage` |
| `/inventory`                      | List of inventories       | `InventoryList`         |
| `/salesmen`                       | List of salesmen          | `SalesmanList`          |
| `/salesmen/:id`                   | Salesman details          | `SalesmanDetails`       |
| `/ocr-upload`                     | OCR image upload          | `OcrUpload`             |

### Frontend-Backend Integration

The frontend communicates with the backend using the API service defined in `frontend/src/services/api.js`. This service provides functions for all API endpoints, handling authentication, error handling, and data formatting.

#### API Service Usage Examples

Here are some examples of how to use the API service in your React components:

**Fetching data:**

```javascript
import React, { useState, useEffect } from "react";
import { getInventoryByCompany } from "../services/api";

const CompanyInventory = ({ companyId }) => {
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const data = await getInventoryByCompany(companyId);
        setInventory(data);
      } catch (err) {
        setError("Failed to load inventory");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [companyId]);

  // Render component...
};
```

**Creating data:**

```javascript
import React, { useState } from "react";
import { createInventoryProduct } from "../services/api";

const AddProductForm = ({ inventoryId, onSuccess }) => {
  const [formData, setFormData] = useState({
    bail_number: "",
    bail_date: "",
    category_code: "",
    lot_number: "",
    stock_amount: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createInventoryProduct(inventoryId, formData);
      onSuccess();
    } catch (err) {
      console.error("Error creating product:", err);
    }
  };

  // Render form...
};
```

**Uploading files:**

```javascript
import React, { useState } from "react";
import { uploadInventoryExcel } from "../services/api";

const ExcelUploader = ({ companyId }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("excelFile", file);

    try {
      setUploading(true);
      const result = await uploadInventoryExcel(companyId, formData);
      console.log("Upload successful:", result);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  // Render uploader...
};
```

## Features

### Excel File Upload and Processing

The application supports uploading and processing Excel files for:

- Client data import by salesmen
- Inventory data import by companies

### OCR Image Processing

The application includes OCR (Optical Character Recognition) capabilities to:

- Extract textile product information from images
- Identify product names, design numbers, and categories
- Process and store extracted data

## API Endpoints

This section provides detailed documentation of all API endpoints, including request/response formats and authentication requirements to make frontend setup easier.

### Authentication

- **Register a new manager**

  - `POST /auth/manager/signup`
  - Request body:
    ```json
    {
      "name": "Manager Name",
      "email": "manager@example.com",
      "password": "password123",
      "phoneNumber": "1234567890",
      "GSTNumber": "GST123456789"
    }
    ```
  - Response: Manager object with token

- **Login as a manager**

  - `POST /auth/manager/login`
  - Request body:
    ```json
    {
      "email": "manager@example.com",
      "password": "password123"
    }
    ```
  - Response:
    ```json
    {
      "token": "jwt_token_here",
      "user": {
        "id": "manager_id",
        "name": "Manager Name",
        "type": "manager",
        "email": "manager@example.com",
        "companies": []
      }
    }
    ```

- **Login as a salesman**
  - `POST /auth/salesman/login`
  - Request body:
    ```json
    {
      "user_id": "SM1234",
      "password": "password123"
    }
    ```
  - Response: Salesman object with token

### Managers

- **Get all managers**

  - `GET /managers`
  - Authentication: Required
  - Response: Array of manager objects

- **Get manager by ID**

  - `GET /managers/:id`
  - Authentication: Required
  - Response: Manager object

- **Get companies by manager ID**
  - `GET /managers/:id/companies` or `GET /managers/companies?managerId=:id`
  - Authentication: Required
  - Response: Array of company objects

### Companies

- **Create a new company**

  - `POST /companies/create`
  - Authentication: Required (manager only)
  - Request body:
    ```json
    {
      "name": "Company Name",
      "address": "Company Address",
      "GSTNumber": "GST123456789"
    }
    ```
  - Response: Company object

- **Get company by ID**

  - `GET /companies/:id`
  - Authentication: Required
  - Response: Company object

- **Get inventory by company ID**

  - `GET /companies/:id/inventory`
  - Authentication: Required
  - Response: Inventory object or null

- **Upload inventory Excel file**
  - `POST /companies/:companyId/upload-inventory`
  - Authentication: Required
  - Request: FormData with 'excelFile' field
  - Response: Processing results

### Inventory

- **Create a new inventory**

  - `POST /inventory/create`
  - Authentication: Required (manager only)
  - Request body:
    ```json
    {
      "inventoryName": "Inventory Name",
      "companyId": "company_id"
    }
    ```
  - Response: Updated company object

- **Get products by inventory ID**

  - `GET /inventory/:inventoryId/products`
  - Authentication: Required
  - Response: Array of product objects

- **Get product by ID**

  - `GET /inventory/products/:productId`
  - Authentication: Required
  - Response: Product object

- **Add product manually**

  - `POST /inventory/:inventoryId/products`
  - Authentication: Required
  - Request body:
    ```json
    {
      "inventoryId": "inventory_id",
      "bail_number": "B12345",
      "bail_date": "2023-05-15",
      "category_code": "COTTON",
      "lot_number": "L789",
      "stock_amount": 100
    }
    ```
  - Response: Success message with product object

- **Update product**

  - `PUT /inventory/products/:productId`
  - Authentication: Required
  - Request body: Fields to update
  - Response: Updated product object

- **Delete product**
  - `DELETE /inventory/:inventoryId/products/:productId`
  - Authentication: Required
  - Response: Success message

### Salesmen

- **Create a new salesman**

  - `POST /salesmen`
  - Authentication: Required (manager only)
  - Request body:
    ```json
    {
      "name": "Salesman Name",
      "phone": "1234567890",
      "managerId": "manager_id"
    }
    ```
  - Response: Salesman object with generated credentials

- **Get all salesmen**

  - `GET /salesmen`
  - Authentication: Required
  - Response: Array of salesman objects

- **Get salesmen by manager ID**
  - `GET /salesmen/manager/:managerId`
  - Authentication: Required
  - Response: Array of salesman objects

### Clients

- **Create a new client**

  - `POST /salesmen/:salesmanId/clients`
  - Authentication: Required
  - Request body:
    ```json
    {
      "name": "Client Name",
      "phone": "1234567890",
      "email": "client@example.com",
      "address": "Client Address",
      "city": "City",
      "state": "State",
      "zipCode": "123456",
      "notes": "Additional notes"
    }
    ```
  - Response: Client object

- **Get clients by salesman ID**

  - `GET /salesmen/:salesmanId/clients`
  - Authentication: Required
  - Response: Array of client objects

- **Get all clients**

  - `GET /clients`
  - Authentication: Required
  - Response: Array of client objects

- **Get client by ID**

  - `GET /clients/:id`
  - Authentication: Required
  - Response: Client object

- **Update client**

  - `PUT /clients/:id`
  - Authentication: Required
  - Request body: Fields to update
  - Response: Updated client object

- **Delete client**
  - `DELETE /clients/:id`
  - Authentication: Required
  - Response: Success message

### Excel Upload

- **Upload Excel file with client data**

  - `POST /salesmen/:salesmanId/upload`
  - Authentication: Required
  - Request: FormData with 'excelFile' field
  - Response: Processing results

- **Get Excel upload history**
  - `GET /salesmen/:salesmanId/uploads`
  - Authentication: Required
  - Response: Array of upload objects

### OCR Processing

- **Process image with OCR**

  - `POST /ocr/process`
  - Authentication: Required
  - Request: FormData with 'image' and 'userId' fields
  - Response: Extracted text and structured data

- **Get designs extracted by OCR**
  - `GET /ocr/designs/:userId`
  - Authentication: Required
  - Response: Array of design objects

## Models

### Manager

- name: String (required)
- email: String (required, unique)
- password: String (required)
- companies: Array of Company references
- salesmen: Array of Salesman references

### Company

- name: String (required)
- address: String (required)
- GSTNumber: String (required)
- inventory: Reference to Inventory

### Inventory

- inventoryName: String (required)
- company: Reference to Company (required)
- products: Array of InventoryProduct references

### InventoryProduct

- bail_number: String (required)
- bail_date: Date (required)
- category_code: String (required)
- lot_number: String (required)
- stock_amount: Number (required)

### Salesman

- user_id: String (required, unique)
- name: String (required)
- phone: String (required, unique)
- user_type: String (required, default: "salesman")
- permissions: Reference to Permission (required)
- password: String (required)
- manager: Reference to Manager (required)

### Client

- name: String (required)
- phone: String (required, unique)
- email: String (optional)
- address: String (required)
- city: String (required)
- state: String (required)
- zipCode: String (required)
- notes: String (optional)
- salesman: Reference to Salesman (required)

### ExcelUpload

- filename: String (required)
- originalname: String (required)
- path: String (required)
- size: Number (required)
- salesman: Reference to Salesman
- processed: Boolean (default: false)
- processingResults: Object with success and error counts
- uploadDate: Date (default: current date)

### Design

- userId: String (required)
- filename: String (required)
- category: String (required)
- designNumber: String (required)
- path: String (required)
- fullPath: String (required)
- uploadDate: Date (default: current date)

## OCR Functionality

The OCR functionality extracts textile product information from images:

1. **Image Upload**: Salesmen and managers can upload images of textile products
2. **Image Processing**: The system optimizes the image for better OCR results
3. **Text Extraction**: Tesseract.js extracts text from the image
4. **Data Extraction**: The system identifies:
   - Design numbers/names (e.g., "RANGEEN 463")
   - Categories (e.g., "22KG HEAVY REYON")
   - Print types (e.g., "DISCHARGE PRINT")
5. **Data Storage**: Extracted information is saved in the Design model

## Excel Upload Functionality

The Excel upload functionality processes spreadsheets:

1. **Client Data Upload**: Salesmen can upload Excel files with client information

   - Required columns: name, phone, address, city, state, zipCode
   - Optional columns: email, notes

2. **Inventory Data Upload**: Companies can upload Excel files with inventory information
   - Required columns: Entry Date, Full Bale No., Item Name, Lot No, Stock Act Mt
   - Optional columns: Design No, chat_id
