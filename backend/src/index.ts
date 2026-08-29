import "dotenv/config";
import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import { clientsRoute } from "./routes/clients.js";
import { configsRoute } from "./routes/configs.js";
import { productsRoute } from "./routes/products.js";
import { licitationsRoute } from "./routes/licitations.js";
import { historyRoute } from "./routes/history.js";
import { authRoute } from "./routes/auth.js";
import { usersRoute } from "./routes/users.js";

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
app.route("/configs", configsRoute);
app.route("/products", productsRoute);
app.route("/licitations", licitationsRoute);
app.route("/history", historyRoute);
app.route("/auth", authRoute);
app.route("/users", usersRoute);


// OpenAPI JSON spec
app.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    title: "NeoBill API",
    version: "1.1.0",
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
