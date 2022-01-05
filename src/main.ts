import express from "express";
import { register, collectDefaultMetrics } from "prom-client";
import { init } from "./pokt-poller";

collectDefaultMetrics({ register });

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

app.listen(9000);

console.log("Listening on :9000/metrics");
