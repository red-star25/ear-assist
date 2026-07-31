export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return Response.json(
        {
          error: "OPENAI_API_KEY is not configured",
        },
        {
          status: 500,
        },
      );
    }

    const contentType = request.headers.get("content-type");

    if (!contentType?.startsWith("multipart/form-data")) {
      return Response.json(
        {
          error: "Expected multipart/form-data request",
        },
        {
          status: 400,
        },
      );
    }

    // Preserve the exact multipart body created by the browser.
    const requestBody = await request.arrayBuffer();

    const openAIResponse = await fetch(
      "https://api.openai.com/v1/realtime/calls",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": contentType,
        },
        body: requestBody,
      },
    );

    const responseBody = await openAIResponse.text();

    if (!openAIResponse.ok) {
      console.error(
        "OpenAI Realtime API error:",
        openAIResponse.status,
        responseBody,
      );
    }

    return new Response(responseBody, {
      status: openAIResponse.status,
      headers: {
        "Content-Type":
          openAIResponse.headers.get("content-type") ??
          (openAIResponse.ok ? "application/sdp" : "application/json"),
      },
    });
  } catch (error) {
    console.error("Realtime route error:", error);

    return Response.json(
      {
        error: "Unexpected server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
      },
    );
  }
}
