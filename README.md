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

Start the server:

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
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

### Authentication

- `POST /auth/manager/signup` - Register a new manager
- `POST /auth/manager/login` - Login as a manager
- `POST /auth/salesman/login` - Login as a salesman

### Managers

- `GET /managers` - Get all managers
- `GET /managers/:id` - Get manager by ID

### Companies

- `GET /companies/:id/inventories` - Get inventories by company ID
- `GET /companies/:id` - Get company by ID
- `POST /companies/:companyId/upload-inventory` - Upload Excel file with inventory data

### Managers to Companies

- `GET /managers/companies` - Get companies by manager ID

### Salesmen

- `POST /salesmen` - Create a new salesman
- `GET /salesmen` - Get all salesmen
- `GET /salesmen/manager/:managerId` - Get salesmen by manager ID

### Clients

- `POST /salesmen/:salesmanId/clients` - Create a new client
- `GET /salesmen/:salesmanId/clients` - Get clients by salesman ID
- `GET /clients` - Get all clients
- `GET /clients/:id` - Get client by ID
- `PUT /clients/:id` - Update client
- `DELETE /clients/:id` - Delete client

### Excel Upload

- `POST /salesmen/:salesmanId/upload` - Upload Excel file with client data
- `GET /salesmen/:salesmanId/uploads` - Get Excel upload history for a salesman

### OCR Processing

- `POST /ocr/process` - Process image with OCR and extract textile information
- `GET /ocr/designs/:userId` - Get designs extracted by OCR for a user

## Models

### Manager

- name: String (required)
- email: String (required, unique)
- password: String (required)
- companies: Array of Company references
- salesmen: Array of Salesman references

### Company

- name: String (required)
- inventories: Array of Inventory references

### Inventory

- bail_number: String (required)
- bail_date: Date (required)
- category_code: String (required)
- lot_number: String (required)
- stock_amount: Number (required)
- company: Reference to Company (required)

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
