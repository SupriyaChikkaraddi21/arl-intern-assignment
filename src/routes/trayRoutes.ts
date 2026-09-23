import { FastifyInstance } from "fastify";
import {
  createTray,
  getAllTrays,
  getTrayById,
} from "../services/pgTrayService";

export async function trayRoutes(app: FastifyInstance) {
  app.post("/trays", async (request, reply) => {
    const body = request.body as {
      code?: string;
      zone?: string;
      capacity_units?: number;
    };

    if (
      !body.code ||
      !body.zone ||
      body.capacity_units === undefined ||
      typeof body.capacity_units !== "number" ||
      body.capacity_units <= 0
    ) {
      return reply.status(400).send({
        message: "Invalid or missing tray fields",
      });
    }

    try {
      const tray = await createTray(
        body.code,
        body.zone,
        body.capacity_units
      );

      return reply.status(201).send(tray);
    } catch (error: any) {
      if (error.code === "23505") {
        return reply.status(409).send({
          message: "Tray code already exists",
        });
      }

      throw error;
    }
  });

  app.get("/trays", async () => {
    return getAllTrays();
  });

  app.get("/trays/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const trayId = Number(id);

    if (Number.isNaN(trayId) || trayId <= 0) {
      return reply.status(400).send({
        message: "Invalid tray ID",
      });
    }

    const tray = await getTrayById(trayId);

    if (!tray) {
      return reply.status(404).send({
        message: "Tray not found",
      });
    }

    return reply.send(tray);
  });
}