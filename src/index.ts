import { getCurrentGeneration } from "./utils/db";
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  console.log(getCurrentGeneration());
  return c.text("Hello World!");
});

const server = Bun.serve({
  fetch: app.fetch,
  port: parseInt(process.env.PORT ?? "3000"),
});
console.log(`Listening on ${server.hostname}:${server.port}`);
