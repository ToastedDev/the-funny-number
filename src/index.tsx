import type { WebSocketHandler } from "bun";
import {
  addGeneration,
  getCurrentGeneration,
  getGenerations,
  isCompleted,
  setCompleted,
} from "./utils/db";
import { Hono } from "hono";
import { createBunWebSocket, serveStatic } from "hono/bun";
import type { WSContext } from "hono/ws";
import { html } from "hono/html";
import { css, cx, Style } from "hono/css";

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
        ws.send(
          JSON.stringify({
            type: "generations",
            generations: getGenerations().slice(-60),
          }),
        );
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
  if (isCompleted()) return;

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
  const { generation: currentGeneration, time } = getCurrentGeneration();
  const date = new Date(time);
  const generations = getGenerations();
  const completed = isCompleted();

  const mainHeaderClass = css`
    font-weight: 400;
    font-size: 1.2rem;
    text-align: center;
  `;
  const numberHeaderClass = css`
    text-align: center;
    font-size: 4rem;
    color: aquamarine;
  `;
  const cardClass = css`
    background-color: #09090b;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    border-radius: 0.5rem;
    padding: 1rem;
  `;
  const countClass = css`
    font-size: 6rem;
    font-weight: 600;
    line-height: 1.2em;
  `;
  const smallCountClass = css`
    font-size: 1.8rem;
    font-weight: 600;
    line-height: 1.2em;
  `;
  const smallParagraphClass = css`
    font-size: 0.9rem;
  `;
  const gridClass = css`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  `;
  const dateWrapperClass = css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
  `;
  const datePartClass = css`
    display: flex;
    align-items: center;
  `;
  const chartClass = css`
    width: 100%;
  `;

  return c.html(
    <html>
      <head>
        <title>The Funny Number</title>
        <link rel="stylesheet" href="/odometer.css" />
        <script src="/odometer.js"></script>
        <script src="https://code.highcharts.com/highcharts.js"></script>
        <Style>
          {css`
            @import url("https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap");

            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              background-color: #18181b;
              color: white;
              font-family: "Inter", sans-serif;
              padding: 1rem;
              max-width: 56rem;
              margin-inline: auto;
              display: flex;
              flex-direction: column;
              gap: 0.75rem;
            }
          `}
        </Style>
      </head>
      <body>
        <h1 class={mainHeaderClass}>
          {completed
            ? "We did it!! We generated"
            : "Generating random numbers until we get"}
        </h1>
        <h1 class={numberHeaderClass}>69,696,969</h1>
        <div class={cardClass}>
          <span class={cx(countClass, "odometer")} id="current-gen">
            {currentGeneration}
          </span>
          <p>Current generation</p>
        </div>
        <div class={gridClass}>
          <div class={cardClass}>
            <span
              class={cx(smallCountClass, "odometer")}
              id="generations"
              data-generations={generations.length}
            >
              {generations.length}
            </span>
            <p class={smallParagraphClass}>Generations</p>
          </div>
          <div class={cardClass}>
            <div class={dateWrapperClass} id="date-wrapper">
              <div class={datePartClass}>
                <span class={cx(smallCountClass, "odometer")} id="year">
                  {date.getUTCFullYear()}
                </span>
                <p class={smallCountClass}>-</p>
                <span class={cx(smallCountClass, "odometer")} id="month">
                  {date.getUTCMonth() + 1}
                </span>
                <p class={smallCountClass}>-</p>
                <span class={cx(smallCountClass, "odometer")} id="day">
                  {date.getUTCDate()}
                </span>
              </div>
              <div class={datePartClass}>
                <span class={cx(smallCountClass, "odometer")} id="hour">
                  {date.getUTCHours()}
                </span>
                <p class={smallCountClass}>:</p>
                <span class={cx(smallCountClass, "odometer")} id="minute">
                  {date.getUTCMinutes()}
                </span>
                <p class={smallCountClass}>:</p>
                <span class={cx(smallCountClass, "odometer")} id="second">
                  {date.getUTCSeconds()}
                </span>
              </div>
              <p class={smallCountClass}>UTC</p>
            </div>
            <p class={smallParagraphClass}>Time generated</p>
          </div>
        </div>
        <div class={cardClass}>
          <div class={chartClass} id="chart"></div>
        </div>
      </body>
      {html`
        <script>
          const element = document.getElementById("date-wrapper");
          for (const el of element.querySelectorAll(".odometer")) {
            new Odometer({
              el,
              value: parseInt(el.textContent),
              format: "(ddd)",
              minIntegerLen: 2,
            });
          }

          const chart = Highcharts.chart("chart", {
            chart: {
              type: "line",
              zoomType: "x",
              animation: false,
              backgroundColor: "transparent",
              style: {
                fontFamily: '"Inter", sans-serif',
                color: "white",
              },
            },
            title: {
              text: "Generations in the past minute",
              style: {
                color: "white",
              },
            },
            xAxis: {
              type: "datetime",
              title: {
                text: "Time",
                style: {
                  color: "white",
                  fontWeight: "bold",
                },
              },
              labels: {
                style: {
                  color: "#E0E0E0",
                },
                format: "{value:%H:%M:%S}",
              },
              dateTimeLabelFormats: {
                second: "%H:%M:%S",
                minute: "%H:%M",
                hour: "%H:%M",
                day: "%e. %b",
                week: "%e. %b",
                month: "%b '%y",
                year: "%Y",
              },
              tickPixelInterval: 150,
              lineColor: "#333333",
              tickColor: "#333333",
            },
            yAxis: {
              title: {
                text: "Generation",
                style: {
                  color: "#E0E0E0",
                  fontWeight: "bold",
                },
              },
              plotBands: [
                {
                  from: 60_000_000,
                  to: 69_696_969,
                  color: "#27272a",
                },
              ],
              labels: {
                style: {
                  color: "white",
                },
              },
              gridLineColor: "#333333",
              min: 0,
              max: 100_000_000,
            },
            legend: {
              enabled: false,
            },
            plotOptions: {
              line: {
                marker: {
                  enabled: false,
                },
              },
            },
            series: [
              {
                name: "Generations",
                color: "aquamarine",
              },
            ],
            credits: {
              enabled: true,
              text: "The Funny Number",
              href: "/",
              style: {
                color: "#E0E0E0",
              },
            },
          });

          const ws = new WebSocket("ws://localhost:3000/ws");
          ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "new-generation") {
              const date = new Date();

              const currentGeneration = document.getElementById("current-gen");
              currentGeneration.innerHTML = data.generation;

              if (chart.series[0].points.length > 60) {
                chart.series[0].data[0].remove();
              }
              chart.series[0].addPoint([date.getTime(), data.generation]);

              const generations = document.getElementById("generations");
              generations.setAttribute(
                "data-generations",
                parseInt(generations.getAttribute("data-generations")) + 1,
              );
              generations.innerHTML =
                generations.getAttribute("data-generations");

              document.getElementById("year").innerHTML = date.getUTCFullYear();
              document.getElementById("month").innerHTML =
                date.getUTCMonth() + 1;
              document.getElementById("day").innerHTML = date.getUTCDate();
              document.getElementById("hour").innerHTML = date.getUTCHours();
              document.getElementById("minute").innerHTML =
                date.getUTCMinutes();
              document.getElementById("second").innerHTML =
                date.getUTCSeconds();
            } else if (data.type === "generations") {
              chart.series[0].setData(
                data.generations.map((g) => [g.time, g.generation]),
              );
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
