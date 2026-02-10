import express from "express";
import { CorrelationIdMiddleware } from "./middlewares/correlation-id.middleware";
import { ErrorHandlerMiddleware } from "./middlewares/error-handler.middleware";
import { NotFoundMiddleware } from "./middlewares/not-found.middleware";
import { routes } from "./routes";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(CorrelationIdMiddleware.handle);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(routes);
app.use(NotFoundMiddleware.handle);
app.use(ErrorHandlerMiddleware.handle);

export default app;
