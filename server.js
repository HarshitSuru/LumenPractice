const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
// near other requires
const setupSwagger = require("./docs/swagger");

// after routes and before app.listen



dotenv.config();
connectDB();
// after connecting DB and app created





const app = express();
app.use(express.json());
const { startScheduledJobs } = require("./utils/notifications");
// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/suppliers", require("./routes/supplierRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
setupSwagger(app);
// after mounting routes and before listen:
startScheduledJobs();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
