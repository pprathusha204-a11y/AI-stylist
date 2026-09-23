import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Menu, X } from "lucide-react";
import PaymentDelivery from "../../features/stylist/PaymentDelivery";

export default function NavigationMenu({ journey }: { journey: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const menuItem = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"menu" | "journey" | "payment-delivery">("menu");

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    dialog.current?.scrollTo(0, 0);
    if (view !== "menu") heading.current?.focus();
    else menuItem.current?.focus();
  }, [isOpen, view]);

  return <>
    <button
      type="button"
      onClick={() => {
        setView("menu");
        dialog.current?.showModal();
        setIsOpen(true);
      }}
      className="flex h-9 w-9 shrink-0 items-center justify-center text-slate-600 transition hover:text-slate-900"
      aria-label="Open menu"
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-controls="navigation-dialog"
    ><Menu size={20} strokeWidth={1.7} /></button>
    <dialog
      ref={dialog}
      id="navigation-dialog"
      aria-labelledby="navigation-title"
      onClose={() => setIsOpen(false)}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.current?.close();
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-0 text-slate-800 shadow-xl backdrop:bg-slate-950/40"
    >
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-200 bg-white p-4">
        {view !== "menu" && <button type="button" onClick={() => setView("menu")} aria-label="Back to menu" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100"><ArrowLeft size={20} /></button>}
        <h2 ref={heading} tabIndex={-1} id="navigation-title" className="min-w-0 flex-1 text-lg font-semibold outline-none">{view === "journey" ? "How It Works" : view === "payment-delivery" ? "Payment & Delivery" : "Menu"}</h2>
        <button type="button" onClick={() => dialog.current?.close()} aria-label="Close menu" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100"><X size={20} /></button>
      </div>
      {view === "menu" ? <nav aria-label="Main navigation" className="p-4">
        <button ref={menuItem} type="button" onClick={() => setView("journey")} className="min-h-11 w-full rounded-lg px-4 py-3 text-left text-base font-medium hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-400">How It Works</button>
        <button type="button" onClick={() => setView("payment-delivery")} className="min-h-11 w-full rounded-lg px-4 py-3 text-left text-base font-medium hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-400">Payment &amp; Delivery</button>
      </nav> : view === "journey" ? journey : <PaymentDelivery />}
    </dialog>
  </>;
}
