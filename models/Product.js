const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: String,
    stockLevel: { type: Number, required: true, default: 0 },
    reorderPoint: { type: Number, default: 5 },
});

module.exports = mongoose.model("Product", productSchema);
