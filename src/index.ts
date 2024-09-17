import { WebSocketHandler } from "bun";
import { addGeneration, getCurrentGeneration, setCompleted } from "./utils/db";
import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import { WSContext } from "hono/ws";

const { upgradeWebSocket, websocket } = createBunWebSocket();
let websockets: WSContext[] = [];

const app = new Hono();

app.use(
  "/ws",
  upgradeWebSocket(() => {
    let index: number;
    return {
      onOpen(_, ws) {
        index = websockets.push(ws);
      },
      onClose() {
        websockets.splice(index, 1);
      },
    };
  }),
);

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

  for (const ws of websockets) {
    ws.send(
      JSON.stringify({
        type: "new-generation",
        generation: randomNumber,
      }),
    );
  }
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
  websocket: websocket as unknown as WebSocketHandler,
  port: parseInt(process.env.PORT ?? "3000"),
});
console.log(`Listening on ${server.hostname}:${server.port}`);
