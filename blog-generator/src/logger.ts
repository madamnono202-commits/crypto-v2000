import { query } from "./db";

export type LogLevel = "info" | "warn" | "error";

/**
 * Generate a cuid-like ID without external dependencies.
 */
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `clg${timestamp}${random}`;
}

/**
 * Create a new automation run record.
 */
export async function createRun(): Promise<string> {
  const id = generateId();
  await query(
    `INSERT INTO automation_runs (id, job_type, status, started_at, created_at)
     VALUES ($1, $2, $3, NOW(), NOW())`,
    [id, "content-generation", "running"]
  );
  return id;
}

/**
 * Log a message to an automation run.
 */
export async function logToRun(
  runId: string,
  level: LogLevel,
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const id = generateId();
    await query(
      `INSERT INTO automation_logs (id, run_id, level, message, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [id, runId, level, message, metadata ? JSON.stringify(metadata) : null]
    );
  } catch {
    console.error(`[AutomationLog] Failed to persist log: ${message}`);
  }
}

/**
 * Update the status and metadata of an automation run.
 */
export async function updateRunStatus(
  runId: string,
  status: string,
  updates?: {
    topicsFetched?: number;
    articlesCreated?: number;
    imagesGenerated?: number;
    errorCount?: number;
    resultSummary?: string;
    completedAt?: Date;
  }
): Promise<void> {
  const setClauses: string[] = ["status = $2"];
  const params: unknown[] = [runId, status];
  let paramIndex = 3;

  if (updates?.topicsFetched !== undefined) {
    setClauses.push(`topics_fetched = $${paramIndex}`);
    params.push(updates.topicsFetched);
    paramIndex++;
  }
  if (updates?.articlesCreated !== undefined) {
    setClauses.push(`articles_created = $${paramIndex}`);
    params.push(updates.articlesCreated);
    paramIndex++;
  }
  if (updates?.imagesGenerated !== undefined) {
    setClauses.push(`images_generated = $${paramIndex}`);
    params.push(updates.imagesGenerated);
    paramIndex++;
  }
  if (updates?.errorCount !== undefined) {
    setClauses.push(`error_count = $${paramIndex}`);
    params.push(updates.errorCount);
    paramIndex++;
  }
  if (updates?.resultSummary !== undefined) {
    setClauses.push(`result_summary = $${paramIndex}`);
    params.push(updates.resultSummary);
    paramIndex++;
  }
  if (updates?.completedAt !== undefined) {
    setClauses.push(`completed_at = $${paramIndex}`);
    params.push(updates.completedAt);
    paramIndex++;
  }

  await query(
    `UPDATE automation_runs SET ${setClauses.join(", ")} WHERE id = $1`,
    params
  );
}
