import { logToRun } from "./logger";

const HUGGINGFACE_API_URL =
  "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";

/**
 * Generate a featured image for a blog article using Stable Diffusion
 * via the HuggingFace Inference API.
 * Returns the base64 data URI of the generated image, or null if generation fails.
 *
 * Note: Unlike the monolith version, this does NOT save to the filesystem.
 * The image data is stored directly in the database as a URL or base64 reference.
 * For production, you should upload to an object store (S3, R2, etc.) and return the URL.
 */
export async function generateFeaturedImage(
  runId: string,
  articleTitle: string,
  slug: string
): Promise<string | null> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;

  if (!apiKey) {
    await logToRun(
      runId,
      "warn",
      "HUGGINGFACE_API_KEY not configured, skipping image generation"
    );
    return null;
  }

  const prompt = buildImagePrompt(articleTitle);

  try {
    await logToRun(runId, "info", `Generating featured image for: ${slug}`, {
      prompt,
    });

    const response = await fetch(HUGGINGFACE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          width: 1024,
          height: 576,
          num_inference_steps: 30,
          guidance_scale: 7.5,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      await logToRun(
        runId,
        "error",
        `HuggingFace API error: ${response.status}`,
        { error: errorText, slug }
      );
      return null;
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const base64 = imageBuffer.toString("base64");
    const imageUrl = `data:image/png;base64,${base64}`;

    await logToRun(runId, "info", `Featured image generated for: ${slug}`);

    return imageUrl;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await logToRun(runId, "error", `Image generation failed: ${message}`, {
      slug,
    });
    return null;
  }
}

function buildImagePrompt(articleTitle: string): string {
  const cleanTitle = articleTitle
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .toLowerCase()
    .trim();

  return [
    `Professional digital illustration for a cryptocurrency blog article about "${cleanTitle}".`,
    "Modern, clean design with subtle blockchain and crypto elements.",
    "Abstract geometric shapes, gradient colors in blue and purple tones.",
    "Professional financial technology aesthetic.",
    "High quality, 4K, sharp details, no text or watermarks.",
  ].join(" ");
}
