# PharmaCare - Pharmacy Management System

A modern, full-stack pharmacy management system built with React and Node.js that helps pharmacies streamline their operations, manage inventory, and provide better patient care.

### Live Link: https://pharmacyserver.vercel.app

## Features
1. Inventory Management
2. Sales Management
3. Purchase Management
4. Customer Management
5. Supplier Management
6. Reports & Analytics
7. User Management
8. System Settings

## Technology Stack
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Bcrypt
- CORS

### Installation


1. Clone the repository
```bash
git clone https://github.com/younusFoysal/Pharma-Care-Server.git
cd Pharma-Care-Server
```

2. Install dependencies
```bash
cd server
npm install
```

3. Environment Setup

Create `.env` file in the root directory:
```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

4. Start the Development Server
```bash
# Start backend server
npm run server

```

The server will be available at `http://localhost:3000`

## API Documentation

### Authentication Endpoints
- POST `/api/auth/login` - User login
- POST `/api/auth/register` - User registration
- GET `/api/auth/me` - Get current user

### Product Endpoints
- GET `/api/products` - Get all products
- POST `/api/products` - Create product
- PUT `/api/products/:id` - Update product
- DELETE `/api/products/:id` - Delete product

### Sales Endpoints
- GET `/api/sales` - Get all sales
- POST `/api/sales` - Create sale
- PUT `/api/sales/:id` - Update sale
- GET `/api/sales/customer/:id` - Get customer sales

### Purchase Endpoints
- GET `/api/purchases` - Get all purchases
- POST `/api/purchases` - Create purchase
- PUT `/api/purchases/:id` - Update purchase
- DELETE `/api/purchases/:id` - Delete purchase

### Customer Endpoints
- GET `/api/customers` - Get all customers
- POST `/api/customers` - Create customer
- PUT `/api/customers/:id` - Update customer
- DELETE `/api/customers/:id` - Delete customer

### Supplier Endpoints
- GET `/api/suppliers` - Get all suppliers
- POST `/api/suppliers` - Create supplier
- PUT `/api/suppliers/:id` - Update supplier
- DELETE `/api/suppliers/:id` - Delete supplier



## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@pharmacare.com or join our Slack channel.

## Acknowledgments

- [React](https://reactjs.org/)
- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)