export type Role = "assistant" | "user";

export type Message = {
  id: number;
  role: Role;
  content: string;
  time: string;
};
interface Props {
  messages: {
    role: Role;
    content: string;
  }[];
  setAnswer: (text: string) => void;
  controller?: AbortController;
}
export async function getAnswer({
  messages,
  setAnswer,
  controller,
}: Props): Promise<void> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    signal: controller?.signal,
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get answer: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder("utf-8");

  if (!reader) return;

  while (true) {
    const { value, done } = await reader.read();

    if (done) break;

    const lines = decoder.decode(value, { stream: true });

    setAnswer(lines);
  }
}
