import { describe, expect, test } from "vitest";
import Fastify from "fastify";

import { trayRoutes } from "../src/routes/trayRoutes";
import { batchRoutes } from "../src/routes/batchRoutes";
import { harvestRoutes } from "../src/routes/harvestRoutes";

const buildApp = async () => {
  const app = Fastify();

  await app.register(trayRoutes);
  await app.register(batchRoutes);
  await app.register(harvestRoutes);

  return app;
};

describe("API tests", () => {
  test("GET /trays returns trays", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/trays",
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();

    expect(Array.isArray(body)).toBe(true);

    await app.close();
  });

  test("GET /trays/:id returns 404 for missing tray", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/trays/999999",
    });

    expect(response.statusCode).toBe(404);

    expect(response.json()).toEqual({
      message: "Tray not found",
    });

    await app.close();
  });

  test("GET /trays/:id rejects invalid ID", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/trays/abc",
    });

    expect(response.statusCode).toBe(400);

    expect(response.json()).toEqual({
      message: "Invalid tray ID",
    });

    await app.close();
  });

  test("POST /trays rejects invalid capacity", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/trays",
      payload: {
        code: "TEST-INVALID",
        zone: "Z",
        capacity_units: 0,
      },
    });

    expect(response.statusCode).toBe(400);

    expect(response.json()).toEqual({
      message: "Invalid or missing tray fields",
    });

    await app.close();
  });

  test("POST /batches rejects missing tray", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/batches",
      payload: {
        tray_id: 999999,
        crop: "Test Crop",
        seeded_on: "2026-09-24",
        stage: "SEEDED",
        expected_harvest_on: "2026-10-20",
      },
    });

    expect(response.statusCode).toBe(404);

    expect(response.json()).toEqual({
      message: "Tray not found",
    });

    await app.close();
  });

  test("POST /batches rejects invalid stage", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/batches",
      payload: {
        tray_id: 1,
        crop: "Test Crop",
        seeded_on: "2026-09-24",
        stage: "INVALID_STAGE",
        expected_harvest_on: "2026-10-20",
      },
    });

    expect(response.statusCode).toBe(400);

    expect(response.json()).toEqual({
      message: "Invalid or missing batch fields",
    });

    await app.close();
  });

  test("GET /batches returns paginated response", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/batches?page=1&limit=1",
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();

    expect(body).toHaveProperty("value");
    expect(body).toHaveProperty("Count");
    expect(Array.isArray(body.value)).toBe(true);
    expect(body.value.length).toBeLessThanOrEqual(1);

    await app.close();
  });

  test("GET /batches rejects invalid pagination", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/batches?page=0&limit=10",
    });

    expect(response.statusCode).toBe(400);

    expect(response.json()).toEqual({
      message: "Invalid pagination parameters",
    });

    await app.close();
  });

  test("POST /batches/:id/harvest rejects missing batch", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/batches/999999/harvest",
      payload: {
        harvested_on: "2026-09-24",
        weight_grams: 500,
        grade: "A",
      },
    });

    expect(response.statusCode).toBe(404);

    expect(response.json()).toEqual({
      message: "Batch not found",
    });

    await app.close();
  });

  test("POST /batches/:id/harvest rejects invalid weight", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/batches/1/harvest",
      payload: {
        harvested_on: "2026-09-24",
        weight_grams: 0,
        grade: "A",
      },
    });

    expect(response.statusCode).toBe(400);

    expect(response.json()).toEqual({
      message: "Invalid or missing harvest fields",
    });

    await app.close();
  });

  test("POST /batches/:id/harvest rejects invalid batch ID", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/batches/abc/harvest",
      payload: {
        harvested_on: "2026-09-24",
        weight_grams: 500,
        grade: "A",
      },
    });

    expect(response.statusCode).toBe(400);

    expect(response.json()).toEqual({
      message: "Invalid batch ID",
    });

    await app.close();
  });

  test("POST /batches/:id/harvest rejects missing harvested date", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/batches/1/harvest",
      payload: {
        weight_grams: 500,
        grade: "A",
      },
    });

    expect(response.statusCode).toBe(400);

    expect(response.json()).toEqual({
      message: "Invalid or missing harvest fields",
    });

    await app.close();
  });

  test("POST /batches/:id/harvest rejects missing grade", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/batches/1/harvest",
      payload: {
        harvested_on: "2026-09-24",
        weight_grams: 500,
      },
    });

    expect(response.statusCode).toBe(400);

    expect(response.json()).toEqual({
      message: "Invalid or missing harvest fields",
    });

    await app.close();
  });

  test("GET /reports/yield returns yield report", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/reports/yield",
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();

    expect(Array.isArray(body)).toBe(true);

    if (body.length > 0) {
      expect(body[0]).toHaveProperty("crop");
      expect(body[0]).toHaveProperty("grade");
      expect(body[0]).toHaveProperty("total_weight_grams");
    }

    await app.close();
  });
});