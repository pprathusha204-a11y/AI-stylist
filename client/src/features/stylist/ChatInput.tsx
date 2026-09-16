import { useState, type FormEvent } from "react";
import { ArrowUp, ImagePlus, Mic } from "lucide-react";

type ChatInputProps = {
  onSendMessage: (message: string) => void;
};

function ChatInput({ onSendMessage }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const message = input.trim();

    if (!message) return;

    onSendMessage(message);
    setInput("");
  };

  return (
    <div className="fixed bottom-3 left-1/2 z-20 w-[calc(100%-1.5rem)] max-w-3xl -translate-x-1/2 sm:bottom-4 sm:w-[calc(100%-2rem)]">
      <form
        onSubmit={handleSubmit}
        className="flex items-center rounded-full border border-slate-200 bg-white px-2 py-2 shadow-lg sm:px-3"
      >
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center text-slate-400 transition hover:text-slate-700"
          aria-label="Upload image"
        >
          <ImagePlus size={16} strokeWidth={1.6} />
        </button>

        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask me anything about your outfit..."
          className="min-w-0 flex-1 border-none bg-transparent px-2 text-xs text-slate-800 outline-none placeholder:text-slate-400 sm:text-sm"
        />

        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center text-slate-400 transition hover:text-slate-700"
          aria-label="Voice input"
        >
          <Mic size={16} strokeWidth={1.6} />
        </button>

        <button
          type="submit"
          disabled={!input.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700 text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300"
          aria-label="Send message"
        >
          <ArrowUp size={18} strokeWidth={1.8} />
        </button>
      </form>
    </div>
  );
}

export default ChatInput;