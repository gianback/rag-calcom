"use client";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { getAnswer, Message } from "@/services/client/get-answer";
import Image from "next/image";
import { MessageItem } from "./MessageItem";
import { Loading } from "./Loading";

const seededMessages: Message[] = [];
const LOCAL_STORAGE_KEY = "chatMessages";

export default function Hero() {
  const [messages, setMessages] = useState<Message[]>(seededMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const abortController = useRef<AbortController | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const text = input.trim();
    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: text,
      time: now,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      abortController.current?.abort();
      abortController.current = new AbortController();

      setIsTyping(true);

      setInput("");

      let firstChunk = true;

      const parsedMessages = messages
        .concat(userMessage)
        .slice(-10)
        .map((message) => ({
          role: message.role,
          content: message.content,
        }));

      await getAnswer({
        messages: parsedMessages,
        setAnswer: (streamedText) => {
          if (firstChunk) {
            setIsTyping(false);
            firstChunk = false;
          }

          setMessages((prev) => {
            const id = Date.now();
            const updated = [...prev];
            const lastChild = updated.at(-1);

            if (lastChild?.role === "user") {
              updated.push({
                id,
                role: "assistant",
                content: streamedText,
                time: now,
              });

              return updated;
            }

            return updated.map((message) => {
              if (message.id === lastChild?.id) {
                return {
                  ...lastChild,
                  content: message.content + streamedText,
                };
              }
              return message;
            });
          });
        },
        controller: abortController.current!,
      });
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") {
        console.log(error);
      }
    } finally {
      setIsTyping(false);
    }
  }

  function handleDeleteChat() {
    setMessages([]);

    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }

    localStorage.removeItem(LOCAL_STORAGE_KEY);

    setIsTyping(false);
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved) as Message[];
      if (Array.isArray(parsed)) {
        setMessages(parsed);
      }
    } catch (error) {
      console.log("Error loading chat from storage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.log("Error saving chat to storage", error);
    }
  }, [messages]);

  return (
    <main className="relative  bg-[#ebebeb] from-white h-dvh overflow-hidden via-slate-50 to-sky-50 flex items-center justify-center">
      <div className="relative mx-auto flex w-full max-w-7xl h-full   flex-col  px-4 py-10">
        <div className="w-full flex py-2 justify-between items-center  bg-white px-2">
          <div className="flex items-center">
            <Image
              src="/bot.gif"
              alt="Bot gif"
              className="rounded-full shrink-0 aspect-4/3"
              width={70}
              height={70}
            />
            <div className="*:leading-none">
              <p className="font-semibold text-xl">Cal.com Bot</p>
              <span className="text-gray-500 text-sm">@calcombot</span>
            </div>
          </div>

          {messages.length > 0 && (
            <button
              onClick={handleDeleteChat}
              className="text-black cursor-pointer"
              aria-label="Delete chat"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="currentColor"
              >
                <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
              </svg>
            </button>
          )}
        </div>
        <section className="bg-[#8babd8] bg-[url('/bg-chat.png')] bg-cover bg-center relative overflow-hidden h-full">
          <div
            id="messages-ctn"
            className="flex overflow-y-auto h-full flex-col gap-4 px-6 pt-6 pb-24"
          >
            {messages.map((message) => (
              <MessageItem key={message.id} {...message} />
            ))}

            {isTyping && <Loading />}

            <div ref={endRef} />
          </div>

          <div className="space-y-3 border-t absolute bottom-4 left-0 right-0 rounded-3xl bg-white w-[95%] mx-auto border-slate-200 py-2 px-4">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-3 rounded-2xl py-3">
                <input
                  className="w-full bg-transparent  resize-none text-sm text-slate-900 border-0 placeholder:text-slate-500 focus:outline-none"
                  placeholder="Escribe tu mensaje..."
                  value={input}
                  required
                  onChange={(event) => setInput(event.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                aria-label="Send message"
                className="cursor-pointer disabled:cursor-not-allowed"
              >
                <Image
                  src="/send-icon.svg"
                  width={24}
                  height={24}
                  alt="Send message"
                />
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
