import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { poweredBy } from "hono/powered-by";
import { logger } from "hono/logger";
import { countriesRoutes } from "./routes/countries.js";
import { basicRoutes } from "./routes/basic.js";
import { ERROR_MESSAGES, type Variables } from "./constants.js";
import { compress } from "hono/compress";
import { prettyJSON } from "hono/pretty-json";
import { timeout } from "hono/timeout";
import { trimTrailingSlash } from "hono/trailing-slash";
import { prometheus } from "@hono/prometheus";
import { showRoutes } from "hono/dev";

const app = new Hono<{
  Variables: Variables;
}>({ strict: true });

const { registerMetrics, printMetrics } = prometheus();

app.use(trimTrailingSlash());
app.use(poweredBy());
app.use(logger());
app.use(compress());
app.use(prettyJSON());

app.use("*", timeout(5000));

app.use("*", registerMetrics);

app.route("/", countriesRoutes);
app.route("/", basicRoutes);

app.get("/metrics", printMetrics);

app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json(
    {
      error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      details: err.message,
    },
    500
  );
});
const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

showRoutes(app, {
  verbose: true,
});

serve({
  fetch: app.fetch,
  port,
});
