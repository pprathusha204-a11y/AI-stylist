import type {
  PurchaseIntent,
} from "./intent.service";

import type {
  WorkflowType,
} from "./workflow.service";

import type {
  ConversationStage,
  CustomerRequirements,
  RequirementField,
} from "./session.service";

import {
  getCatalogProductById,
} from "./catalog.service";

import {
  getCustomizationGroupsByIds,
} from "./customization-catalog.service";

type ConversationStep = {
  stage: ConversationStage;
  expectedField:
    | RequirementField
    | null;
  reply: string;
};

function createStep(
  expectedField:
    | RequirementField
    | null,
  reply: string,
  stage: ConversationStage =
    "discover_preferences",
): ConversationStep {
  return {
    stage,
    expectedField,
    reply,
  };
}

function normalizeValue(
  value: string | null,
): string {
  return value
    ?.toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim() ?? "";
}

function getDepartment(
  requirements: CustomerRequirements,
): string {
  const department = normalizeValue(
    requirements.department,
  );

  if (department.includes("accessor")) {
    return "accessories";
  }

  if (
    department.includes("women") ||
    department.includes("female")
  ) {
    return "women";
  }

  if (
    department.includes("men") ||
    department.includes("male")
  ) {
    return "men";
  }

  const gender = normalizeValue(
    requirements.gender,
  );

  if (
    gender === "men" ||
    gender === "man" ||
    gender === "male"
  ) {
    return "men";
  }

  if (
    gender === "women" ||
    gender === "woman" ||
    gender === "female"
  ) {
    return "women";
  }

  const category = normalizeValue(
    requirements.category,
  );

  if (category.includes("accessor")) {
    return "accessories";
  }

  return "";
}

function isUniformWorkflow(
  workflow: WorkflowType,
): boolean {
  return (
    workflow === "corporate_uniform" ||
    workflow === "hospital_uniform" ||
    workflow === "hotel_uniform"
  );
}

function isAccessoriesShopping(
  department: string,
  requirements: CustomerRequirements,
): boolean {
  return (
    department === "accessories" ||
    normalizeValue(
      requirements.category,
    ).includes("accessor")
  );
}

function wantsCustomization(
  preference: string | null,
): boolean {
  const normalizedPreference =
    normalizeValue(preference);

  return [
    "customize",
    "customise",
    "personalize",
    "personalise",
    "bespoke",
    "yes",
  ].some((value) =>
    normalizedPreference.includes(value),
  );
}

function getForcedCustomizationStep(
  requirements: CustomerRequirements,
): ConversationStep | null {
  if (
    requirements.selectedProductId === null
  ) {
    return null;
  }

  const selectedProduct =
    getCatalogProductById(
      requirements.selectedProductId,
    );

  if (!selectedProduct) {
    return null;
  }

  const availableGroupIds = new Set(
    getCustomizationGroupsByIds(
      selectedProduct.customizationIds,
    ).map((group) => group.id),
  );

  const customizationSteps: Array<{
    groupId: number;
    field: RequirementField;
    reply: string;
    stage: ConversationStage;
  }> = [
    {
      groupId: 1,
      field: "lapelStyle",
      reply:
        "Which lapel style would you prefer?",
      stage: "customize_lapel",
    },
    {
      groupId: 2,
      field: "shoulderStyle",
      reply:
        "Which shoulder construction would you prefer?",
      stage: "customize_shoulder",
    },
    {
      groupId: 4,
      field: "buttonStyle",
      reply:
        "Which jacket closure would you prefer?",
      stage: "customize_buttons",
    },
    {
      groupId: 5,
      field: "ventType",
      reply:
        "Which jacket vent style would you prefer?",
      stage: "customize_vent",
    },
    {
      groupId: 6,
      field: "blazerOptions",
      reply:
        "Would you like any additional blazer options?",
      stage: "customize_blazer_options",
    },
    {
      groupId: 17,
      field: "trouserStyle",
      reply:
        "Which trouser style would you prefer?",
      stage: "customize_trousers",
    },
    {
      groupId: 18,
      field: "trouserWaistbandStyle",
      reply:
        "Which trouser waistband fastening would you prefer?",
      stage: "customize_trouser_waistband",
    },
  ];

  for (const step of customizationSteps) {
    if (
      availableGroupIds.has(step.groupId) &&
      !requirements[step.field]
    ) {
      return createStep(
        step.field,
        step.reply,
        step.stage,
      );
    }
  }

  return null;
}

