import "dotenv/config";
import express     from "express";
import cors        from "cors";
import helmet      from "helmet";
import morgan      from "morgan";
import rateLimit   from "express-rate-limit";
import swaggerUi   from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import router      from "./routes.js";
import prisma      from "./config/prisma.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests. Please try again later." },
}));

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "💰 Budget API Docs",
  customCss: ".swagger-ui .topbar { background-color: #1a1a2e; }",
}));

app.get("/", (req, res) => {
  res.json({
    message: "💰 Budget Management API v2 is running!",
    stack: "MySQL + Prisma + ES Modules",
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

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected", uptime: process.uptime() });
  } catch {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

app.use("/api", router);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server:  http://localhost:${PORT}`);
  console.log(`📚 Docs:    http://localhost:${PORT}/docs`);
  console.log(`🗄️  DB:      MySQL via Prisma\n`);
});

export default app;
