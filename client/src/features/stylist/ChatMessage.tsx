type ChatMessageProps = {
  role: "user" | "assistant";
  text: string;
  image?: string;
};

function ChatMessage({ role, text, image }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={`flex w-full ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "rounded-br-md bg-slate-800 text-white"
            : "rounded-bl-md border border-slate-200 bg-white text-slate-700 shadow-sm"
        }`}
      >
        {image && <img src={image} alt="Uploaded outfit" className="mb-2 max-h-64 max-w-full rounded-lg object-contain" />}
        {text}
      </div>
    </div>
  );
}

export default ChatMessage;
