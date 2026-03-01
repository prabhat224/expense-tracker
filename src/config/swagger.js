import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "💰 Budget Management API v2",
      version: "2.0.0",
      description: "REST API built with Node.js, Express, MySQL, and Prisma ORM using ES Modules.",
    },
    servers: [{ url: "http://localhost:3000", description: "Local Development" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Get token from POST /api/auth/login",
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: "Auth",         description: "Authentication" },
      { name: "Users",        description: "User management" },
      { name: "Budgets",      description: "Budget operations" },
      { name: "Expenses",     description: "Expense tracking" },
      { name: "Customers",    description: "Customer management" },
      { name: "Orders",       description: "Order management" },
      { name: "Tasks",        description: "Task management" },
      { name: "Transactions", description: "Transaction logs" },
    ],
  },
  apis: ["./src/modules/**/*.routes.js"],
};

export default swaggerJsdoc(options);
