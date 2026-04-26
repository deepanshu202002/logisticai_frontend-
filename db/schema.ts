import { pgTable, serial, text, integer, doublePrecision, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";

export const trucks = pgTable("trucks", {
  id: text("id").primaryKey(),
  origin: text("origin"),
  destination: text("destination"),
  current_lat: doublePrecision("current_lat"),
  current_lng: doublePrecision("current_lng"),
  status: text("status"),
  delay_minutes: integer("delay_minutes").default(0),
  cargo: text("cargo"),
  weight_tons: doublePrecision("weight_tons"),
  weather_condition: text("weather_condition"),
  traffic_level: text("traffic_level"),
  driver_name: text("driver_name"),
  current_route: jsonb("current_route"),
  rerouted_route: jsonb("rerouted_route"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const hubs = pgTable("hubs", {
  id: text("id").primaryKey(),
  city: text("city"),
  hub_type: text("hub_type"),
  capacity: integer("capacity"),
  current_load: integer("current_load"),
  status: text("status"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
});

export const packages = pgTable("packages", {
  id: text("id").primaryKey(),
  origin_hub: text("origin_hub").references(() => hubs.id),
  destination_hub: text("destination_hub").references(() => hubs.id),
  current_hub: text("current_hub").references(() => hubs.id),
  status: text("status"),
  stuck_hours: doublePrecision("stuck_hours").default(0),
  item_name: text("item_name"),
  priority: text("priority"),
  created_at: timestamp("created_at").defaultNow(),
});

export const riders = pgTable("riders", {
  id: text("id").primaryKey(),
  name: text("name"),
  zone: text("zone"),
  current_lat: doublePrecision("current_lat"),
  current_lng: doublePrecision("current_lng"),
  status: text("status"),
  active_order_id: text("active_order_id"),
  eta_minutes: integer("eta_minutes"),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const zones = pgTable("zones", {
  id: text("id").primaryKey(),
  name: text("name"),
  city: text("city"),
  traffic_level: text("traffic_level"),
  avg_delivery_minutes: doublePrecision("avg_delivery_minutes"),
  active_orders: integer("active_orders").default(0),
  available_riders: integer("available_riders").default(0),
  status: text("status"),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  alert_type: text("alert_type"),
  severity: text("severity"),
  entity_type: text("entity_type"),
  entity_id: text("entity_id"),
  message: text("message"),
  resolved: boolean("resolved").default(false),
  created_at: timestamp("created_at").defaultNow(),
  resolved_at: timestamp("resolved_at"),
});

export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  entity_type: text("entity_type"),
  entity_id: text("entity_id"),
  delay_probability: doublePrecision("delay_probability"),
  delay_category: text("delay_category"),
  features_used: jsonb("features_used"),
  model_version: text("model_version").default("xgb_v1"),
  predicted_at: timestamp("predicted_at").defaultNow(),
});

export const routeHistories = pgTable("route_history", {
  id: serial("id").primaryKey(),
  truck_id: text("truck_id").references(() => trucks.id),
  original_route: jsonb("original_route"),
  optimized_route: jsonb("optimized_route"),
  distance_km: doublePrecision("distance_km"),
  estimated_time_hours: doublePrecision("estimated_time_hours"),
  disruptions_avoided: jsonb("disruptions_avoided"),
  applied: boolean("applied").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: text("id").primaryKey(), // HBS-YYYYMMDD-XXXXX
  type: text("type").notNull(), // 'bulk' or 'parcel'
  seller_city: text("seller_city"),
  buyer_city: text("buyer_city"),
  route: jsonb("route").notNull(),
  priority: text("priority").default("standard"),
  weight_kg: doublePrecision("weight_kg"),
  eta_date: timestamp("eta_date").notNull(),
  status: text("status").default("booked"),
  created_at: timestamp("created_at").defaultNow(),
});

export const trackingEvents = pgTable("tracking_events", {
  id: serial("id").primaryKey(),
  booking_id: text("booking_id").references(() => bookings.id),
  status: text("status").notNull(),
  location: text("location"),
  message: text("message"),
  timestamp: timestamp("timestamp").defaultNow(),
});
