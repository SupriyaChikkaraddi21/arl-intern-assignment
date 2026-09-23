import { FastifyInstance } from "fastify";
import {
  createHarvest,
  getYieldReport,
} from "../services/harvestService";

export async function harvestRoutes(app: FastifyInstance) {
  // CREATE HARVEST
  app.post("/harvests", async (request, reply) => {
    const body = request.body as {
      batch_id?: number;
      harvested_on?: string;
      weight_grams?: number;
      grade?: string;
    };

    if (
      body.batch_id === undefined ||
      typeof body.batch_id !== "number" ||
      body.batch_id <= 0 ||
      !body.harvested_on ||
      body.weight_grams === undefined ||
      typeof body.weight_grams !== "number" ||
      body.weight_grams <= 0 ||
      !body.grade
    ) {
      return reply.status(400).send({
        message: "Invalid or missing harvest fields",
      });
    }

    try {
      const harvest = await createHarvest(
        body.batch_id,
        body.harvested_on,
        body.weight_grams,
        body.grade
      );

      return reply.status(201).send(harvest);
    } catch (error: any) {
      if (error.message === "BATCH_NOT_FOUND") {
        return reply.status(404).send({
          message: "Batch not found",
        });
      }

      if (error.message === "BATCH_NOT_READY_FOR_HARVEST") {
        return reply.status(409).send({
          message: "Batch is not ready for harvest",
        });
      }

      throw error;
    }
  });

  // YIELD REPORT
  app.get("/reports/yield", async (request, reply) => {
    const report = await getYieldReport();

    return reply.send(report);
  });
}