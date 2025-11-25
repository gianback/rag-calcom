interface EmbeddingResp {
  data: {
    embedding: number[];
    index: number;
    object: string;
  }[];
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}
export async function getEmbedding(text: string): Promise<EmbeddingResp> {
  const response = await fetch(`${process.env.API_URL!}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.API_TOKEN!}`,
    },
    body: JSON.stringify({
      input: [text],
      model: "text-embedding-3-small",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get embedding: ${response.statusText}`);
  }

  const data = await response.json();

  return data;
}
