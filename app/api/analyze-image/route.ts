import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return Response.json(
        { error: "Image file is required" },
        { status: 400 },
      );
    }

    if (!image.type.startsWith("image/")) {
      return Response.json(
        { error: "Uploaded file must be an image" },
        { status: 400 },
      );
    }

    const bytes = Buffer.from(await image.arrayBuffer());

    const base64Image = bytes.toString("base64");

    const response = await openai.responses.create({
      model: process.env.OPENAI_VISION_MODEL ?? "gpt-5.6-luna",
      max_output_tokens: 500,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
Analyze this image.

If it contains a coding problem:
1. State what the problem is asking.
2. Explain the simplest correct approach.
3. Give time and space complexity.
4. Keep the answer concise.

If it contains a general question:
Give a direct answer followed by a short explanation.

If the image is unclear, say exactly what cannot be read.
              `.trim(),
            },
            {
              type: "input_image",
              image_url: `data:${image.type};base64,${base64Image}`,
              detail: "high",
            },
          ],
        },
      ],
    });

    return Response.json({
      answer: response.output_text,
    });
  } catch (error) {
    console.error("Image analysis error:", error);

    return Response.json({ error: "Could not analyze image" }, { status: 500 });
  }
}
