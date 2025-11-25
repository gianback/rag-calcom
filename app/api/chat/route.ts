import { getResponse } from "@/services/server/get-response";

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const stream = await getResponse({
      messages: body.messages,
    });

    return stream;
  } catch (error) {
    return new Response(JSON.stringify({ error }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
