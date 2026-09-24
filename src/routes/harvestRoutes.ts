import { FastifyInstance } from "fastify";
import {
  createHarvest,
  getYieldReport,
} from "../services/harvestService";

export async function harvestRoutes(app: FastifyInstance) {
  // CREATE HARVEST
  app.post("/batches/:id/harvest", async (request, reply) => {
    const { id } = request.params as { id: string };
    const batchId = Number(id);

    if (!Number.isInteger(batchId) || batchId <= 0) {
      return reply.status(400).send({
        message: "Invalid batch ID",
      });
    }

    const body = request.body as {
      harvested_on?: string;
      weight_grams?: number;
      grade?: string;
    };

    if (
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
        batchId,
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
  const query = request.query as {
    from?: string;
    to?: string;
    group_by?: string;
  };

  const { from, to, group_by } = query;

  if (!from || !to || !group_by) {
    return reply.status(400).send({
      message: "from, to and group_by are required",
    });
  }

  if (group_by !== "crop" && group_by !== "zone") {
    return reply.status(400).send({
      message: "group_by must be either crop or zone",
    });
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);

  if (
    Number.isNaN(fromDate.getTime()) ||
    Number.isNaN(toDate.getTime())
  ) {
    return reply.status(400).send({
      message: "Invalid date format",
    });
  }

  if (fromDate > toDate) {
    return reply.status(400).send({
      message: "from date cannot be after to date",
    });
  }

  const report = await getYieldReport(
    from,
    to,
    group_by
  );

  return reply.send(report);
});
}
