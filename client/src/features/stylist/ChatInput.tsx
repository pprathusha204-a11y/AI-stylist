import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowUp, ImagePlus, Mic, Square, X } from "lucide-react";

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type ChatInputProps = {
  onSendMessage: (message: string, image?: string) => Promise<boolean> | void;
  disabled?: boolean;
};

function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string>();
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const [reading, setReading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const recognition = useRef<Recognition | null>(null);
  const reader = useRef<FileReader | null>(null);

  useEffect(() => () => {
    if (recognition.current) {
      recognition.current.onresult = null;
      recognition.current.onerror = null;
      recognition.current.onend = null;
      recognition.current.abort();
    }
    reader.current?.abort();
  }, []);

  const selectImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Choose an image smaller than 5 MB.");
      return;
    }
    setReading(true);
    const nextReader = new FileReader();
    reader.current = nextReader;
    nextReader.onload = () => {
      setImage(String(nextReader.result));
      setReading(false);
    };
    nextReader.onerror = () => {
      setError("Unable to read this image. Please try another file.");
      setReading(false);
    };
    nextReader.readAsDataURL(file);
  };

  const toggleVoice = () => {
    if (recognition.current) {
      recognition.current.stop();
      return;
    }
    const browser = window as typeof window & {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const SpeechRecognition = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice input is unavailable in this browser. Try Chrome or Edge, or type your message.");
      return;
    }
    setError("");
    const next = new SpeechRecognition();
    next.lang = navigator.language || "en-IN";
    next.continuous = false;
    next.interimResults = false;
    next.onresult = (event) => {
      const transcript = Array.from(event.results, (result) => result[0].transcript).join(" ");
      setInput((current) => [current.trim(), transcript.trim()].filter(Boolean).join(" "));
    };
    next.onerror = (event) => {
      setError(event.error === "not-allowed" || event.error === "service-not-allowed"
        ? "Allow microphone access in your browser's site settings, then try again."
        : event.error === "no-speech" ? "No speech detected. Please try again."
        : "Voice input failed. Check your microphone and connection, then try again.");
    };
    next.onend = () => {
      recognition.current = null;
      setListening(false);
    };
    recognition.current = next;
    try {
      next.start();
      setListening(true);
    } catch {
      recognition.current = null;
      setError("Unable to start voice input. Please try again.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled || reading || listening || (!input.trim() && !image)) return;
    const sent = await onSendMessage(input.trim() || "Help me with the outfit in this image.", image);
    if (sent !== false) {
      setInput("");
      setImage(undefined);
      setError("");
    }
  };

  return (
    <div className="fixed bottom-3 left-1/2 z-20 w-[calc(100%-1.5rem)] max-w-3xl -translate-x-1/2 sm:bottom-4 sm:w-[calc(100%-2rem)]">
      {image && <div className="mb-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <img src={image} alt="Selected attachment" className="h-16 w-16 rounded-lg object-cover" />
        <span className="flex-1 text-sm text-slate-600">Image attached</span>
        <button type="button" disabled={disabled} onClick={() => setImage(undefined)} aria-label="Remove image" className="p-2"><X size={18} /></button>
      </div>}
      {(error || listening || reading) && <p role={error ? "alert" : "status"} className="mb-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">{error || (reading ? "Reading image..." : "Listening... Click stop when finished.")}</p>}
      <form onSubmit={handleSubmit} className="flex items-center rounded-full border border-slate-200 bg-white px-2 py-2 shadow-lg sm:px-3">
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={selectImage} className="hidden" aria-label="Choose image" />
        <button type="button" disabled={disabled || reading} onClick={() => fileInput.current?.click()} className="flex h-9 w-9 shrink-0 items-center justify-center text-slate-400 transition hover:text-slate-700 disabled:opacity-50" aria-label="Upload image"><ImagePlus size={16} strokeWidth={1.6} /></button>
        <input type="text" value={input} disabled={disabled} onChange={(event) => setInput(event.target.value)} placeholder="Ask me anything about your outfit..." aria-label="Message" className="min-w-0 flex-1 border-none bg-transparent px-2 text-xs text-slate-800 outline-none placeholder:text-slate-400 sm:text-sm" />
        <button type="button" disabled={disabled} onClick={toggleVoice} className={`flex h-9 w-9 shrink-0 items-center justify-center transition ${listening ? "text-red-600" : "text-slate-400 hover:text-slate-700"}`} aria-label={listening ? "Stop voice input" : "Voice input"} aria-pressed={listening}>{listening ? <Square size={16} /> : <Mic size={16} strokeWidth={1.6} />}</button>
        <button type="submit" disabled={disabled || reading || listening || (!input.trim() && !image)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700 text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300" aria-label="Send message"><ArrowUp size={18} strokeWidth={1.8} /></button>
      </form>
    </div>
  );
}

export default ChatInput;
