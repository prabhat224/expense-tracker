const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "💰 Budget Management API",
      version: "1.0.0",
      description: "A comprehensive REST API for managing budgets, expenses, users, orders, customers, and tasks.",
    },
    servers: [
      { url: "http://localhost:3000", description: "Local Development" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token from POST /api/auth/login",
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: "Auth",         description: "Authentication endpoints" },
      { name: "Users",        description: "User profile management" },
      { name: "Budgets",      description: "Budget CRUD operations" },
      { name: "Expenses",     description: "Expense tracking" },
      { name: "Customers",    description: "Customer management" },
      { name: "Orders",       description: "Order management" },
      { name: "Tasks",        description: "Task management" },
      { name: "Transactions", description: "Transaction logs" },
    ],
  },
  apis: ["./routes/*.js"],
};

module.exports = swaggerJsdoc(options);
