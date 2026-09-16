export type WorkflowType =
  | "shirt"
  | "suit"
  | "wedding_groom"
  | "bridegroom_party"
  | "corporate_uniform"
  | "hospital_uniform"
  | "hotel_uniform"
  | "accessories"
  | "occasion_shopping"
  | "custom_design"
  | "technician_service"
  | "discovery"
  | "virtual_try_on"
  | "price_sensitive"
  | "abandoned_cart"
  | "repeat_customer"
  | "alteration"
  | "international_customer"
  | "premium_customer"
  | "festival_wear"
  | "student_customer"
  | "gift_buyer"
  | "customer_support";

export type WorkflowResult = {
  workflow: WorkflowType;
  confidence: number;
  matchedKeywords: string[];
};

type WorkflowRule = {
  workflow: WorkflowType;
  keywords: string[];
};

const workflowRules: WorkflowRule[] = [
  {
    workflow: "custom_design",
    keywords: [
      "custom design service",
      "customize a tailored garment",
      "customise a tailored garment",
    ],
  },
  {
    workflow: "technician_service",
    keywords: [
      "schedule a technician",
      "technician visit",
      "book a technician",
    ],
  },
  {
    workflow: "occasion_shopping",
    keywords: [
      "shop by occasion",
      "shopping by occasion",
    ],
  },
  {
    workflow: "customer_support",
    keywords: [
      "track order",
      "order status",
      "delivery status",
      "change address",
      "existing order",
      "measurement correction",
      "return",
      "refund",
      "rework",
    ],
  },
  {
    workflow: "hospital_uniform",
    keywords: [
      "hospital",
      "doctor coat",
      "scrubs",
      "patient gown",
    ],
  },
  {
    workflow: "hotel_uniform",
    keywords: [
      "hotel",
      "chef uniform",
      "steward uniform",
      "housekeeping uniform",
      "front office attire",
    ],
  },
  {
    workflow: "bridegroom_party",
    keywords: [
      "groomsmen",
      "groom party",
      "bridegroom party",
      "group outfits",
    ],
  },
  {
    workflow: "corporate_uniform",
    keywords: [
      "corporate",
      "company uniform",
      "employee uniforms",
      "bulk uniform",
      "quotation",
    ],
  },
  {
    workflow: "wedding_groom",
    keywords: [
      "wedding",
      "groom",
      "reception",
      "sherwani",
    ],
  },
  {
    workflow: "virtual_try_on",
    keywords: [
      "virtual try on",
      "try on",
      "upload photo",
      "create avatar",
    ],
  },
  {
    workflow: "alteration",
    keywords: [
      "alteration",
      "shorten sleeve",
      "waist adjustment",
      "length reduction",
    ],
  },
  {
    workflow: "price_sensitive",
    keywords: [
      "too expensive",
      "cheaper",
      "lower price",
      "affordable option",
      "discount",
    ],
  },
  {
    workflow: "repeat_customer",
    keywords: [
      "buy again",
      "reorder",
      "previous measurements",
      "previous order",
    ],
  },
  {
    workflow: "international_customer",
    keywords: [
      "international shipping",
      "outside india",
      "global shipping",
      "overseas delivery",
    ],
  },
  {
    workflow: "premium_customer",
    keywords: [
      "luxury",
      "premium fabric",
      "exclusive fabric",
      "personal stylist",
      "home visit",
    ],
  },
  {
    workflow: "festival_wear",
    keywords: [
      "diwali",
      "eid",
      "festival",
      "cultural event",
    ],
  },
  {
    workflow: "student_customer",
    keywords: [
      "graduation",
      "convocation",
      "placement interview",
      "college fest",
      "student package",
    ],
  },
  {
    workflow: "gift_buyer",
    keywords: [
      "gift",
      "gift voucher",
      "buying for someone",
      "buying for another person",
    ],
  },
  {
    workflow: "accessories",
    keywords: [
      "accessories",
      "tie",
      "pocket square",
      "belt",
      "wallet",
      "cufflinks",
    ],
  },
  {
    workflow: "shirt",
    keywords: ["shirt"],
  },
  {
    workflow: "suit",
    keywords: ["suit", "tuxedo"],
  },
  {
    workflow: "discovery",
    keywords: [
      "not sure",
      "just exploring",
      "show me",
      "browse",
    ],
  },
];

export function classifyWorkflow(
  message: string,
): WorkflowResult {
  const normalizedMessage = message
    .toLowerCase()
    .trim();

  let selectedWorkflow: WorkflowType =
    "discovery";

  let selectedKeywords: string[] = [];

  for (const rule of workflowRules) {
    const matches = rule.keywords.filter(
      (keyword) =>
        normalizedMessage.includes(keyword),
    );

    if (matches.length > selectedKeywords.length) {
      selectedWorkflow = rule.workflow;
      selectedKeywords = matches;
    }
  }

  if (selectedKeywords.length === 0) {
    return {
      workflow: "discovery",
      confidence: 0.35,
      matchedKeywords: [],
    };
  }

  return {
    workflow: selectedWorkflow,
    confidence: Math.min(
      0.95,
      Number(
        (
          0.55 +
          selectedKeywords.length * 0.1
        ).toFixed(2),
      ),
    ),
    matchedKeywords: selectedKeywords,
  };
}