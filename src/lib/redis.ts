import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.warn(
    "[Redis] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not set. " +
      "Redis operations will fail at runtime."
  );
}

export const redis = new Redis({
  url: url ?? "",
  token: token ?? "",
});
