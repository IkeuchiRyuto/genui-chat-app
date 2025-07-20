import { azure } from "@ai-sdk/azure";
import { streamText } from "ai";
import { tools } from "@/app/ai/tools";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = streamText({
    model: azure("gpt-4.1"),
    messages,
    system:
      "あなたはユーザーの質問に答えるAIアシスタントです。質問に応じて各種ツールを使用して情報を提供します。",
    tools,
  });
  return result.toDataStreamResponse({
    getErrorMessage: errorHandler,
  });
}

export function errorHandler(error: unknown) {
  if (error == null) {
    return "unknown error";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return JSON.stringify(error);
}
