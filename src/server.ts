import Fastify from "fastify";
import "./db";
import { trayRoutes } from "./routes/trayRoutes";
import { batchRoutes } from "./routes/batchRoutes";
import { harvestRoutes } from "./routes/harvestRoutes";
const app = Fastify({
  logger: true,
});
app.register(trayRoutes);
app.register(batchRoutes);
app.register(harvestRoutes);
app.get("/", async () => {
  return {
    message: "AgResearch Labs API is running",
  };
});

const start = async () => {
  try {
    await app.listen({
      port: 3000,
      host: "0.0.0.0",
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();