require("dotenv").config();
const express      = require("express");
const cors         = require("cors");
const helmet       = require("helmet");
const morgan       = require("morgan");
const rateLimit    = require("express-rate-limit");
const swaggerUi    = require("swagger-ui-express");
const swaggerSpec  = require("./docs/swaggerConfig");
const connectDB    = require("./config/db");
const routes       = require("./routes/index");

connectDB();

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "💰 Budget API Docs",
    customCss: ".swagger-ui .topbar { background-color: #1a1a2e; }",
  })
);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "💰 Budget Management API is running!",
    version: "1.0.0",
    docs: "/docs",
    endpoints: {
      auth:         "/api/auth",
      users:        "/api/users",
      budgets:      "/api/budgets",
      expenses:     "/api/expenses",
      customers:    "/api/customers",
      orders:       "/api/orders",
      tasks:        "/api/tasks",
      transactions: "/api/transactions",
    },
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
});

app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 Swagger docs at http://localhost:${PORT}/docs\n`);
});

module.exports = app;
