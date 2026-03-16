import "dotenv/config";
import { runContentPipeline } from "./pipeline";
import { closePool } from "./db";

/**
 * CLI entry point for blog generation.
 * Usage:
 *   node dist/cli.js [--topics=N] [--publish]
 *   ts-node src/cli.ts [--topics=N] [--publish]
 *
 * Options:
 *   --topics=N   Number of topics to generate (default: 3)
 *   --publish    Publish immediately instead of saving as draft
 *
 * Designed to be called via cron on Hetzner:
 *   0 6 * * * cd /path/to/blog-generator && node dist/cli.js --topics=3
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  let topicLimit = 3;
  let publishAsDraft = true;

  for (const arg of args) {
    if (arg.startsWith("--topics=")) {
      topicLimit = parseInt(arg.split("=")[1], 10) || 3;
    }
    if (arg === "--publish") {
      publishAsDraft = false;
    }
  }

  console.log(`[CLI] Starting content generation pipeline...`);
  console.log(`[CLI] Topics: ${topicLimit}, Draft: ${publishAsDraft}`);

  try {
    const result = await runContentPipeline({ topicLimit, publishAsDraft });

    console.log(`[CLI] Pipeline ${result.status}:`);
    console.log(`  Topics fetched: ${result.topicsFetched}`);
    console.log(`  Articles created: ${result.articlesCreated}`);
    console.log(`  Images generated: ${result.imagesGenerated}`);
    console.log(`  Errors: ${result.errorCount}`);
    console.log(`  Run ID: ${result.runId}`);

    process.exitCode = result.status === "completed" ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[CLI] Fatal error: ${message}`);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}

main();
