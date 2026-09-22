export type PurchaseIntent =
  | "ready_to_buy"
  | "exploring"
  | "researching_styles"
  | "corporate_lead"
  | "customer_support";

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

export type ConversationStage =
  | "discover_intent"
  | "discover_department"
  | "discover_product"
  | "discover_subcategory"
  | "discover_occasion"
  | "discover_budget"
  | "discover_colour"
  | "discover_fabric"
  | "discover_fit"
  | "discover_style"
  | "discover_preferences"
  | "select_product_style"
  | "discover_customization"
  | "collect_custom_measurements"
  | "customize_lapel"
  | "customize_buttons"
  | "customize_shoulder"
  | "customize_vent"
  | "customize_blazer_options"
  | "customize_trousers"
  | "customize_trouser_waistband"
  | "customize_pockets"
  | "customize_lining"
  | "discover_measurement"
  | "discover_height"
  | "discover_body_type"
  | "discover_ready_size"
  | "discover_technician_city"
  | "discover_technician_date"
  | "review_tailored_order"
  | "ready_for_recommendations";

export type CustomerRequirements = {
  department: string | null;
  category: string | null;
  subcategory: string | null;

  gender: string | null;
  ageGroup: string | null;

  occasion: string | null;
  weddingFunction: string | null;

  budgetMin: number | null;
  budgetMax: number | null;

  colour: string | null;
  fabric: string | null;
  fit: string | null;
  stylePreference: string | null;

  customerRole: string | null;
  eventDate: string | null;
  venue: string | null;
  eventTime: string | null;

  quantity: number | null;
  industry: string | null;
  employeeCount: number | null;
  branding: string | null;
  selectedProductId: number | null;
  selectedProductName: string | null;
  selectedFabricId: number | null;

  customizationPreference:
    | string
    | null;

  lapelStyle: string | null;
  buttonStyle: string | null;
  shoulderStyle: string | null;
  ventType: string | null;
  blazerOptions: string | null;
  trouserStyle: string | null;
  trouserWaistbandStyle:
    | string
    | null;

  selectedCustomizationOptionIds:
    number[];
  pocketStyle: string | null;
  liningPreference: string | null;
  measurementMethod: string | null;
  heightProfile: string | null;
  bodyType: string | null;
readySize: string | null;

customMeasurements:
  Record<string, number> | null;

technicianCity: string | null;
technicianDate: string | null;
  country: string | null;
  fabricBlend: string | null;
  yarnCount: string | null;
  threadCount: string | null;
  liningMaterial: string | null;
  liningConstruction: string | null;
  styleAdaptation: string | null;
  deliveryDestination: string | null;
};

export type RequirementField =
  keyof CustomerRequirements;

export type ChatCheckpoint = {
  id: string;

  answeredField:
    | RequirementField
    | null;
};

export type QuickReply = {
  label: string;
  value: string;
};

export type CustomizationOption = {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
};

export type CustomizationGroup = {
  id: number;
  name: string;

  selectionType:
    | "single"
    | "multiple";

  options: CustomizationOption[];
};

export type BodyTypeOption = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  selectValue: string;
};

export type BodyTypeGroup = {
  title: string;
  options: BodyTypeOption[];
};

export type RecommendedProduct = {
  id: number;
  name: string;
  sku: string;
  slug: string;
  shortDescription: string;

  category: string;
  subcategory: string;
  subSubcategory: string;

  occasions: string[];

  defaultFabricId: number;
  fabric: string;
  colours: string[];
  fits: string[];

  customizationIds: number[];
  customizationOptions: string[];

  canChangeFabric: boolean;
  canCustomizeStyle: boolean;

  supportsReadyMade: boolean;
  supportsCustomMeasurements: boolean;
  supportsTechnicianVisit: boolean;

  price: number;
  mrp: number;
  priceIsStartingPrice: boolean;

  imageUrl: string;
  productUrl: string;
  inStock: boolean;
};

export type ScoreBreakdown = {
  department: number;
  category: number;
  subcategory: number;
  occasion: number;
  fabric: number;
  fit: number;
  colour: number;
  budget: number;
  style: number;
};

export type ProductRecommendation = {
  product: RecommendedProduct;

  matchPercentage: number;

  matchType:
    | "exact"
    | "alternative";

  reasons: string[];
  warnings: string[];

  tailoringMessage:
    | string
    | null;

  scoreBreakdown: ScoreBreakdown;
};

export type CatalogFabric = {
  id: number;
  name: string;
  sku: string;

  imageUrl: string;
  galleryImageUrls: string[];

  price: number | null;
  mrp: number | null;

  colourIds: number[];
  categoryIds: number[];
  subcategoryIds: number[];
  subSubcategoryIds: number[];

  description: string;
  searchText: string;

  fabricUrl: string;
  active: boolean;
};

export type FabricRecommendation = {
  fabric: CatalogFabric;

  matchPercentage: number;

  reasons: string[];

  selectValue: string;
};

type ConversationResponseData = {
  sessionId: string;

  acknowledgement:
    | string
    | null;

  recommendationMessage:
    | string
    | null;

  recommendations:
    ProductRecommendation[];

  fabricRecommendations:
    FabricRecommendation[];

  reply: string;

  quickReplies: QuickReply[];

    customizationGroup:
    | CustomizationGroup
    | null;

    bodyTypeGroup:
    | BodyTypeGroup
    | null;

  purchaseIntent: PurchaseIntent;

  workflow: WorkflowType;

  stage: ConversationStage;

  expectedField:
    | RequirementField
    | null;

  requirements:
    CustomerRequirements;
};

export type ChatApiData =
  ConversationResponseData & {
    userMessage: string;

    checkpoint: ChatCheckpoint;

    extractionSource:
      | "gemini_with_rule_validation"
      | "rule_fallback";

    confidence: number;

    matchedKeywords?: string[];
  };

export type RestoreChatData =
  ConversationResponseData & {
    restored: true;
  };

type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

type ApiErrorResponse = {
  success: false;
  message: string;
};

type ApiResponse<T> =
  | ApiSuccessResponse<T>
  | ApiErrorResponse;

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001/api";

async function readApiResponse<T>(
  response: Response,
): Promise<T> {
  const result =
    (await response.json()) as
      ApiResponse<T>;

  if (
    !response.ok ||
    !result.success
  ) {
    throw new Error(
      result.success
        ? "Unable to contact the AI stylist"
        : result.message,
    );
  }

  return result.data;
}

export async function sendChatMessage(
  message: string,
  sessionId?: string,
  image?: string,
): Promise<ChatApiData> {
  const response = await fetch(
    `${API_URL}/chat`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        message,
        sessionId,
        image,
      }),
    },
  );

  return readApiResponse<ChatApiData>(
    response,
  );
}

export async function restoreChatCheckpoint(
  sessionId: string,
  checkpointId: string,
): Promise<RestoreChatData> {
  const response = await fetch(
    `${API_URL}/chat/restore`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        sessionId,
        checkpointId,
      }),
    },
  );

  return readApiResponse<RestoreChatData>(
    response,
  );
}
