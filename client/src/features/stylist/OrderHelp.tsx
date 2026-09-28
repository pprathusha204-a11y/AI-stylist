import type { ConversationStage, CustomerRequirements } from "../../services/chatApi";

type Props = {
  requirements?: CustomerRequirements;
  stage?: ConversationStage;
};

export default function OrderHelp(props: Props) {
  const r = props.requirements;
  const steps = [
    { title: "Choose your garment and style", done: Boolean(r?.selectedProductId), description: "Tell the stylist what you need, select a style, or upload a reference image using the icon in the chat bar." },
    { title: "Choose your fabric and custom details", done: Boolean(r?.selectedFabricId), description: "Select a fabric and share your custom preferences with the stylist." },
    { title: "Choose your measurement method", done: Boolean(r?.measurementMethod), description: "Choose self-measurement, automated measurement, a standard size, or request a technician visit." },
    { title: "Review your selections", done: props.stage === "review_tailored_order", description: "Review your style, fabric, measurements, and special requests." },
    { title: "Confirm and place your order", done: false, description: "Continue to Tech-Tailor to confirm the details and place your order." },
  ];
  const nextIndex = steps.findIndex(step => !step.done);
  return <section className="p-4 sm:p-6">
    <div id="order-help">
      <ol className="mt-3 space-y-3">
        {steps.map((step, index) => <li key={step.title} aria-current={index === nextIndex ? "step" : undefined} className="text-xs text-slate-600"><p className="font-semibold text-slate-900">{index + 1}. {step.title}</p><p className="mt-1">{step.description}</p></li>)}
      </ol>
    </div>
  </section>;
}
