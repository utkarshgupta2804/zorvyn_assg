import path from "path";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import authRoutes from "./routes/auth.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import financialRoutes from "./routes/financial.routes";
import userRoutes from "./routes/user.routes";

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Finance Dashboard API",
      version: "1.0.0",
      description: "REST API for finance records, users, RBAC, and dashboard aggregations.",
    },
    servers: [{ url: "/" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [path.join(__dirname, "routes", "*.ts"), path.join(__dirname, "routes", "*.js")],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, answer) => {
    answer.json({ success: true, data: { status: "ok" } });
  });

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use("/auth", authRoutes);
  app.use("/users", userRoutes);
  app.use("/records", financialRoutes);
  app.use("/dashboard", dashboardRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}