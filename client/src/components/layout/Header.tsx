import type { ReactNode } from "react";
import NavigationMenu from "./NavigationMenu";
import {
  House,
  Plus,
  UserRound,
} from "lucide-react";

type HeaderProps = {
  onNewSession: () => void;
  journey: ReactNode;
};

function Header({ onNewSession, journey }: HeaderProps) {
  return (
    <header className="grid h-16 grid-cols-[1fr_auto_1fr] items-center border-b border-slate-200 bg-white px-3 shadow-sm sm:px-5">
      <div className="flex items-center gap-1 sm:gap-5">
        <NavigationMenu journey={journey} />

        <button
          type="button"
          onClick={onNewSession}
          className="flex h-8 items-center justify-center text-slate-700 transition hover:text-slate-950"
          aria-label="Start new session"
          title="New Session"
        >
          <Plus
            className="sm:hidden"
            size={18}
            strokeWidth={1.7}
          />

          <span className="hidden whitespace-nowrap text-[15px] font-medium uppercase tracking-[0.12em] sm:inline">
            New Session
          </span>
        </button>
      </div>

      <button
        type="button"
        onClick={onNewSession}
        className="justify-self-center rounded-md transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
        aria-label="Go to home and start a new chat"
        title="Home"
      >
        <img
          src="/images/tech-tailor-logo.png"
          alt="Tech-Tailor"
          className="h-9 w-11 object-contain sm:h-11 sm:w-auto"
        />
      </button>

      <div className="flex items-center gap-2 justify-self-end sm:gap-4">
        <button
          type="button"
          onClick={onNewSession}
          className="flex h-9 items-center justify-center gap-2 text-slate-700 transition hover:text-slate-950"
          aria-label="Go to home and start a new chat"
          title="Home Page"
        >
          <House size={18} strokeWidth={1.8} />

          <span className="hidden whitespace-nowrap text-[15px] font-medium uppercase tracking-[0.12em] sm:inline">
            Home Page
          </span>
        </button>

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center text-slate-700 transition hover:text-slate-950"
          aria-label="Account"
        >
          <UserRound size={18} strokeWidth={1.8} />
        </button>
      </div>
    </header>
  );
}

export default Header;