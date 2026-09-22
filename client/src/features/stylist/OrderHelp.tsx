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
    { title: "Confirm delivery and pay", done: false, description: "Continue to Tech-Tailor to confirm specifications, enter your delivery address and complete payment." },
  ];
  const nextIndex = steps.findIndex(step => !step.done);
  return <section className="p-4 sm:p-6">
    <div id="order-help">
      <p className="text-sm text-slate-600">From your first style idea to delivery, here is how your custom outfit comes together.</p>
      <ol className="mt-3 space-y-3">
        {steps.map((step, index) => <li key={step.title} aria-current={index === nextIndex ? "step" : undefined} className="text-xs text-slate-600"><p className="font-semibold text-slate-900">{index + 1}. {step.title} <span className="font-normal text-slate-500">({step.done ? "Selected" : index === nextIndex ? "Next" : "To do"})</span></p><p className="mt-1">{step.description}</p></li>)}
      </ol>
      <section id="payment-delivery-help" className="mt-4 border-t border-slate-100 pt-3"><h3 className="text-sm font-semibold">Payment and delivery</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">Tech-Tailor advertises worldwide DHL delivery. Its terms advise allowing around three weeks for production and delivery; customs or import charges are paid by the recipient. Confirm your US or Delhi address and final charges before payment. The published terms do not explicitly confirm US-issued card acceptance.</p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-blue-800 underline">
          <a href="https://tech-tailor.com/" target="_blank" rel="noreferrer">Delivery information</a>
          <a href="https://tech-tailor.com/terms-of-service" target="_blank" rel="noreferrer">Terms and delivery conditions</a>
          <a href="https://tech-tailor.com/locate-us?schedule-tech=false" target="_blank" rel="noreferrer">Confirm payment with Tech-Tailor</a>
        </div>
      </section>
    </div>
  </section>;
}
