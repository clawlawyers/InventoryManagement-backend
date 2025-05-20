# TextileBot API Authentication Guide

## Authentication Issue with Seeded Data

There is an important issue with the seeded manager accounts in the database:

1. The seed data includes three sample managers with these credentials:
   - Email: john@example.com, Password: password123
   - Email: sarah@example.com, Password: password123
   - Email: michael@example.com, Password: password123

2. However, these accounts **cannot be used to log in** because:
   - The authentication controller uses bcrypt to compare passwords
   - The seed data stores plain text passwords
   - The Manager model doesn't have a pre-save hook to hash passwords

## Solution: Create a New Manager Account

To authenticate as a manager, you need to create a new account using the Manager Signup endpoint:

1. Use the "Manager Signup" request in the Postman collection:
   ```json
   POST {{baseUrl}}/auth/manager/signup
   
   {
     "name": "New Manager",
     "email": "newmanager@example.com",
     "password": "password123"
   }
   ```

2. This will create a properly hashed password and return a token you can use for authentication.

## Salesman Authentication

For salesman accounts, the seed data includes:
- User ID: SM001, Password: password123
- User ID: SM002, Password: password123
- User ID: SM003, Password: password123

Unlike manager accounts, these can be used directly because the salesman login doesn't use bcrypt for password comparison.

## Fixing the Seed Data (For Developers)

If you want to fix the seed data to work with the current authentication system, you need to modify the `seedDatabase.js` file to hash the passwords before saving:

```javascript
// Add this at the top of the file
const bcrypt = require("bcrypt");

// Then modify the seedDatabase function
const seedDatabase = async () => {
  try {
    // Clear existing data
    // ...
    
    // Hash passwords for managers
    const managersWithHashedPasswords = await Promise.all(
      sampleManagers.map(async (manager) => ({
        ...manager,
        password: await bcrypt.hash(manager.password, 10)
      }))
    );
    
    // Insert managers with hashed passwords
    const managers = await Manager.insertMany(managersWithHashedPasswords);
    console.log(`Added ${managers.length} managers`);
    
    // Rest of the function...
  } catch (error) {
    // ...
  }
};
```

## Authentication Flow in Postman

1. Use the "Manager Signup" request to create a new account
2. Copy the token from the response
3. Set the token in the Postman environment variable `managerToken`
4. Use this token for authenticated requests

For salesman authentication:
1. Use the "Salesman Login" request with one of the seeded credentials
2. Copy the token from the response
3. Set the token in the Postman environment variable `salesmanToken`
