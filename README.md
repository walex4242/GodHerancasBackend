### GodHeranca Backend Documentation

**Overview:**

The **GodHeranca Backend** is a RESTful API built using **Node.js** and **Express.js** for handling server-side operations. It utilizes **MongoDB** for data storage and **JWT (JSON Web Token)** for authentication and authorization. The backend facilitates interactions between the user-facing **GodHeranca Web and Dashboard** apps by managing user authentication, product uploads, and inventory.

### Tech Stack:
- **Node.js**: JavaScript runtime for building the backend.
- **Express.js**: Framework for building RESTful APIs.
- **MongoDB**: NoSQL database for storing data like users, products, and inventory.
- **JWT**: Used for securely handling authentication and authorization.

### Base URL:
- API URL: [https://godherancabackend2-a7sse79m.b4a.run](https://godherancabackend2-a7sse79m.b4a.run)

### Key Features:
- **User Authentication**: Secure login and registration with JWT-based token system.
- **Product Management**: Allows supermarkets to upload and manage products and track their inventory.
- **API Security**: Utilizes JWT for secure routes and permissions, ensuring only authenticated users can access sensitive endpoints.

### API Endpoints:

1. **POST /auth/register**  
   - Registers a new supermarket account.
   - **Request body**: `name`, `email`, `password`, etc.
   - **Response**: Success message or error.

2. **POST /auth/login**  
   - Authenticates a user and returns a JWT token.
   - **Request body**: `email`, `password`
   - **Response**: JWT token.

3. **GET /products**  
   - Retrieves a list of products available for sale.
   - **Response**: Array of product objects.

4. **POST /products**  
   - Allows an authenticated supermarket to upload a new product.
   - **Request body**: Product details like `name`, `price`, `description`, `image`, etc.
   - **Response**: Product details with a success message.

5. **PUT /products/{id}**  
   - Updates product details for an existing product.
   - **Request body**: Updated product details.
   - **Response**: Updated product object.

6. **DELETE /products/{id}**  
   - Deletes a product from the inventory.
   - **Response**: Success message.

7. **GET /inventory**  
   - Retrieves current inventory status (quantity and availability).
   - **Response**: Inventory status for each product.

### Authentication:

- **JWT Tokens**: JWT is used for user authentication and authorization. The token must be included in the `Authorization` header for any request that requires authentication.

  Example:
  ```bash
  Authorization: Bearer <JWT-TOKEN>
  ```

### Setup & Installation:

1. Clone the repository:
   ```bash
   git clone https://github.com/walex4242/GodHerancasBackend.git
   ```

2. Install dependencies:
   ```bash
   cd GodHerancasBackend
   npm install
   ```

3. Set up environment variables (create a `.env` file):
   ```
   MONGO_URI=<your-mongo-db-uri>
   CLOUD_NAME='do1hoqtta'
   CLOUD_API=''
   CLOUD_SECRET=''
   CORS_ALLOWED_ORIGINS=https://godherancafrontendweb.vercel.app,http://localhost:3000,https://god-heranca-dashboardfrontend.vercel.app
   NODE_ENV="production"
   SECRET=''
   SESSION=''
   JWT_SECRET='GodHeranca-Auth'
   GOOGLE_CLIENT_ID=""
   GOOGLE_CLIENT_SECRET=""
   EMAIL_USER=''
   EMAIL_PASS=''
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. The backend will be available at [https://godherancabackend2-a7sse79m.b4a.run](https://godherancabackend2-a7sse79m.b4a.run).

### Conclusion:
This backend provides a secure and efficient solution for managing supermarket products, users, and inventory. The integration with JWT ensures that only authenticated users can access protected routes, while MongoDB serves as a scalable data storage solution.

For more information and to view the code, visit the [GitHub Repository](https://github.com/walex4242/GodHerancasBackend).
