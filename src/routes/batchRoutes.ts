import { FastifyInstance } from "fastify";
import {
  createBatch,
  getAllBatches,
  getBatchById,
} from "../services/pgBatchService";
import { getTrayById } from "../services/pgTrayService";
import { updateBatchStage } from "../services/stageService";

export async function batchRoutes(app: FastifyInstance) {
  // CREATE BATCH
  app.post("/batches", async (request, reply) => {
    const body = request.body as {
      tray_id?: number;
      crop?: string;
      seeded_on?: string;
      stage?: string;
      expected_harvest_on?: string;
    };

    const validStages = [
      "SEEDED",
      "GERMINATION",
      "GROWING",
      "HARVEST_READY",
      "HARVESTED",
    ];

    if (
      body.tray_id === undefined ||
      typeof body.tray_id !== "number" ||
      body.tray_id <= 0 ||
      !body.crop ||
      !body.seeded_on ||
      !body.stage ||
      !body.expected_harvest_on ||
      !validStages.includes(body.stage)
    ) {
      return reply.status(400).send({
        message: "Invalid or missing batch fields",
      });
    }

    const tray = await getTrayById(body.tray_id);

    if (!tray) {
      return reply.status(404).send({
        message: "Tray not found",
      });
    }

    try {
      const batch = await createBatch(
        body.tray_id,
        body.crop,
        body.seeded_on,
        body.stage,
        body.expected_harvest_on
      );

      return reply.status(201).send(batch);
    } catch (error: any) {
      if (error.code === "23505") {
        return reply.status(409).send({
          message: "Tray already has an active batch",
        });
      }

      throw error;
    }
  });

  // UPDATE BATCH STAGE
  app.patch("/batches/:id/stage", async (request, reply) => {
    const { id } = request.params as { id: string };

    const batchId = Number(id);

    if (Number.isNaN(batchId) || batchId <= 0) {
      return reply.status(400).send({
        message: "Invalid batch ID",
      });
    }

    const body = request.body as {
      stage?: string;
    };

    const validStages = [
      "SEEDED",
      "GERMINATION",
      "GROWING",
      "HARVEST_READY",
      "HARVESTED",
    ];

    if (!body.stage || !validStages.includes(body.stage)) {
      return reply.status(400).send({
        message: "Invalid stage",
      });
    }

    try {
      const batch = await updateBatchStage(
        batchId,
        body.stage
      );

      if (!batch) {
        return reply.status(404).send({
          message: "Batch not found",
        });
      }

      return reply.send(batch);
    } catch (error: any) {
      if (error.message === "INVALID_STAGE_TRANSITION") {
        return reply.status(409).send({
          message: "Invalid stage transition",
        });
      }

      throw error;
    }
  });

  // GET ALL BATCHES
 app.get("/batches", async (request, reply) => {
  const query = request.query as {
    stage?: string;
    crop?: string;
    zone?: string;
    page?: string;
    limit?: string;
  };

  const page = query.page
    ? Number(query.page)
    : 1;

  const limit = query.limit
    ? Number(query.limit)
    : 20;

  if (
    !Number.isInteger(page) ||
    page <= 0 ||
    !Number.isInteger(limit) ||
    limit <= 0
  ) {
    return reply.status(400).send({
      message: "Invalid pagination parameters",
    });
  }

  const result = await getAllBatches({
    stage: query.stage,
    crop: query.crop,
    zone: query.zone,
    page,
    limit,
  });

  return reply.send(result);
});

  // GET BATCH BY ID
  app.get("/batches/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const batchId = Number(id);

    if (Number.isNaN(batchId) || batchId <= 0) {
      return reply.status(400).send({
        message: "Invalid batch ID",
      });
    }

    const batch = await getBatchById(batchId);

    if (!batch) {
      return reply.status(404).send({
        message: "Batch not found",
      });
    }

    return reply.send(batch);
  });
}