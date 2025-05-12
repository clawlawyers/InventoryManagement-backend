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
   JWT_SECRET=your_jwt_secret_key
   ```

## Database Seeding

To populate your database with sample data, run:

```
npm run seed
```

This will:

- Clear all existing data in the database
- Create sample managers, companies, salesmen, and inventory items
- Establish relationships between these entities

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

- `POST /auth/manager/signup` - Register a new manager
- `POST /auth/manager/login` - Login as a manager
- `POST /auth/salesman/login` - Login as a salesman

### Managers

- `GET /managers` - Get all managers
- `GET /managers/:id` - Get manager by ID

### Companies

- `GET /companies/:id/inventories` - Get inventories by company ID
- `GET /companies/:id` - Get company by ID

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
