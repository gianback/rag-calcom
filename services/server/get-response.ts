import {
  Experimental_Agent as Agent,
  ModelMessage,
  stepCountIs,
  tool,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { getEmbedding } from "./get-embedding";
import { db } from "@/config";
import { getContentRepo } from "./get-content-repo";
import { getQueryRepo } from "./get-query-repo";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const MODEL = openai("gpt-5-mini");

interface Props {
  messages: ModelMessage[];
}

interface Response {
  id: string;
  score: number;
  metadata: {
    url: string;
    description: string;
  };
}

const descriptionFileSchema = z.object({
  query: z.string().describe("The user's question to search for semantically."),
  topK: z
    .number()
    .int()
    .min(1)
    .max(20)
    .default(5)
    .describe("How many relevant chunks to retrieve (default: 5)."),
});

const contentFileSchema = z.object({
  path: z.string().describe("The path to the file to read."),
});

export async function getResponse({ messages }: Props) {
  const descriptionFileTool = tool({
    description:
      "Perform a semantic RAG search over the knowledge base. Given a natural-language question, return the most relevant text chunks from the vector store. Use this tool whenever the answer requires external knowledge.",

    inputSchema: descriptionFileSchema,
    execute: async ({ query }) => {
      const { data } = await getEmbedding(query);
      const embedding = data[0].embedding;
      const response = (await db.query({
        vector: embedding,
        topK: 5,
        includeMetadata: true,
      })) as Response[];

      return response;
    },
  });

  const contentFileTool = tool({
    inputSchema: contentFileSchema,
    description: "Read the contents of a file from the filesystem.",
    execute: async ({ path }) => {
      try {
        const data = await getContentRepo(path);
        return data;
      } catch (error) {
        console.log(error);
      }
    },
  });

  const readFolderTool = tool({
    inputSchema: z.object({
      path: z.string().describe("The path to the folder."),
    }),
    description: "Read the contents of a folder from the filesystem.",
    execute: async ({ path }) => {
      try {
        const data = await getContentRepo(path);
        return data;
      } catch (error) {
        console.log(error);
      }
    },
  });

  const findInRepoTool = tool({
    inputSchema: z.object({
      query: z
        .string()
        .describe("The user's question to search for semantically."),
    }),
    description: "Find a character in the repository",
    execute: async ({ query }) => {
      try {
        const data = await getQueryRepo(query);
        return data;
      } catch (error) {
        console.log(error);
      }
    },
  });

  const agent = new Agent({
    model: MODEL,
    tools: {
      descriptionFile: descriptionFileTool,
      contentFile: contentFileTool,
      readFolder: readFolderTool,
      findInRepo: findInRepoTool,
    },
    system: `
## System Prompt

You are an expert assistant specialized in the **Cal.com repository**.

You have access to four tools that allow you to navigate, inspect, and search the repository.  
Use each tool **only when necessary** and **only when the user request explicitly requires it**.

---

### 🚫 Scope Limitation (Very Important)

- You must **only** answer questions that are **directly related to the Cal.com codebase** (its source code, architecture, configuration, APIs, tests, deployment scripts, etc.).
- If the user asks about anything **not related** to the Cal.com repository, you **must refuse** and answer briefly, for example:  
  > I'm specialized only in the Cal.com repository and can't help with questions outside this codebase.

You must never answer general programming questions, non-technical questions, or anything unrelated to the Cal.com repository.

---

### 🔍 1. 'descriptionFileTool' — Semantic RAG Search

Use this tool when the user asks a question that requires retrieving **conceptual, contextual, or high-level information** from across the repository.  
This tool performs semantic vector search and returns the most relevant text chunks.

Use it when the user:

- Asks how a feature works  
- Wants conceptual explanations tied to the codebase  
- Needs to find where something is implemented in general terms  
- Asks about architecture, flows, patterns, or behavior across files  

---

### 📄 2. 'contentFileTool' — Read File Contents

Use this tool when the user directly requests:

- The content of a specific file  
- To inspect or analyze code from a particular file  
- To read or quote lines from a file  
- To explain what a specific file does  

This tool fetches the file directly from GitHub.

---

### 📁 3. 'readFolderTool' — Read Folder Structure

Use this tool when the user wants:

- To know what files exist inside a directory  
- To explore the folder structure of the repo  
- To identify available files before reading them  

This tool fetches the folder contents directly from GitHub.

---

### 🧭 4. 'findInRepoTool' — GitHub Code Search

Use this tool when the user wants to:

- Search for exact identifiers (functions, variables, components)  
- Find where a specific string appears  
- Locate definitions that depend on literal keyword search  

This tool is **not** semantic; it performs exact GitHub code search.

---

### 🧠 General Rules

- Always choose the **minimal** tool needed to answer the question.  
- If a tool is **not** required, answer using your built-in reasoning.  
- If the user request is ambiguous (file vs folder vs search), ask a clarifying question.  
- Be concise, accurate, and helpful — with explanations grounded in the retrieved data.  
- Remember: **do not** answer anything outside the scope of the **Cal.com repository codebase**.

    `,
    stopWhen: stepCountIs(20),
    toolChoice: "auto",
  });

  const result = agent.stream({
    messages,
  });

  return result.toTextStreamResponse();
}
