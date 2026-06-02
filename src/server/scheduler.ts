import { queryTickets, closeBrowser } from './scraper.js';
import {
  getConfig,
  getTickets,
  updateTicket,
  isBought,
  type TicketInfo,
} from './store.js';

interface Task {
  trainNo: string;
  fromStation: string;
  toStation: string;
  seatTypes: string[];
  date: string;
}

let running = false;
let abortController: AbortController | null = null;

function generateDates(daysAhead: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(formatDate(d));
  }
  return dates;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function generateTasks(): Task[] {
  const config = getConfig();
  const dates = generateDates(config.daysAhead);
  const tasks: Task[] = [];

  for (const train of config.trains) {
    if (!train.enabled) continue;
    for (const date of dates) {
      // Skip if already bought for this train+date
      if (isBought(train.trainNo, date)) continue;

      tasks.push({
        trainNo: train.trainNo,
        fromStation: train.fromStation,
        toStation: train.toStation,
        seatTypes: train.seatTypes,
        date,
      });
    }
  }

  return tasks;
}

async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      resolve();
    }, { once: true });
  });
}

async function runTask(task: Task): Promise<void> {
  try {
    const results = await queryTickets(
      task.trainNo,
      task.fromStation,
      task.toStation,
      task.date,
      task.seatTypes,
    );

    const now = new Date().toISOString();
    for (const r of results) {
      const ticket: TicketInfo = {
        date: r.date,
        trainNo: r.trainNo,
        fromStation: r.fromStation,
        toStation: r.toStation,
        seatType: r.seatType,
        available: r.available,
        queryTime: now,
      };
      updateTicket(ticket);
    }

    console.log(`[${now}] Fetched ${task.trainNo} ${task.date}: ${results.length} seat types`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Failed ${task.trainNo} ${task.date}:`, (err as Error).message);
  }
}

export async function startScheduler() {
  if (running) return;
  running = true;
  abortController = new AbortController();
  const signal = abortController.signal;

  console.log('[Scheduler] Started');

  try {
    while (running && !signal.aborted) {
      const config = getConfig();
      const tasks = generateTasks();

      if (tasks.length === 0) {
        console.log('[Scheduler] No tasks, sleeping 60s...');
        await sleep(60_000, signal);
        continue;
      }

      const intervalMs = (config.intervalMinutes * 60 * 1000) / tasks.length;
      const minInterval = 3000; // at least 3s between requests
      const delay = Math.max(intervalMs, minInterval);

      console.log(`[Scheduler] Round start: ${tasks.length} tasks, delay ${Math.round(delay)}ms`);

      for (const task of tasks) {
        if (!running || signal.aborted) break;

        // Double-check: skip if bought during this round
        if (isBought(task.trainNo, task.date)) continue;

        await runTask(task);
        await sleep(delay, signal);
      }

      console.log('[Scheduler] Round complete, starting next round...');
    }
  } finally {
    running = false;
    abortController = null;
    await closeBrowser();
    console.log('[Scheduler] Stopped');
  }
}

export function stopScheduler() {
  running = false;
  abortController?.abort();
}

export function isRunning(): boolean {
  return running;
}
