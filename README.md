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

### Managers
- `GET /managers` - Get all managers

### Companies
- `POST /companies/inventories` - Get inventories by company ID

### Managers to Companies
- `POST /managers/companies` - Get companies by manager ID

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
- user_type: String (required, default: "salesman")
- permissions: Array of Strings (required)
- password: String (required)
