import { exists } from "fs/promises";

interface Generation {
  time: number;
  generation: number;
}

interface Database {
  completed: boolean;
  currentGeneration: Generation;
  generations: Generation[];
}

if (!(await exists("db.json"))) {
  await Bun.write(
    "db.json",
    JSON.stringify({
      completed: false,
      currentGeneration: {
        time: 0,
        generation: 0,
      },
      generations: [],
    } satisfies Database),
  );
}

const dbFile = Bun.file("db.json");
const db: Database = await dbFile.json();

export function getCurrentGeneration() {
  return db.currentGeneration;
}

export function getGenerations() {
  return db.generations;
}

export function isCompleted() {
  return db.completed;
}

export function setCompleted(completed: boolean) {
  db.completed = completed;
}

export function addGeneration(generation: Generation) {
  db.currentGeneration = generation;
  db.generations.push(generation);
}

setInterval(async () => {
  await Bun.write("db.json", JSON.stringify(db));
}, 60 * 1000);
