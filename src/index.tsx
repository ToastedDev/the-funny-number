import type { WebSocketHandler } from "bun";
import { addGeneration, getCurrentGeneration, setCompleted } from "./utils/db";
import { Hono } from "hono";
import { createBunWebSocket, serveStatic } from "hono/bun";
import type { WSContext } from "hono/ws";
import { html } from "hono/html";

const { upgradeWebSocket, websocket } = createBunWebSocket();
let websockets: WSContext[] = [];

const app = new Hono();
app.use("/*", serveStatic({ root: "public" }));

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
  const { generation: currentGeneration } = getCurrentGeneration();
  return c.html(
    <html>
      <head>
        <title>Random Number Generator</title>
        <link rel="stylesheet" href="/odometer.css" />
        <script src="/odometer.js"></script>
      </head>
      <body>
        <h1>Hello World!</h1>
        <span class="odometer">{currentGeneration}</span>
      </body>
      {html`
        <script>
          const ws = new WebSocket("ws://localhost:3000/ws");
          ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "new-generation") {
              const odometer = document.querySelector(".odometer");
              odometer.innerHTML = data.generation;
            }
          };
        </script>
      `}
    </html>,
  );
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
