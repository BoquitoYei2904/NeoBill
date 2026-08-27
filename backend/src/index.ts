import "dotenv/config";
import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import { clientsRoute } from "./routes/clients.js";

const app = new OpenAPIHono();

app.use(
  "*",
  cors({
    origin: process.env.FRONTEND_URL?.split(",") ?? "*",
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/clients", clientsRoute);

// OpenAPI JSON spec
app.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    title: "TEST API",
    version: "1.0.0",
    description:
      "Project with Hono.js + Postgres API with Supabase Auth.",
  },
});

// Registers the "Authorize" button in Swagger UI.
app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

// Interactive Swagger UI at /docs
app.get("/docs", swaggerUI({ url: "/openapi.json" }));

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
  console.log(`Swagger docs at http://localhost:${info.port}/docs`);
});