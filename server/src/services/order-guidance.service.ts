import type { CustomerRequirements } from "./session.service";

export const detailFields = {
  "Fabric blend": "fabricBlend",
  "Yarn count": "yarnCount",
  "Thread count": "threadCount",
  "Lining material": "liningMaterial",
  "Lining construction": "liningConstruction",
  "Style adaptation": "styleAdaptation",
  "Delivery destination": "deliveryDestination",
} as const;

// Explicit labels preserve exact specifications without guessing units or composition.
export function extractOrderDetails(message: string): Partial<CustomerRequirements> {
  const result: Partial<CustomerRequirements> = {};
  for (const line of message.split(/[\n;]/)) {
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const label = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim().slice(0, 500);
    const entry = Object.entries(detailFields).find(([name]) => name.toLowerCase() === label);
    if (entry && value) result[entry[1]] = value;
  }
  return result;
}

export function getOrderGuidance(message: string): string | null {
  const answers: string[] = [];
  if (/guide me through my first order|how (?:do i|to) (?:place an order|order)/i.test(message)) {
    answers.push("We'll work through your garment and style, fabric and lining, measurements, then an order review. Use Order help to see your progress or add exact specifications. After review, continue to Tech-Tailor to confirm availability, delivery and payment.");
  }
  if (/how (?:will|do|can) i (?:be measured|measure)|measurement help|how.*measurements.*(?:work|taken)/i.test(message)) {
    answers.push("For self-measurement, open Measurement Help for the men's or women's illustrated guide, then enter your measurements in inches. Automated Measurement opens the body-scan service; it must be completed there. A technician visit requires location and appointment confirmation. Ready Size lets you choose a standard size. Choose the method that you are comfortable with.");
  }
  if (/use this style|can i.*(?:upload|style|photo|picture)/i.test(message)) {
    answers.push("Use the labelled Use this style upload button to attach a JPG, PNG or WebP reference. Tell me which details to keep or change, such as the collar, fit, sleeves or length. A reference guides the design; measurements and exact fabric composition need to be supplied separately. Tech-Tailor must confirm the requested design can be made.");
  }
  if (/can i.*(?:fabric|blend|lining|counts)|detailed fabric requests/i.test(message)) {
    answers.push("Open Order help > Detailed requests to record blend percentages, yarn count (including its system), thread count, lining material and lining construction. These remain requests for Tech-Tailor to confirm against available fabrics before payment.");
  }
  if (/payment and delivery|credit card|us-issued|can i pay|do you ship|(?:pay|payment).*(?:card|california|\bus\b)|(?:ship|shipping|deliver|delivery).*(?:\bus\b|usa|united states|delhi)|(?:\bus\b|delhi).*(?:shipping|delivery)/i.test(message)) {
    answers.push(process.env.STYLIST_PAYMENT_POLICY?.trim() || "The published terms mention credit cards but do not explicitly confirm US-issued card acceptance or supported card networks. Please confirm your card and billing currency with Tech-Tailor before paying; use the contact link under Order help > Payment and delivery.");
    answers.push(process.env.STYLIST_SHIPPING_POLICY?.trim() || "Tech-Tailor advertises free worldwide DHL delivery on its homepage. Its terms advise around three weeks for production and delivery, with customs or import charges paid by the recipient. Record your US or Delhi destination in Detailed requests and confirm your address, final charges and delivery estimate before payment. See Payment and delivery in Order help for the published terms and contact links.");
  }
  return answers.length ? answers.join("\n\n") : null;
}
