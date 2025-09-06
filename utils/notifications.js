// utils/notifications.js
const Product = require("../models/Product");
const Transaction = require("../models/Transaction");
const cron = require("node-cron");
const nodemailer = require("nodemailer");

/**
 * sendEmailAlert (optional)
 * Requires .env SMTP config: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ALERT_EMAIL_TO
 */
async function sendEmailAlert(subject, text) {
  if (!process.env.SMTP_HOST) return; // email not configured
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true", // true for 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.ALERT_EMAIL_TO,
      subject,
      text,
    });
  } catch (err) {
    console.error("Failed to send email alert", err);
  }
}

/**
 * checkLowStock
 * - Finds products with stockLevel <= reorderPoint
 * - Logs alert and optionally emails
 */
async function checkLowStock() {
  try {
    const low = await Product.find({ $expr: { $lte: ["$stockLevel", "$reorderPoint"] } });
    if (low && low.length > 0) {
      const lines = low.map(p => `${p.name} (stock: ${p.stockLevel}, reorderPoint: ${p.reorderPoint})`);
      const message = `LOW STOCK ALERT:\n${lines.join("\n")}`;
      console.warn(message);
      await sendEmailAlert("Low Stock Alert - Telecom Inventory", message);
    } else {
      // optionally log for debugging:
      // console.log("Low stock check: all good");
    }
  } catch (err) {
    console.error("Error in checkLowStock:", err);
  }
}

/**
 * startScheduledJobs
 * - start cron job for low-stock checks every 1 hour (adjustable)
 */
function startScheduledJobs() {
  // run at minute 0 of every hour:
  cron.schedule("0 * * * *", () => {
    console.log("[notifications] running hourly low-stock check");
    checkLowStock();
  });

  // run a quick check at startup
  checkLowStock();
}

/**
 * createTransactionAndMaybeAlert
 * - convenience helper: create a transaction, update product stock, check reorder point
 */
async function createTransactionAndMaybeAlert({ productId, type, quantity, performedBy }) {
  const tx = new Transaction({
    productId,
    type,
    quantity,
  });

  // Save transaction and update product atomically-ish:
  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found");

  if (type === "IN") {
    product.stockLevel += quantity;
  } else if (type === "OUT") {
    if (product.stockLevel - quantity < 0) {
      throw new Error("Insufficient stock for operation");
    }
    product.stockLevel -= quantity;
  } else {
    throw new Error("Transaction type must be IN or OUT");
  }

  await Promise.all([tx.save(), product.save()]);

  // if stock at or below reorder point, alert
  if (product.stockLevel <= product.reorderPoint) {
    const message = `Stock alert: ${product.name} now at ${product.stockLevel} (reorder point ${product.reorderPoint})`;
    console.warn(message);
    await sendEmailAlert("Stock Reorder Alert - Telecom Inventory", message);
  }

  return { tx, product };
}

module.exports = {
  checkLowStock,
  startScheduledJobs,
  createTransactionAndMaybeAlert,
  sendEmailAlert, // exported for direct uses
};
