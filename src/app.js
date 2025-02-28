import express from "express";
import cors from "cors";
import repoRoutes from "./routes/repoRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/repos", repoRoutes);
app.use("/feedback", feedbackRoutes);

export default app;
