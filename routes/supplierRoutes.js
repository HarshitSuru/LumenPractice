const express = require("express");
const { addSupplier, getSuppliers } = require("../controllers/supplierController");
const router = express.Router();

router.post("/", addSupplier);
router.get("/", getSuppliers);

module.exports = router;
