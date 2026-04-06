import dotenv from "dotenv";
dotenv.config();
import { createApp } from "./app";
import { connectDatabase } from "./config/database";
import { logger } from "./utils/logger";

const PORT = Number(process.env.PORT) || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

async function main() {
  if (!MONGODB_URI) {
    logger.error("MONGODB not connected");
    process.exit(1);
  }
  await connectDatabase(MONGODB_URI);

  const app = createApp();
  app.listen(PORT, () => {
    logger.info(`Server listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  logger.error("Fatal startup error", err);
  process.exit(1);
});