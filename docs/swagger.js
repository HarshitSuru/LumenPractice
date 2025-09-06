// docs/swagger.js
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");

// Create a minimal OpenAPI spec programmatically or load a YAML file.
// Here we'll create a small spec inline to document key endpoints.
const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Telecom Inventory API",
    version: "1.0.0",
    description: "APIs for products, suppliers, transactions, auth",
  },
  servers: [{ url: "http://localhost:5000" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/api/auth/signup": {
      post: {
        summary: "Signup",
        requestBody: { content: { "application/json": { schema: { type: "object" } } } },
        responses: { "201": { description: "Created" } },
      },
    },
    "/api/auth/login": {
      post: { summary: "Login", responses: { "200": { description: "OK" } } },
    },
    "/api/products": {
      get: { summary: "List products", parameters: [
        { name: "search", in: "query", schema: { type: "string" } },
        { name: "category", in: "query", schema: { type: "string" } },
        { name: "stockStatus", in: "query", schema: { type: "string", enum: ["low","out","ok"] } },
      ], responses: { "200": { description: "OK" } } },
      post: { summary: "Add product", requestBody: { content: { "application/json": { schema: { type: "object" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/api/products/{id}/stock-in": {
      post: { summary: "Stock in", parameters: [{ name: "id", in: "path", required: true }], responses: { "201": { description: "Created" } } }
    },
    "/api/products/{id}/stock-out": {
      post: { summary: "Stock out", parameters: [{ name: "id", in: "path", required: true }], responses: { "201": { description: "Created" } } }
    }
  }
};

function setupSwagger(app) {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

module.exports = setupSwagger;
