# TextileBot API Postman Collection

This repository contains a Postman collection and environment for testing the TextileBot API.

## Files

- `TextileBot_API_Collection.postman_collection.json`: The Postman collection containing all API endpoints
- `TextileBot_Environment.postman_environment.json`: The Postman environment with variables used in the collection

## Getting Started

### Prerequisites

- [Postman](https://www.postman.com/downloads/) installed on your machine
- TextileBot API running (default: http://localhost:3001)

### Importing the Collection and Environment

1. Open Postman
2. Click on "Import" in the top left corner
3. Drag and drop both JSON files or click "Upload Files" and select them
4. Both the collection and environment should now be imported

### Setting Up the Environment

1. In the top right corner of Postman, click on the environment dropdown and select "TextileBot Environment"
2. The environment comes with the following variables:
   - `baseUrl`: The base URL of your API (default: http://localhost:3001)
   - `managerId`: ID of a manager
   - `salesmanId`: ID of a salesman
   - `companyId`: ID of a company
   - `clientId`: ID of a client
   - `managerToken`: Authentication token for manager
   - `salesmanToken`: Authentication token for salesman

3. You'll need to update these variables with actual values from your database

### Authentication Flow

1. Use the "Manager Login" or "Salesman Login" request in the Authentication folder
2. After a successful login, the response will contain a token
3. Manually copy this token to the `managerToken` or `salesmanToken` variable in your environment

### Using the Collection

The collection is organized into folders based on resource types:

1. **Authentication**: Login and signup endpoints
2. **Managers**: Endpoints for managing managers
3. **Companies**: Endpoints for managing companies and their inventories
4. **Salesmen**: Endpoints for managing salesmen, their clients, and Excel uploads
5. **Clients**: Endpoints for managing clients

### Testing File Uploads

For endpoints that require file uploads (like "Upload Inventory Excel" or "Upload Excel File"):

1. Click on the request
2. Go to the "Body" tab
3. Make sure "form-data" is selected
4. For the file field (usually "excelFile"), click on "Select Files" and choose your Excel file

## API Endpoints

### Authentication

- `POST /auth/manager/login`: Login as a manager
- `POST /auth/manager/signup`: Register a new manager
- `POST /auth/salesman/login`: Login as a salesman

### Managers

- `GET /managers`: Get all managers
- `GET /managers/:id`: Get a specific manager by ID
- `POST /managers`: Create a new manager
- `GET /managers/companies`: Get companies associated with a manager

### Companies

- `GET /companies/:id`: Get a specific company by ID
- `GET /companies/:id/inventories`: Get inventories for a specific company
- `POST /companies/:companyId/upload-inventory`: Upload inventory Excel file for a company

### Salesmen

- `GET /salesmen`: Get all salesmen
- `GET /salesmen/manager/:managerId`: Get salesmen for a specific manager
- `POST /salesmen`: Create a new salesman
- `GET /salesmen/:salesmanId/clients`: Get clients for a specific salesman
- `POST /salesmen/:salesmanId/clients`: Create a new client for a salesman
- `POST /salesmen/:salesmanId/upload`: Upload Excel file for a salesman
- `GET /salesmen/:salesmanId/uploads`: Get Excel uploads for a salesman

### Clients

- `GET /clients`: Get all clients
- `GET /clients/:id`: Get a specific client by ID
- `PUT /clients/:id`: Update a client
- `DELETE /clients/:id`: Delete a client

## Troubleshooting

- If you get authentication errors, make sure your token is correctly set in the environment
- For file upload issues, ensure you're selecting the correct file type (Excel files)
- If endpoints return 404, verify that your API is running and the base URL is correct
