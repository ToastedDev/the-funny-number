import { addGeneration, getCurrentGeneration, setCompleted } from "./utils/db";
import { Hono } from "hono";

const app = new Hono();

function random(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}

setInterval(() => {
  const randomNumber = random(1, 100_000_000);
  if (randomNumber === 69_696_969) {
    setCompleted(true);
  }

  addGeneration({
    time: Date.now(),
    generation: randomNumber,
  });
}, 1000);

app.get("/", (c) => {
  return c.text("Hello World!");
});

app.get("/generations/current", (c) => {
  const generation = getCurrentGeneration();
  return c.json(generation);
});

const server = Bun.serve({
  fetch: app.fetch,
  port: parseInt(process.env.PORT ?? "3000"),
});
console.log(`Listening on ${server.hostname}:${server.port}`);
