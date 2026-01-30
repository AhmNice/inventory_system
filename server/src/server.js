import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectPostgresDB } from "./database/connectDB.js";
import { setUpRoute } from "./routes/setup.route.js";
import { authRoutes } from "./routes/auth.route.js";
import categoryRoute from "./routes/category.route.js";
import equipmentRoute from "./routes/equipment.route.js";
import logRoutes from "./routes/log.route.js";
import requestRoute from "./routes/request.route.js";
import statRoute from "./routes/stat.route.js";
import check_out_route from "./routes/check.route.js";

dotenv.config();

const app = express();

// ✅ Validate environment variables
if (!process.env.CLIENT_URL) {
  console.warn(
    "⚠️ CLIENT_URL not set in .env — using '*' for CORS temporarily"
  );
}

// ✅ Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);
app.set("trust proxy", true);

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/setup", setUpRoute);
app.use("/api/category", categoryRoute);
app.use("/api/equipment", equipmentRoute);
app.use("/api/request", requestRoute);
app.use("/api/logs", logRoutes);
app.use("/api/stats", statRoute);
app.use("/api/checkout", check_out_route);

// ✅ Health check route (optional but useful)
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "Inventory API is running 🚀" });
});

const PORT = process.env.PORT || 5680;

// ✅ Start server safely
const startServer = async () => {
  console.log("🔄 Initializing database connection...");

  try {
    await connectPostgresDB();
    app.listen(PORT, () => {
      console.log(`✅ Server up and running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1); // Stop app if DB connection fails
  }
};

// ✅ Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Server shutting down gracefully...");
  process.exit(0);
});

startServer();
