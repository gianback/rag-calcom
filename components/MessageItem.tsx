import { Role } from "@/services/client/get-answer";
import Markdown from "react-markdown";

interface Props {
  id: number;
  role: Role;
  content: string;
  time: string;
}

export function MessageItem(message: Props) {
  return (
    <article
      key={message.id}
      className={`flex ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[75%] text-[#011627] rounded-2xl px-4 py-3 text-sm shadow-lg transition ${
          message.role === "user" ? " bg-[#78E378] " : "bg-white "
        }`}
      >
        {message.role === "assistant" && (
          <div className="markdown-body *:text-sm !px-0 !py-2">
            <Markdown>{message.content}</Markdown>
          </div>
        )}
        {message.role === "user" && (
          <p className="mt-1 text-sm ">{message.content}</p>
        )}

        <div className="flex items-center mt-1 gap-2 justify-end">
          <span className="text-[11px]">{message.time}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M4.95831 9.67517L2.74572 7.46259C2.6357 7.35633 2.48835 7.29753 2.33541 7.29886C2.18246 7.30019 2.03615 7.36154 1.928 7.46969C1.81984 7.57785 1.75849 7.72415 1.75716 7.8771C1.75583 8.03005 1.81463 8.1774 1.92089 8.28742L4.54589 10.9124C4.65528 11.0218 4.80363 11.0832 4.95831 11.0832C5.11299 11.0832 5.26133 11.0218 5.37072 10.9124L11.7874 4.49575C11.8936 4.38574 11.9524 4.23838 11.9511 4.08544C11.9498 3.93249 11.8884 3.78618 11.7803 3.67803C11.6721 3.56987 11.5258 3.50852 11.3729 3.50719C11.2199 3.50586 11.0726 3.56466 10.9626 3.67092L4.95831 9.67517Z"
              fill="#011627"
            />
          </svg>
        </div>
      </div>
    </article>
  );
}
