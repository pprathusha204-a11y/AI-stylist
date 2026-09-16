import {
  MessageCircle,
  Phone,
} from "lucide-react";

const supportNumber = String(
  import.meta.env
    .VITE_SUPPORT_PHONE_NUMBER ?? "",
).replace(/\D/g, "");

const hasSupportNumber =
  supportNumber.length >= 8;

const whatsappMessage = encodeURIComponent(
  "Hello Tech-Tailor, I need help with my outfit selection.",
);

const actionClassName =
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-semibold transition";

function SupportActions() {
  /*
   * Never show inactive contact controls to
   * customers. This panel appears automatically
   * after the real support number is configured.
   */
  if (!hasSupportNumber) {
    return null;
  }

  return (
    <aside className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
      <span className="mr-auto text-[11px] font-semibold text-slate-700">
        Speak with a Tech-Tailor stylist
      </span>

      <a
        href={`https://wa.me/${supportNumber}?text=${whatsappMessage}`}
        target="_blank"
        rel="noreferrer"
        className={`${actionClassName} border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100`}
      >
        <MessageCircle
          size={13}
          strokeWidth={1.9}
        />
        WhatsApp
      </a>

      <a
        href={`tel:+${supportNumber}`}
        className={`${actionClassName} border-blue-200 bg-blue-50 text-blue-800 hover:border-blue-300 hover:bg-blue-100`}
      >
        <Phone
          size={13}
          strokeWidth={1.9}
        />
        Call
      </a>
    </aside>
  );
}

export default SupportActions;
