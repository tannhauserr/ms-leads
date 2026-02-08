import express from "express";
import { correlationIdMiddleware } from "./middlewares/correlation-id.middleware";
import { errorHandlerMiddleware } from "./middlewares/error-handler.middleware";
import { notFoundMiddleware } from "./middlewares/not-found.middleware";
import { routes } from "./routes";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(correlationIdMiddleware);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(routes);
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

export default app;
