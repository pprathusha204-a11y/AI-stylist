import type { ConversationStage, CustomerRequirements } from "../../services/chatApi";

type Props = {
  requirements?: CustomerRequirements;
  stage?: ConversationStage;
};

export default function OrderHelp(props: Props) {
  const r = props.requirements;
  const steps = [
    { title: "Choose your garment and style", done: Boolean(r?.selectedProductId), description: "Tell the stylist what you need, choose a style, or attach a reference using the image upload icon in the chat bar." },
    { title: "Choose fabric and custom details", done: Boolean(r?.selectedFabricId), description: "Select a fabric and discuss any custom preferences with the stylist." },
    { title: "Choose how to be measured", done: Boolean(r?.measurementMethod), description: "Use a measurement guide, an automated scan, a standard size or a technician visit. Choosing a method does not complete a scan or book a visit." },
    { title: "Review your selections", done: props.stage === "review_tailored_order", description: "Check the style, fabric, measurements and special requests in your summary." },
    { title: "Confirm and place your order", done: false, description: "Continue to Tech-Tailor to confirm and place your order." },
  ];
  const nextIndex = steps.findIndex(step => !step.done);
  return <section className="p-4 sm:p-6">
    <div id="order-help">
      <ol className="mt-3 space-y-3">
        {steps.map((step, index) => <li key={step.title} aria-current={index === nextIndex ? "step" : undefined} className="text-xs text-slate-600"><p className="font-semibold text-slate-900">{index + 1}. {step.title} <span className="font-normal text-slate-500">({step.done ? "Selected" : index === nextIndex ? "Next" : "To do"})</span></p><p className="mt-1">{step.description}</p></li>)}
      </ol>
    </div>
  </section>;
}