function needsSubcategory(
  department: string,
  requirements: CustomerRequirements,
): boolean {
  const category = normalizeValue(
    requirements.category,
  );

  if (department !== "men") {
    return false;
  }

  return (
    category === "suit" ||
    category.includes("suits") ||
    category === "shirt" ||
    category.includes("mens shirts")
  );
}

export function determineNextStep(
  purchaseIntent: PurchaseIntent,
  workflow: WorkflowType,
  requirements: CustomerRequirements,
): ConversationStep {
  if (
    purchaseIntent === "customer_support" ||
    workflow === "customer_support"
  ) {
    return createStep(
      null,
      "Please share your order number and briefly tell me how I can help you.",
    );
  }

  if (workflow === "technician_service") {
    if (!requirements.technicianCity) {
      return createStep(
        "technicianCity",
        "Which city should we schedule the technician visit in?",
        "discover_technician_city",
      );
    }

    if (!requirements.technicianDate) {
      return createStep(
        "technicianDate",
        "What is your preferred visit date? We’ll confirm the available time before the visit.",
        "discover_technician_date",
      );
    }

    return createStep(
      null,
      "Your technician visit request is ready. Tech-Tailor will confirm the available time before the visit.",
      "review_tailored_order",
    );
  }

  if (isUniformWorkflow(workflow)) {
    if (!requirements.industry) {
      return createStep(
        "industry",
        "Which industry or organisation are you purchasing uniforms for?",
      );
    }

    if (
      requirements.employeeCount === null
    ) {
      return createStep(
        "employeeCount",
        "Approximately how many people require uniforms?",
      );
    }

    if (!requirements.subcategory) {
      return createStep(
        "subcategory",
        "What type of uniform do you require?",
        "discover_subcategory",
      );
    }

    if (
      requirements.budgetMin === null &&
      requirements.budgetMax === null
    ) {
      return createStep(
        "budgetMax",
        "What budget would you like me to work within?",
        "discover_budget",
      );
    }

    if (!requirements.fabric) {
      return createStep(
        "fabric",
        "Which fabric would you prefer?",
        "discover_fabric",
      );
    }

    if (!requirements.branding) {
      return createStep(
        "branding",
        "What branding would you prefer?",
      );
    }

    return createStep(
      null,
      "Thank you. I have enough information to prepare suitable uniform recommendations and a quotation request.",
      "ready_for_recommendations",
    );
  }

  const department =
    getDepartment(requirements);

  if (!department) {
    if (
      workflow === "gift_buyer" &&
      !requirements.gender
    ) {
      return createStep(
        "gender",
        "Who is the gift for?",
        "discover_department",
      );
    }

    if (
      normalizeValue(requirements.category)
        .includes("suit")
    ) {
      return createStep(
        "department",
        "Is the suit for Men or Women?",
        "discover_department",
      );
    }

    return createStep(
      "department",
      "Who are you shopping for?",
      "discover_department",
    );
  }

  const accessoriesShopping =
    isAccessoriesShopping(
      department,
      requirements,
    );

    const currentCategory = normalizeValue(
  requirements.category,
);

const isSuitShopping =
  currentCategory === "suit" ||
  currentCategory.includes("suits");

const isSuitWeddingShopping =
  isSuitShopping &&
  normalizeValue(
    requirements.occasion,
  ).includes("wedding");

  if (workflow === "custom_design") {
    if (!requirements.category) {
      return createStep(
        "category",
        "What would you like to customize?",
        "discover_product",
      );
    }

    if (
      requirements.selectedProductId === null
    ) {
      return createStep(
        "selectedProductId",
        "Choose a customizable design to continue.",
        "select_product_style",
      );
    }

    const customizationStep =
      getForcedCustomizationStep(
        requirements,
      );

    if (customizationStep) {
      return customizationStep;
    }

    return createStep(
      null,
      "Your design choices are ready. Review them and continue on the Tech-Tailor product page.",
      "review_tailored_order",
    );
  }

  if (
    (workflow as string) === "occasion_shopping" &&
    !requirements.occasion
  ) {
    return createStep(
      "occasion",
      "What is the occasion?",
      "discover_occasion",
    );
  }

  if (
    accessoriesShopping &&
    !requirements.subcategory
  ) {
    return createStep(
      "subcategory",
      "What would you like to see?",
      "discover_subcategory",
    );
  }

  if (
    !accessoriesShopping &&
    !requirements.category
  ) {
    return createStep(
      "category",
      "What would you like to shop for?",
      "discover_product",
    );
  }

  /*
   * Manager-approved shopping order:
   * occasion first, then price range.
   * Keeping this rule here applies it to
   * every customer-facing garment workflow
   * that uses both fields.
   */
  if (
    !accessoriesShopping &&
    !requirements.occasion
  ) {
    return createStep(
      "occasion",
      "What is the occasion?",
      "discover_occasion",
    );
  }

  if (
    !accessoriesShopping &&
    requirements.budgetMin === null &&
    requirements.budgetMax === null
  ) {
    return createStep(
      "budgetMax",
      "What price range would you like me to work within?",
      "discover_budget",
    );
  }

const indianCeremonialShopping =
  normalizeValue(
    requirements.category,
  ).includes("indian ceremonial");

/*
 * Wedding / Ceremony describes the occasion, not the
 * customer's culture or garment style. Event-specific
 * Haldi / Mehendi / Reception choices are useful only
 * after the customer explicitly chooses Indian Ceremonial.
 */
if (
  !accessoriesShopping &&
  indianCeremonialShopping &&
  normalizeValue(
    requirements.occasion,
  ).includes("wedding") &&
  !requirements.weddingFunction
) {
    return createStep(
      "weddingFunction",
      "Which wedding event are you shopping for?",
      "discover_occasion",
    );
  }

if (
  needsSubcategory(
    department,
    requirements,
  ) &&
  !requirements.subcategory
) {
    const category = normalizeValue(
      requirements.category,
    );

    if (
      category === "shirt" ||
      category.includes("mens shirts")
    ) {
      return createStep(
        "subcategory",
        "Which shirt style would you prefer?",
        "discover_subcategory",
      );
    }

    return createStep(
      "subcategory",
      "Which suit style would you like to explore?",
      "discover_subcategory",
    );
  }

  const selectedProduct =
    requirements.selectedProductId !== null
      ? getCatalogProductById(
          requirements.selectedProductId,
        )
      : null;

  const hasSelectedProduct =
    requirements.selectedProductId !== null;

  if (
    !hasSelectedProduct &&
    workflow === "bridegroom_party" &&
    !requirements.category &&
    requirements.quantity === null
  ) {
    return createStep(
      "quantity",
      "How many people require coordinated outfits?",
    );
  }

  if (accessoriesShopping) {
    if (selectedProduct) {
      return createStep(
        null,
        "Your accessory is selected. Review your selection and continue on Tech-Tailor to complete your order.",
        "review_tailored_order",
      );
    }

    return createStep(
      null,
      "Choose an accessory to continue.",
      "ready_for_recommendations",
    );
  }

  if (
    requirements.selectedProductId === null
  ) {
    return createStep(
      "selectedProductId",
      "Choose a product to continue. Customization is available on supported designs.",
      "select_product_style",
    );
  }

  const availableGroupIds =
    new Set(
      selectedProduct
        ? getCustomizationGroupsByIds(
            selectedProduct.customizationIds,
          ).map((group) => group.id)
        : [],
    );

/*
 * Ask about style customization only
 * when the selected live product has
 * actual customization groups.
 */
  if (
    availableGroupIds.size > 0 &&
    !requirements.customizationPreference
  ) {
    return createStep(
      "customizationPreference",
      "Would you like to customize this design?",
      "discover_customization",
    );
  }
  const shouldCustomize =
    wantsCustomization(
      requirements.customizationPreference,
    );

  if (
    shouldCustomize &&
    availableGroupIds.has(1) &&
    !requirements.lapelStyle
  ) {
    return createStep(
      "lapelStyle",
      "Which lapel style would you prefer?",
      "customize_lapel",
    );
  }

  if (
    shouldCustomize &&
    availableGroupIds.has(2) &&
    !requirements.shoulderStyle
  ) {
    return createStep(
      "shoulderStyle",
      "Which shoulder construction would you prefer?",
      "customize_shoulder",
    );
  }

  if (
    shouldCustomize &&
    availableGroupIds.has(4) &&
    !requirements.buttonStyle
  ) {
    return createStep(
      "buttonStyle",
      "Which jacket closure would you prefer?",
      "customize_buttons",
    );
  }

  if (
    shouldCustomize &&
    availableGroupIds.has(5) &&
    !requirements.ventType
  ) {
    return createStep(
      "ventType",
      "Which jacket vent style would you prefer?",
      "customize_vent",
    );
  }

  if (
    shouldCustomize &&
    availableGroupIds.has(6) &&
    !requirements.blazerOptions
  ) {
    return createStep(
      "blazerOptions",
      "Would you like any additional blazer options?",
      "customize_blazer_options",
    );
  }

  if (
    shouldCustomize &&
    availableGroupIds.has(17) &&
    !requirements.trouserStyle
  ) {
    return createStep(
      "trouserStyle",
      "Which trouser style would you prefer?",
      "customize_trousers",
    );
  }

  if (
    shouldCustomize &&
    availableGroupIds.has(18) &&
    !requirements.trouserWaistbandStyle
  ) {
    return createStep(
      "trouserWaistbandStyle",
      "Which trouser waistband fastening would you prefer?",
      "customize_trouser_waistband",
    );
  }

  if (
    selectedProduct?.canChangeFabric ===
      true &&
    !requirements.fabric
  ) {
    return createStep(
      "fabric",
      "Which fabric would you prefer?",
      "discover_fabric",
    );
  }

  if (
    (selectedProduct?.supportsReadyMade ===
      true ||
      selectedProduct
        ?.supportsCustomMeasurements ===
        true) &&
    !requirements.fit
  ) {
    return createStep(
      "fit",
      "Which fit suits you best?",
      "discover_fit",
    );
  }

  if (
    workflow === "international_customer" &&
    !requirements.country
  ) {
    return createStep(
      "country",
      "Which country should the order be delivered to?",
    );
  }

  const supportsMeasurements = Boolean(
    selectedProduct?.supportsReadyMade ||
      selectedProduct
        ?.supportsCustomMeasurements ||
      selectedProduct
        ?.supportsTechnicianVisit,
  );

  if (!supportsMeasurements) {
    return createStep(
      null,
      "Your selection is ready to review on Tech-Tailor.",
      "review_tailored_order",
    );
  }

if (!requirements.measurementMethod) {
  return createStep(
    "measurementMethod",
    "How would you like to provide your measurements?",
    "discover_measurement",
  );
}

const measurementMethod =
  normalizeValue(
    requirements.measurementMethod,
  );

const usesReadySize =
  measurementMethod.includes("ready");

const usesCustomMeasurements =
  measurementMethod.includes("custom");

const usesAutomatedMeasurements =
  measurementMethod.includes(
    "automated",
  );

const schedulesTechnician =
  measurementMethod.includes(
    "technician",
  ) ||
  measurementMethod.includes(
    "schedule",
  );

if (schedulesTechnician) {
  if (!requirements.technicianCity) {
    return createStep(
      "technicianCity",
      "Which city should we schedule the technician visit in?",
      "discover_technician_city",
    );
  }

  if (!requirements.technicianDate) {
    return createStep(
      "technicianDate",
      "What is your preferred visit date? We’ll confirm the available time before the visit.",
      "discover_technician_date",
    );
  }
}

if (usesReadySize) {
  if (!requirements.heightProfile) {
    return createStep(
      "heightProfile",
      "Which height range best describes you?",
      "discover_height",
    );
  }

  if (
    !requirements.bodyType &&
    !requirements.fit
  ) {
    return createStep(
      "bodyType",
      "Which body build looks closest to you?",
      "discover_body_type",
    );
  }

  if (!requirements.readySize) {
    return createStep(
      "readySize",
      "Which ready size do you normally wear?",
      "discover_ready_size",
    );
  }
}

if (
  usesCustomMeasurements &&
  !requirements.customMeasurements
) {
  return createStep(
    "customMeasurements",
    "Please enter your measurements in inches using the form below.",
    "collect_custom_measurements",
  );
}

if (usesCustomMeasurements) {
  return createStep(
    null,
    "Your custom measurements have been added. Please review all your selections before continuing.",
    "review_tailored_order",
  );
}

if (usesAutomatedMeasurements) {
  return createStep(
    null,
    "Your style selection is ready. Continue with Tech-Tailor’s automated body scan to capture your measurements.",
    "review_tailored_order",
  );
}

if (schedulesTechnician) {
  return createStep(
    null,
    "Your technician visit request is ready. Tech-Tailor will confirm the available time before the visit.",
    "review_tailored_order",
  );
}

return createStep(
  null,
  "Your tailored selection is ready to review. Please check the product, fabric, style options, body profile, and measurement method before continuing.",
  "review_tailored_order",
);
}
