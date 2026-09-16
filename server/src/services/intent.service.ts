export type PurchaseIntent =
  | "ready_to_buy"
  | "exploring"
  | "researching_styles"
  | "corporate_lead"
  | "customer_support";

type IntentRule = {
  intent: PurchaseIntent;
  keywords: string[];
};

export type IntentResult = {
  intent: PurchaseIntent;
  confidence: number;
  matchedKeywords: string[];
};

const intentRules: IntentRule[] = [
  {
    intent: "customer_support",
    keywords: [
      "track order",
      "order status",
      "delivery status",
      "change address",
      "where is my order",
      "return",
      "refund",
      "rework",
      "existing order",
      "measurement correction",
    ],
  },
  {
    intent: "corporate_lead",
    keywords: [
      "corporate",
      "company",
      "employees",
      "uniform",
      "bulk order",
      "hospital",
      "hotel",
      "restaurant",
      "bank",
      "security agency",
      "manufacturing",
      "quotation",
    ],
  },
  {
    intent: "ready_to_buy",
    keywords: [
      "i want to buy",
      "i need",
      "buy",
      "purchase",
      "place an order",
      "add to cart",
      "checkout",
      "looking for",
    ],
  },
  {
    intent: "researching_styles",
    keywords: [
      "compare",
      "which fabric",
      "fabric options",
      "style options",
      "recommend",
      "best fabric",
      "best colour",
      "best color",
      "latest style",
    ],
  },
  {
    intent: "exploring",
    keywords: [
      "just exploring",
      "not sure",
      "show me",
      "looking around",
      "browse",
    ],
  },
];

export function classifyPurchaseIntent(
  message: string,
): IntentResult {
  const normalizedMessage = message.toLowerCase().trim();

  let selectedIntent: PurchaseIntent = "exploring";
  let selectedKeywords: string[] = [];

  for (const rule of intentRules) {
    const matches = rule.keywords.filter((keyword) =>
      normalizedMessage.includes(keyword),
    );

    if (matches.length > selectedKeywords.length) {
      selectedIntent = rule.intent;
      selectedKeywords = matches;
    }
  }

  if (selectedKeywords.length === 0) {
    return {
      intent: "exploring",
      confidence: 0.35,
      matchedKeywords: [],
    };
  }

  const confidence = Math.min(
    0.95,
    0.55 + selectedKeywords.length * 0.1,
  );

  return {
    intent: selectedIntent,
    confidence: Number(confidence.toFixed(2)),
    matchedKeywords: selectedKeywords,
  };
}