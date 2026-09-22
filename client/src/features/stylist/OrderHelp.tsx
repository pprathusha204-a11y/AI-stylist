import { useState, type FormEvent } from "react";
import type { ConversationStage, CustomerRequirements } from "../../services/chatApi";

const fields = [
  ["fabricBlend", "Fabric blend", "e.g. 80% wool, 20% silk"],
  ["yarnCount", "Yarn count", "Include the system, e.g. Ne 100/2"],
  ["threadCount", "Thread count", "Include units, e.g. 200 threads per inch"],
  ["liningMaterial", "Lining material", "e.g. cupro or silk"],
  ["liningConstruction", "Lining construction", "e.g. fully lined, half lined or unlined"],
  ["styleAdaptation", "Style adaptation", "Which reference details should we keep or change?"],
  ["deliveryDestination", "Delivery destination", "e.g. Delhi, India or California, USA"],
] as const;

type Props = {
  requirements?: CustomerRequirements;
  stage?: ConversationStage;
  disabled: boolean;
  onSend: (message: string) => Promise<boolean>;
};

function DetailedRequests({ requirements, disabled, onSend }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map(([key]) => [key, requirements?.[key] ?? ""])));
  const [status, setStatus] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const details = fields.filter(([key]) => values[key].trim() || requirements?.[key]).map(([key, label]) => `${label}: ${values[key].trim() || "No preference"}`);
    if (!details.length) { setStatus("Add at least one request."); return; }
    const sent = await onSend("My detailed order requests:\n" + details.join("\n"));
    setStatus(sent ? "Requests saved in this conversation. Review them before checkout." : "Requests were not saved. Please try again.");
  };
  return <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-2">
    <p className="text-xs text-slate-600 sm:col-span-2">Add the details you know. Exact specifications need confirmation against available fabrics. Saved requests appear in your order summary; confirm them again on Tech-Tailor before payment.</p>
    {fields.map(([key, label, placeholder]) => <label key={key} className="text-xs font-medium text-slate-700">{label}
      <input value={values[key]} maxLength={500} disabled={disabled} onChange={event => setValues({ ...values, [key]: event.target.value })} placeholder={placeholder} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm font-normal" />
    </label>)}
    <div className="sm:col-span-2"><button disabled={disabled} className="rounded-full bg-slate-900 px-4 py-2 text-xs text-white disabled:opacity-50">Save requests</button><p role="status" className="mt-2 text-xs text-slate-600">{status}</p></div>
  </form>;
}

export default function OrderHelp(props: Props) {
  const r = props.requirements;
  const steps = [
    { title: "Choose your garment and style", done: Boolean(r?.selectedProductId), description: "Tell the stylist what you need, choose a style, or attach a reference using Use this style." },
    { title: "Choose fabric and custom details", done: Boolean(r?.selectedFabricId), description: "Select a fabric. Add exact blends, counts and lining requests below if you have them." },
    { title: "Choose how to be measured", done: Boolean(r?.measurementMethod), description: "Use a measurement guide, an automated scan, a standard size or a technician visit. Choosing a method does not complete a scan or book a visit." },
    { title: "Review your selections", done: props.stage === "review_tailored_order", description: "Check the style, fabric, measurements and special requests in your summary." },
    { title: "Confirm delivery and pay", done: false, description: "Continue to Tech-Tailor to confirm specifications, enter your delivery address and complete payment." },
  ];
  const nextIndex = steps.findIndex(step => !step.done);
  return <aside className="mx-auto mt-4 max-w-3xl px-4">
    <details className="rounded-xl border border-slate-200 bg-white p-4" id="order-help">
      <summary className="cursor-pointer text-sm font-semibold text-slate-800">Order help — {steps[nextIndex]?.title}</summary>
      <ol className="mt-3 space-y-3">
        {steps.map((step, index) => <li key={step.title} aria-current={index === nextIndex ? "step" : undefined} className="text-xs text-slate-600"><p className="font-semibold text-slate-900">{index + 1}. {step.title} <span className="font-normal text-slate-500">({step.done ? "Selected" : index === nextIndex ? "Next" : "To do"})</span></p><p className="mt-1">{step.description}</p></li>)}
      </ol>
      <details className="mt-4 border-t border-slate-100 pt-3"><summary className="cursor-pointer text-sm font-semibold">Detailed requests</summary><DetailedRequests key={JSON.stringify(fields.map(([key]) => r?.[key]))} {...props} /></details>
      <details id="payment-delivery-help" className="mt-4 border-t border-slate-100 pt-3"><summary className="cursor-pointer text-sm font-semibold">Payment and delivery</summary>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">Tech-Tailor advertises worldwide DHL delivery. Its terms advise allowing around three weeks for production and delivery; customs or import charges are paid by the recipient. Confirm your US or Delhi address and final charges before payment. The published terms do not explicitly confirm US-issued card acceptance.</p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-blue-800 underline">
          <a href="https://tech-tailor.com/" target="_blank" rel="noreferrer">Delivery information</a>
          <a href="https://tech-tailor.com/terms-of-service" target="_blank" rel="noreferrer">Terms and delivery conditions</a>
          <a href="https://tech-tailor.com/locate-us?schedule-tech=false" target="_blank" rel="noreferrer">Confirm payment with Tech-Tailor</a>
        </div>
      </details>
    </details>
  </aside>;
}
