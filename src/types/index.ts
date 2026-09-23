export interface Tray {
  id: number;
  code: string;
  zone: string;
  capacity_units: number;
  created_at: string;
}

export interface Batch {
  id: number;
  tray_id: number;
  crop: string;
  seeded_on: string;
  stage: string;
  expected_harvest_on: string;
}
export interface Harvest {
  id: number;
  batch_id: number;
  harvested_on: string;
  weight_grams: number;
  grade: string;
}