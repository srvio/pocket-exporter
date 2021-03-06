import express from "express";
import { register, collectDefaultMetrics } from "prom-client";
import { init } from "./pokt-poller";

const { INCLUDE_NODEJS_METRICS } = process.env;

if (INCLUDE_NODEJS_METRICS === "true") {
  collectDefaultMetrics({ register });
}

const app = express();

app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

init();

const server = app.listen(9000);

console.log("Listening on :9000/metrics");

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});
