import type { HealthResponse } from "@turium-assignment/contracts";
import express from "express";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  const body: HealthResponse = { status: "ok" };
  res.status(200).json(body);
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
