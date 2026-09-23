export default function PaymentDelivery() {
  return (
      <section id="payment-delivery-help" className="p-4 sm:p-6">
        <p className="mt-2 text-xs leading-relaxed text-slate-600">Tech-Tailor advertises worldwide DHL delivery. Its terms advise allowing around three weeks for production and delivery; customs or import charges are paid by the recipient. Confirm your US or Delhi address and final charges before payment. The published terms do not explicitly confirm US-issued card acceptance.</p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-blue-800 underline">
          <a href="https://tech-tailor.com/" target="_blank" rel="noreferrer">Delivery information</a>
          <a href="https://tech-tailor.com/terms-of-service" target="_blank" rel="noreferrer">Terms and delivery conditions</a>
          <a href="https://tech-tailor.com/locate-us?schedule-tech=false" target="_blank" rel="noreferrer">Confirm payment with Tech-Tailor</a>
        </div>
      </section>
  );
}
