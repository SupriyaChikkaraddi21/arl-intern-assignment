CREATE TABLE IF NOT EXISTS trays (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    zone VARCHAR(50) NOT NULL,
    capacity_units INTEGER NOT NULL CHECK (capacity_units > 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS batches (
    id SERIAL PRIMARY KEY,
    tray_id INTEGER NOT NULL REFERENCES trays(id),
    crop VARCHAR(100) NOT NULL,
    seeded_on DATE NOT NULL,
    stage VARCHAR(30) NOT NULL,
    expected_harvest_on DATE NOT NULL,

    CONSTRAINT batches_stage_check
        CHECK (
            stage IN (
                'SEEDED',
                'GERMINATION',
                'GROWING',
                'HARVEST_READY',
                'HARVESTED'
            )
        )
);
CREATE UNIQUE INDEX IF NOT EXISTS batches_one_active_per_tray
ON batches (tray_id)
WHERE stage <> 'HARVESTED';
CREATE TABLE IF NOT EXISTS harvests (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER NOT NULL REFERENCES batches(id),
    harvested_on DATE NOT NULL,
    weight_grams INTEGER NOT NULL CHECK (weight_grams > 0),
    grade VARCHAR(20) NOT NULL
);