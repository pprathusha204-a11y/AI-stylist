import {
  getCatalogProducts,
  type CatalogProduct,
} from "./catalog.service";

import {
  getCustomizationGroupsByIds,
} from "./customization-catalog.service";

import type {
  CustomerRequirements,
} from "./session.service";

export type RecommendationMatchType =
  | "exact"
  | "alternative";

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

export type ProductRecommendation = {
  product: RecommendedProduct;
  matchPercentage: number;
  matchType: RecommendationMatchType;
  reasons: string[];
  warnings: string[];
  tailoringMessage: string | null;
  scoreBreakdown: ScoreBreakdown;
};

type EvaluatedProduct = {
  product: CatalogProduct;
  exactMatch: boolean;
  matchPercentage: number;
  reasons: string[];
  warnings: string[];
  tailoringMessage: string | null;
  scoreBreakdown: ScoreBreakdown;
};

const weights = {
  department: 10,
  category: 25,
  subcategory: 15,
  occasion: 15,
  fabric: 10,
  fit: 10,
  colour: 10,
  budget: 15,
  style: 5,
};

const knownColours = [
  "navy blue",
  "black",
  "charcoal grey",
  "grey",
  "beige",
  "white",
  "cream",
  "burgundy",
  "brown",
  "green",
  "blue",
  "red",
  "pink",
  "yellow",
  "orange",
  "purple",
];

const knownFits = [
  "regular",
  "slim",
  "loose",
  "relaxed",
  "tailored",
];

function normalizeValue(
  value: string,
): string {
  return value
    .toLowerCase()
    .replace(/gray/g, "grey")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsPhrase(
  text: string,
  phrase: string,
): boolean {
  const normalizedText =
    ` ${normalizeValue(text)} `;

  const normalizedPhrase =
    ` ${normalizeValue(phrase)} `;

  return normalizedText.includes(
    normalizedPhrase,
  );
}

function getProductText(
  product: CatalogProduct,
): string {
  return normalizeValue(
    [
      product.name,
      product.shortDescription,
      product.category,
      product.subcategory,
      product.subSubcategory,
      product.fabric,
      product.searchText,
    ].join(" "),
  );
}

function getRequestedDepartment(
  requirements: CustomerRequirements,
): string | null {
  const department =
    requirements.department ||
    requirements.gender;

  if (!department) {
    return null;
  }

  const normalized =
    normalizeValue(department);

  if (
    normalized.includes("women") ||
    normalized.includes("woman") ||
    normalized.includes("female")
  ) {
    return "women";
  }

  if (
    normalized.includes("men") ||
    normalized.includes("man") ||
    normalized.includes("male")
  ) {
    return "men";
  }

  if (
    normalized.includes("accessor")
  ) {
    return "accessories";
  }

  return normalized;
}

function matchesDepartment(
  product: CatalogProduct,
  requirements: CustomerRequirements,
): boolean {
  const requestedDepartment =
    getRequestedDepartment(requirements);

  if (!requestedDepartment) {
    return true;
  }

  return (
    normalizeValue(product.category) ===
    requestedDepartment
  );
}

function matchesCategory(
  product: CatalogProduct,
  category: string,
): boolean {
  const requestedCategory =
    normalizeValue(category);

  const productName =
    normalizeValue(product.name);

  const productCategory =
    normalizeValue(product.category);

  const productSubcategory =
    normalizeValue(product.subcategory);

  const productSubSubcategory =
    normalizeValue(product.subSubcategory);

  if (
    requestedCategory.includes("accessor")
  ) {
    return (
      productCategory === "accessories"
    );
  }

  if (
    requestedCategory.includes("indian") ||
    requestedCategory.includes("ceremonial")
  ) {
    return productSubcategory.includes(
      "indian ceremonial",
    );
  }

  if (
    requestedCategory.includes("sherwani")
  ) {
    return (
      productSubcategory.includes(
        "indian ceremonial",
      ) &&
      getProductText(product).includes(
        "sherwani",
      )
    );
  }

  if (
    requestedCategory.includes("kurta")
  ) {
    return (
      productSubcategory.includes(
        "indian ceremonial",
      ) &&
      getProductText(product).includes(
        "kurta",
      )
    );
  }

  if (
    requestedCategory.includes("bandhgala")
  ) {
    return (
      productSubSubcategory.includes(
        "bandhgala",
      ) ||
      getProductText(product).includes(
        "bandhgala",
      )
    );
  }

  if (
    requestedCategory.includes("tuxedo")
  ) {
    return (
      productSubSubcategory.includes(
        "tuxedo",
      ) ||
      productName.includes("tuxedo")
    );
  }

  if (
    requestedCategory.includes("overcoat")
  ) {
    return productSubcategory.includes(
      "overcoat",
    );
  }

  if (
    requestedCategory.includes("t shirt")
  ) {
    return (
      productSubcategory === "t shirts" ||
      productSubSubcategory === "t shirts" ||
      /\bt shirt\b/.test(productName)
    );
  }

  if (
    requestedCategory.includes("shirt")
  ) {
    const isTShirt =
      productName.includes("t shirt") ||
      productSubcategory.includes(
        "t shirt",
      ) ||
      productSubSubcategory.includes(
        "t shirt",
      );

    return (
      !isTShirt &&
      (productSubcategory.includes(
        "shirt",
      ) ||
        productSubSubcategory.includes(
          "shirt",
        ))
    );
  }

  if (
    requestedCategory.includes("trouser") ||
    requestedCategory.includes("skirt")
  ) {
    return (
      productSubcategory.includes(
        "trouser",
      ) ||
      productSubcategory.includes("skirt")
    );
  }

  if (
    requestedCategory.includes("blazer") ||
    requestedCategory === "jacket"
  ) {
    return (
      productName.includes("blazer") ||
      productName.includes("jacket") ||
      productSubcategory.includes(
        "women jackets",
      )
    );
  }

  if (
    requestedCategory.includes("suit")
  ) {
    return (
      productSubcategory.includes(
        "mens suits and jackets",
      ) ||
      productSubcategory.includes(
        "women suits",
      )
    );
  }

  if (
    requestedCategory.includes("uniform")
  ) {
    return getProductText(product).includes(
      "uniform",
    );
  }

  return getProductText(product).includes(
    requestedCategory,
  );
}

function singularizeLabel(
  value: string,
): string {
  return normalizeValue(value)
    .split(" ")
    .map((word) => {
      if (
        word.length > 4 &&
        word.endsWith("s")
      ) {
        return word.slice(0, -1);
      }

      return word;
    })
    .join(" ");
}

function matchesSubcategory(
  product: CatalogProduct,
  subcategory: string,
): boolean {
  const requested =
    singularizeLabel(subcategory);

  const actual =
    singularizeLabel(
      product.subSubcategory,
    );

  return requested === actual;
}

function hasExplicitSuitStyle(
  requirements: CustomerRequirements,
): boolean {
  const category = normalizeValue(
    requirements.category ?? "",
  );

  return (
    (category === "suit" ||
      category.includes("suits")) &&
    requirements.subcategory !== null
  );
}

function matchesOccasion(
  product: CatalogProduct,
  occasion: string,
): boolean {
  const requested =
    normalizeValue(occasion);

  if (
    requested === "all" ||
    requested.includes("exploring")
  ) {
    return true;
  }

  const productText =
    getProductText(product);

  const subcategory =
    normalizeValue(product.subcategory);

  const productType =
    normalizeValue(product.subSubcategory);

  if (
    requested.includes("office") ||
    requested.includes("business") ||
    requested.includes("interview")
  ) {
    return (
      productType === "formal wear" ||
      productText.includes("formal") ||
      productText.includes("business") ||
      productText.includes("office")
    );
  }

  if (
    requested.includes("wedding")
  ) {
    const isWeddingAccessory =
      normalizeValue(product.category) ===
        "accessories" &&
      [
        "bow tie",
        "tie",
        "combo",
        "scarf",
      ].some((accessory) =>
        normalizeValue(
          `${product.subcategory} ${product.subSubcategory}`,
        ).includes(accessory),
      );

    return (
      isWeddingAccessory ||
      subcategory.includes(
        "indian ceremonial",
      ) ||
      productType.includes("tuxedo") ||
      productType.includes(
        "complete attire",
      ) ||
      productText.includes("wedding") ||
      productText.includes("groom") ||
      productText.includes("reception")
    );
  }

  if (
    requested.includes("party") ||
    requested.includes("cocktail")
  ) {
    return (
      productType.includes("semi formal") ||
      productType.includes("tuxedo") ||
      productText.includes("party") ||
      productText.includes("cocktail")
    );
  }

  if (
    requested.includes("festival")
  ) {
    return (
      subcategory.includes(
        "indian ceremonial",
      ) ||
      productText.includes("festival") ||
      productText.includes("traditional")
    );
  }

  if (
    requested.includes("casual") ||
    requested.includes("travel")
  ) {
    return (
      productType.includes("semi formal") ||
      productText.includes("casual") ||
      productText.includes("travel") ||
      productText.includes("t shirt")
    );
  }

  if (
    requested.includes("graduation")
  ) {
    return (
      productType.includes("formal") ||
      productText.includes("graduation")
    );
  }

  if (
    requested.includes("special")
  ) {
    return (
      productType.includes("formal") ||
      productType.includes("tuxedo") ||
      subcategory.includes(
        "indian ceremonial",
      )
    );
  }

  return productText.includes(requested);
}

/*
 * Occasion buttons are offered only when the
 * live catalogue has a defensible match. Wedding
 * intentionally relies on catalogue taxonomy,
 * rather than incidental words in descriptions,
 * so a women's wedding collection is not implied
 * when one is not present in the source data.
 */
function matchesSelectableOccasion(
  product: CatalogProduct,
  occasion: string,
): boolean {
  const requested = normalizeValue(occasion);

  if (requested.includes("wedding")) {
    const isWeddingAccessory =
      normalizeValue(product.category) ===
        "accessories" &&
      [
        "bow tie",
        "tie",
        "combo",
        "scarf",
      ].some((accessory) =>
        normalizeValue(
          `${product.subcategory} ${product.subSubcategory}`,
        ).includes(accessory),
      );

    const subcategory = normalizeValue(
      product.subcategory,
    );
    const productType = normalizeValue(
      product.subSubcategory,
    );

    return (
      isWeddingAccessory ||
      subcategory.includes(
        "indian ceremonial",
      ) ||
      productType.includes("wedding") ||
      productType.includes("groom") ||
      productType.includes("tuxedo")
    );
  }

  return matchesOccasion(product, occasion);
}

function matchesWeddingFunction(
  product: CatalogProduct,
  weddingFunction: string,
): boolean {
  const requested =
    normalizeValue(weddingFunction);

  const productText =
    getProductText(product);

  const productType =
    normalizeValue(product.subSubcategory);

  if (
    requested.includes("wedding ceremony")
  ) {
    return (
      productText.includes("wedding") ||
      productText.includes("groom") ||
      productType.includes(
        "complete attire",
      ) ||
      productType.includes("tuxedo")
    );
  }

  if (
  requested.includes("reception")
) {
  return (
    productType.includes("formal") ||
    productType.includes("tuxedo") ||
    productType.includes(
      "complete attire",
    ) ||
    productText.includes("wedding") ||
    productText.includes("groom") ||
    productText.includes("reception")
  );
}

  return (
    productType.includes(requested) ||
    productText.includes(requested)
  );
}

function supportsFabricChoice(
  product: CatalogProduct,
): boolean {
  const defaultFabric =
    normalizeValue(product.fabric);

  return (
    product.canChangeFabric ||
    defaultFabric.includes(
      "choose other fabric",
    ) ||
    defaultFabric.includes(
      "own fabric",
    )
  );
}

function matchesDefaultFabric(
  product: CatalogProduct,
  fabric: string,
): boolean {
  const requested =
    normalizeValue(fabric);

  const productText =
    getProductText(product);

  if (
    requested.includes("own fabric")
  ) {
    return productText.includes(
      "own fabric",
    );
  }

  return containsPhrase(
    productText,
    requested,
  );
}

function matchesFabric(
  product: CatalogProduct,
  fabric: string,
): boolean {
  return (
    matchesDefaultFabric(
      product,
      fabric,
    ) ||
    supportsFabricChoice(product)
  );
}

function matchesFit(
  product: CatalogProduct,
  fit: string,
  measurementMethod: string | null,
): boolean {
  const requested =
    normalizeValue(fit);

  const defaultFitMatched =
    containsPhrase(
      getProductText(product),
      requested,
    );

  if (defaultFitMatched) {
    return true;
  }

  const readySizeSelected =
    measurementMethod !== null &&
    normalizeValue(
      measurementMethod,
    ).includes("ready size");

  if (readySizeSelected) {
    return product.supportsReadyMade;
  }

  return product.supportsCustomMeasurements;
}

function matchesDefaultColour(
  product: CatalogProduct,
  colour: string,
): boolean {
  const requested =
    normalizeValue(colour);

  const productText =
    normalizeValue(
      product.imageColourText,
    );

  const aliases: Record<
    string,
    string[]
  > = {
    "navy blue": [
      "navy blue",
      "navy",
      "midnight blue",
    ],
    "charcoal grey": [
      "charcoal grey",
      "charcoal",
      "graphite",
    ],
    beige: [
      "beige",
      "cream",
      "sand",
      "taupe",
      "camel",
      "khaki",
    ],
    white: [
      "white",
      "pearl white",
      "ivory",
    ],
    burgundy: [
      "burgundy",
      "wine",
      "maroon",
    ],
    black: [
      "black",
      "noir",
      "midnight",
    ],
    cream: [
      "cream",
      "ivory",
      "champagne",
    ],
    green: [
      "green",
      "verdant",
      "sage",
    ],
    pink: [
      "pink",
      "rose",
      "dustrose",
    ],
  };

  const possibleValues =
    aliases[requested] || [requested];

  return possibleValues.some(
    (value) =>
      containsPhrase(
        productText,
        value,
      ),
  );
}

function matchesColour(
  product: CatalogProduct,
  colour: string,
): boolean {
  return matchesDefaultColour(
    product,
    colour,
  );
}

function matchesStyle(
  product: CatalogProduct,
  style: string,
): boolean {
  const requested =
    normalizeValue(style);

  const productText =
    getProductText(product);

  const aliases: Record<
    string,
    string[]
  > = {
    classic: [
      "classic",
      "timeless",
      "formal",
      "elegant",
    ],
    modern: [
      "modern",
      "contemporary",
      "sleek",
      "smart",
    ],
    minimal: [
      "minimal",
      "clean",
      "simple",
    ],
    traditional: [
      "traditional",
      "ceremonial",
      "ethnic",
      "indian",
    ],
    luxury: [
      "luxury",
      "premium",
      "lux",
      "elegant",
    ],
  };

  const possibleValues =
    aliases[requested] || [requested];

  return possibleValues.some(
    (value) =>
      productText.includes(
        normalizeValue(value),
      ),
  );
}

function isWithinBudget(
  product: CatalogProduct,
  requirements: CustomerRequirements,
): boolean {
  const lowerTolerance = 500;

  if (
    requirements.budgetMin !== null &&
    product.price <
      requirements.budgetMin -
        lowerTolerance
  ) {
    return false;
  }

  if (
    requirements.budgetMax !== null &&
    product.price >
      requirements.budgetMax
  ) {
    return false;
  }

  return true;
}

function getBudgetWarning(
  product: CatalogProduct,
  requirements: CustomerRequirements,
): string {
  if (
    requirements.budgetMax !== null &&
    product.price >
      requirements.budgetMax
  ) {
    const difference =
      product.price -
      requirements.budgetMax;

    return `₹${difference.toLocaleString(
      "en-IN",
    )} above your budget`;
  }

  if (
    requirements.budgetMin !== null &&
    product.price <
      requirements.budgetMin - 500
  ) {
    const difference =
      requirements.budgetMin -
      product.price;

    return `₹${difference.toLocaleString(
      "en-IN",
    )} below your selected range`;
  }

  return "Outside your selected budget";
}

function evaluateProduct(
  product: CatalogProduct,
  requirements: CustomerRequirements,
): EvaluatedProduct {
  const reasons: string[] = [];
  const warnings: string[] = [];

  const scoreBreakdown: ScoreBreakdown = {
    department: 0,
    category: 0,
    subcategory: 0,
    occasion: 0,
    fabric: 0,
    fit: 0,
    colour: 0,
    budget: 0,
    style: 0,
  };

  let earnedScore = 0;
  let possibleScore = 0;
  let exactMatch = true;

  const addCheck = (
    field: keyof ScoreBreakdown,
    weight: number,
    active: boolean,
    matched: boolean,
    reason: string,
    warning: string,
  ) => {
    if (!active) {
      return;
    }

    possibleScore += weight;

    if (matched) {
      earnedScore += weight;
      scoreBreakdown[field] += weight;
      reasons.push(reason);
    } else {
      exactMatch = false;
      warnings.push(warning);
    }
  };

  const requestedDepartment =
    getRequestedDepartment(requirements);

  const requestedFabric =
    requirements.fabric ?? "";

  const fabricUsesTailoring =
    requestedFabric.length > 0 &&
    supportsFabricChoice(product) &&
    !matchesDefaultFabric(
      product,
      requestedFabric,
    );

  const fitUsesTailoring =
    requirements.fit !== null &&
    product.supportsCustomMeasurements &&
    !normalizeValue(
      requirements.measurementMethod ?? "",
    ).includes("ready size") &&
    !containsPhrase(
      getProductText(product),
      requirements.fit,
    );

  const fitUsesReadySize =
    requirements.fit !== null &&
    normalizeValue(
      requirements.measurementMethod ?? "",
    ).includes("ready size") &&
    product.supportsReadyMade &&
    !containsPhrase(
      getProductText(product),
      requirements.fit,
    );

  const tailoringNotes: string[] = [];

  if (fabricUsesTailoring) {
    tailoringNotes.push(
      requestedFabric
        .toLowerCase()
        .includes("own fabric")
        ? "Can be stitched using your own fabric"
        : `Can be stitched using ${requestedFabric}`,
    );
  }

  if (fitUsesTailoring) {
    tailoringNotes.push(
      `${requirements.fit} fit can be made to your measurements`,
    );
  }

  if (fitUsesReadySize) {
    tailoringNotes.push(
      `The closest available ready size will be selected for your ${requirements.fit} fit preference`,
    );
  }

  if (
    requirements.stylePreference &&
    product.canCustomizeStyle
  ) {
    tailoringNotes.push(
      "Style details can be customized",
    );
  }

  const tailoringMessage =
    tailoringNotes.length > 0
      ? tailoringNotes.join(" • ")
      : null;

  const fabricMatchReason =
    fabricUsesTailoring
      ? requestedFabric
          .toLowerCase()
          .includes("own fabric")
        ? "Can be tailored using your own fabric"
        : `Can be tailored using your selected ${requestedFabric} fabric`
      : `Default fabric matches your ${requirements.fabric} preference`;

  const fitMatchReason =
    fitUsesTailoring
      ? `${requirements.fit} fit can be tailored to your measurements`
      : fitUsesReadySize
        ? `${requirements.fit} preference can be matched with an available ready size`
        : `${requirements.fit} fit is available`;

  addCheck(
    "department",
    weights.department,
    requestedDepartment !== null,
    matchesDepartment(
      product,
      requirements,
    ),
    `From the ${product.category} collection`,
    `This product is from the ${product.category} collection`,
  );

  addCheck(
    "category",
    weights.category,
    requirements.category !== null,
    requirements.category
      ? matchesCategory(
          product,
          requirements.category,
        )
      : true,
    `Matches your ${requirements.category} selection`,
    `This is not an exact ${requirements.category} match`,
  );

  addCheck(
    "subcategory",
    weights.subcategory,
    requirements.subcategory !== null,
    requirements.subcategory
      ? matchesSubcategory(
          product,
          requirements.subcategory,
        )
      : true,
    `Matches ${requirements.subcategory}`,
    `Closest available style is ${product.subSubcategory}`,
  );

  addCheck(
    "occasion",
    weights.occasion,
    requirements.occasion !== null &&
      !hasExplicitSuitStyle(requirements),
    requirements.occasion
      ? matchesOccasion(
          product,
          requirements.occasion,
        )
      : true,
    `Suitable for ${requirements.occasion}`,
    `Suitability for ${requirements.occasion} is not confirmed`,
  );

  addCheck(
    "occasion",
    10,
    requirements.weddingFunction !== null,
    requirements.weddingFunction
      ? matchesWeddingFunction(
          product,
          requirements.weddingFunction,
        )
      : true,
    `Suitable for ${requirements.weddingFunction}`,
    `Not an exact ${requirements.weddingFunction} match`,
  );

  addCheck(
    "fabric",
    weights.fabric,
    requirements.fabric !== null,
    requirements.fabric
      ? matchesFabric(
          product,
          requirements.fabric,
        )
      : true,
    fabricMatchReason,
    `${requirements.fabric} is not available for this style`,
  );

  addCheck(
    "fit",
    weights.fit,
    requirements.fit !== null,
    requirements.fit
      ? matchesFit(
          product,
          requirements.fit,
          requirements.measurementMethod,
        )
      : true,
    fitMatchReason,
    `${requirements.fit} fit is not confirmed`,
  );

  addCheck(
    "colour",
    weights.colour,
    requirements.colour !== null,
    requirements.colour
      ? matchesColour(
          product,
          requirements.colour,
        )
      : true,
    `Available in your preferred ${requirements.colour}`,
    `${requirements.colour} is not available for this style`,
  );

  const hasBudget =
    requirements.budgetMin !== null ||
    requirements.budgetMax !== null;

  addCheck(
    "budget",
    weights.budget,
    hasBudget,
    isWithinBudget(
      product,
      requirements,
    ),
    "Within your selected budget",
    getBudgetWarning(
      product,
      requirements,
    ),
  );

  addCheck(
    "style",
    weights.style,
    requirements.stylePreference !== null,
    requirements.stylePreference
      ? matchesStyle(
          product,
          requirements.stylePreference,
        )
      : true,
    `Matches your ${requirements.stylePreference} style`,
    `${requirements.stylePreference} styling is not confirmed`,
  );

  const matchPercentage =
    possibleScore > 0
      ? Math.round(
          (earnedScore / possibleScore) *
            100,
        )
      : 0;

  return {
    product,
    exactMatch,
    matchPercentage,
    reasons,
    warnings,
    tailoringMessage,
    scoreBreakdown,
  };
}

function extractKnownValues(
  product: CatalogProduct,
  values: string[],
): string[] {
  const productText =
    getProductText(product);

  return values.filter((value) =>
    containsPhrase(
      productText,
      value,
    ),
  );
}

function createPublicProduct(
  product: CatalogProduct,
): RecommendedProduct {
  const customizationOptions =
    product.canCustomizeStyle
      ? getCustomizationGroupsByIds(
          product.customizationIds,
        ).map((group) => group.name)
      : [];

  const occasions = [
    "wedding",
    "business",
    "party",
    "festival",
    "casual",
  ].filter((occasion) =>
    matchesOccasion(product, occasion),
  );

  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    slug: String(product.id),
    shortDescription:
      product.shortDescription,

    category: product.category,
    subcategory: product.subcategory,
    subSubcategory:
      product.subSubcategory,

    occasions,
    defaultFabricId:
      product.defaultFabricId,
    fabric: product.fabric,
    colours: extractKnownValues(
      product,
      knownColours,
    ),
    fits: extractKnownValues(
      product,
      knownFits,
    ),

    customizationIds:
      product.customizationIds,

    customizationOptions,

    canChangeFabric:
      supportsFabricChoice(product),

    canCustomizeStyle:
      customizationOptions.length > 0,

    supportsReadyMade:
      product.supportsReadyMade,

    supportsCustomMeasurements:
      product.supportsCustomMeasurements,

    supportsTechnicianVisit:
      product.supportsTechnicianVisit,

    price: product.price,
    mrp: product.mrp,

    priceIsStartingPrice:
      supportsFabricChoice(product) ||
      customizationOptions.length > 0,

    imageUrl: product.imageUrl,
    productUrl: product.productUrl,
    inStock: product.inStock,
  };
}

function createRecommendation(
  evaluatedProduct: EvaluatedProduct,
  matchType: RecommendationMatchType,
): ProductRecommendation {
  return {
    product: createPublicProduct(
      evaluatedProduct.product,
    ),
    matchPercentage:
      evaluatedProduct.matchPercentage,
    matchType,
    reasons: evaluatedProduct.reasons,
    warnings: evaluatedProduct.warnings,
    tailoringMessage:
      evaluatedProduct.tailoringMessage,
    scoreBreakdown:
      evaluatedProduct.scoreBreakdown,
  };
}

function selectStoreAttendantOptions(
  candidates: EvaluatedProduct[],
  requirements: CustomerRequirements,
  limit: number,
): EvaluatedProduct[] {
  if (candidates.length <= limit) {
    return candidates;
  }

  const highestMatch = Math.max(
    ...candidates.map(
      (candidate) =>
        candidate.matchPercentage,
    ),
  );

  /*
   * Only balance prices between products
   * that have almost the same match score.
   */
  const strongestCandidates =
    candidates.filter(
      (candidate) =>
        candidate.matchPercentage >=
        highestMatch - 5,
    );

  const selectionPool =
    strongestCandidates.length >= limit
      ? strongestCandidates
      : candidates;

  const productsByPriority = [
    ...selectionPool,
  ].sort(
    (first, second) => {
      const firstColourPriority =
        requirements.colour &&
        matchesDefaultColour(
          first.product,
          requirements.colour,
        )
          ? 0
          : 1;

      const secondColourPriority =
        requirements.colour &&
        matchesDefaultColour(
          second.product,
          requirements.colour,
        )
          ? 0
          : 1;

      return (
        firstColourPriority -
          secondColourPriority ||
        first.product.price -
          second.product.price
      );
    },
  );

  /*
   * Keep the first Accessories row varied.
   * The customer should see a regular tie,
   * a bow tie and another accessory before
   * opening the remaining options.
   */
  const isInitialAccessoriesBrowse =
    getRequestedDepartment(requirements) ===
      "accessories" &&
    !requirements.subcategory;

  if (isInitialAccessoriesBrowse) {
    const selected:
      EvaluatedProduct[] = [];

    const preferredAccessoryTypes = [
      (subcategory: string) =>
        subcategory === "tie",

      (subcategory: string) =>
        subcategory === "bow tie",

      (subcategory: string) =>
        subcategory !== "tie" &&
        subcategory !== "bow tie",
    ];

    for (
      const matchesAccessoryType of
      preferredAccessoryTypes
    ) {
      const candidate =
        productsByPriority.find(
          (recommendation) =>
            !selected.includes(
              recommendation,
            ) &&
            matchesAccessoryType(
              normalizeValue(
                recommendation.product
                  .subcategory,
              ),
            ),
        );

      if (candidate) {
        selected.push(candidate);
      }

      if (selected.length === limit) {
        return selected;
      }
    }

    for (
      const candidate of productsByPriority
    ) {
      if (!selected.includes(candidate)) {
        selected.push(candidate);
      }

      if (selected.length === limit) {
        break;
      }
    }

    return selected.slice(0, limit);
  }

  const hasBudget =
    requirements.budgetMin !== null ||
    requirements.budgetMax !== null;

  /*
   * Once the customer gives a budget,
   * show the most affordable matching
   * products inside that budget first.
   */
  if (hasBudget) {
    return productsByPriority.slice(
      0,
      limit,
    );
  }

  /*
   * When only Men/Women is known, show
   * affordable products from different
   * garment categories.
   */
  if (!requirements.category) {
  const selected:
    EvaluatedProduct[] = [];

  const usedSubcategories =
    new Set<string>();

  const departmentText =
    normalizeValue(
      `${requirements.department ?? ""} ${
        requirements.gender ?? ""
      }`,
    );

  const isMenDepartment =
    departmentText.includes("men") &&
    !departmentText.includes("women");

  /*
   * Give the initial Men collection a
   * polished store-front selection:
   * suit, formal shirt and trousers.
   */
  if (isMenDepartment) {
    const preferredGarments = [
      (text: string) =>
        text.includes("suit"),

      (text: string) =>
        text.includes("shirt") &&
        !text.includes("t shirt"),

      (text: string) =>
        text.includes("trouser"),
    ];

    for (
      const matchesGarment of
      preferredGarments
    ) {
      const candidate =
        productsByPriority.find(
          (recommendation) => {
            if (
              selected.includes(
                recommendation,
              )
            ) {
              return false;
            }

            const productText =
              normalizeValue(
                `${
                  recommendation.product
                    .name
                } ${
                  recommendation.product
                    .category
                } ${
                  recommendation.product
                    .subcategory
                } ${
                  recommendation.product
                    .subSubcategory
                }`,
              );

            return matchesGarment(
              productText,
            );
          },
        );

      if (candidate) {
        selected.push(candidate);

        usedSubcategories.add(
          normalizeValue(
            candidate.product
              .subcategory,
          ),
        );
      }

      if (selected.length === limit) {
        return selected;
      }
    }
  }

  /*
   * Fill any remaining positions with
   * products from different categories.
   */
  for (
    const candidate of productsByPriority
  ) {
    if (selected.includes(candidate)) {
      continue;
    }

    const subcategory =
      normalizeValue(
        candidate.product.subcategory,
      );

    if (
      usedSubcategories.has(
        subcategory,
      )
    ) {
      continue;
    }

    usedSubcategories.add(
      subcategory,
    );

    selected.push(candidate);

    if (selected.length === limit) {
      return selected;
    }
  }

  return selected.slice(0, limit);
}

  /*
   * After the garment is selected but
   * before budget is known, show:
   * starting price, value and premium.
   */
  const pricePositions = [
    0,
    Math.floor(
      (productsByPriority.length - 1) *
        0.35,
    ),
    Math.floor(
      (productsByPriority.length - 1) *
        0.65,
    ),
  ];

  const selected:
    EvaluatedProduct[] = [];

  for (
    const position of pricePositions
  ) {
    const candidate =
      productsByPriority[position];

    if (
      candidate &&
      !selected.includes(candidate)
    ) {
      selected.push(candidate);
    }
  }

  for (
    const candidate of productsByPriority
  ) {
    if (
      !selected.includes(candidate)
    ) {
      selected.push(candidate);
    }

    if (selected.length === limit) {
      break;
    }
  }

  return selected.slice(0, limit);
}

function getAvailableProductsForSelection(
  requirements: CustomerRequirements,
  includeBudget: boolean,
): CatalogProduct[] {
  return getCatalogProducts().filter(
    (product) =>
      product.inStock &&
      matchesDepartment(
        product,
        requirements,
      ) &&
      (!requirements.category ||
        matchesCategory(
          product,
          requirements.category,
        )) &&
      (!requirements.subcategory ||
        matchesSubcategory(
          product,
          requirements.subcategory,
        )) &&
      (!requirements.occasion ||
        hasExplicitSuitStyle(requirements) ||
        matchesOccasion(
          product,
          requirements.occasion,
        )) &&
      (!requirements.weddingFunction ||
        matchesWeddingFunction(
          product,
          requirements.weddingFunction,
        )) &&
      (!includeBudget ||
        isWithinBudget(
          product,
          requirements,
        )),
  );
}

export function getAvailableProductOccasions(
  requirements: CustomerRequirements,
  occasions: string[],
): string[] {
  const candidates = getCatalogProducts().filter(
    (product) =>
      product.inStock &&
      matchesDepartment(
        product,
        requirements,
      ) &&
      (!requirements.category ||
        matchesCategory(
          product,
          requirements.category,
        )) &&
      (!requirements.subcategory ||
        matchesSubcategory(
          product,
          requirements.subcategory,
        )) &&
      isWithinBudget(product, requirements),
  );

  return occasions.filter((occasion) =>
    candidates.some((product) =>
      matchesSelectableOccasion(
        product,
        occasion,
      ),
    ),
  );
}

export function getAvailableWeddingFunctions(
  requirements: CustomerRequirements,
  weddingFunctions: string[],
): string[] {
  const candidates =
    getAvailableProductsForSelection(
      {
        ...requirements,
        weddingFunction: null,
      },
      true,
    );

  return weddingFunctions.filter(
    (weddingFunction) =>
      candidates.some((product) =>
        matchesWeddingFunction(
          product,
          weddingFunction,
        ),
      ),
  );
}

export function getAvailableCustomizableProductCategories(
  requirements: CustomerRequirements,
  categories: string[],
): string[] {
  return categories.filter((category) =>
    getAvailableProductsForSelection(
      {
        ...requirements,
        category,
        subcategory: null,
        budgetMin: null,
        budgetMax: null,
      },
      false,
    ).some(
      (product) =>
        product.canCustomizeStyle &&
        product.customizationIds.length > 0,
    ),
  );
}

export function getAvailableProductPricePoints(
  requirements: CustomerRequirements,
): Array<{
  price: number;
  mrp: number;
}> {
  const baseRequirements = {
    ...requirements,
    subcategory: null,
    budgetMin: null,
    budgetMax: null,
  };

  const occasionMatchedProducts =
    getAvailableProductsForSelection(
      baseRequirements,
      false,
    );

  /*
   * Price choices should reflect products that really exist for
   * the selected garment. Some catalogue items do not carry every
   * occasion tag (for example, an overcoat can still be bought for
   * a wedding). If occasion filtering leaves no products, keep the
   * garment/category fixed and relax only occasion-specific fields
   * before building price bands. This avoids falling back to generic
   * price ranges that the selected garment does not actually have.
   */
  const products =
    occasionMatchedProducts.length > 0
      ? occasionMatchedProducts
      : getAvailableProductsForSelection(
          {
            ...baseRequirements,
            occasion: null,
            weddingFunction: null,
            customerRole: null,
          },
          false,
        );

  return products.map((product) => ({
    price: product.price,
    mrp: product.mrp,
  }));
}

export function getAvailableProductCategories(
  requirements: CustomerRequirements,
  categories: string[],
): string[] {
  return categories.filter(
    (category) =>
      getAvailableProductsForSelection(
        {
          ...requirements,
          category,
          subcategory: null,
          budgetMin: null,
          budgetMax: null,
        },
        false,
      ).length > 0,
  );
}

export function getAvailableProductSubcategories(
  requirements: CustomerRequirements,
  subcategories: string[],
): string[] {
  return subcategories.filter(
    (subcategory) =>
      getAvailableProductsForSelection(
        {
          ...requirements,
          subcategory,
        },
        true,
      ).length > 0,
  );
}

export function getAvailableProductColours(
  requirements: CustomerRequirements,
  colours: string[],
): string[] {
  const availableProducts =
    getAvailableProductsForSelection(
      {
        ...requirements,
        colour: null,
      },
      true,
    );

  return colours.filter((colour) =>
    availableProducts.some((product) =>
      matchesDefaultColour(
        product,
        colour,
      ),
    ),
  );
}

export function recommendProducts(
  requirements: CustomerRequirements,
  limit = 3,
): ProductRecommendation[] {
  const availableProducts =
    getCatalogProducts().filter(
      (product) => product.inStock,
    );

  const products =
    requirements.selectedProductId !== null
      ? availableProducts.filter(
          (product) =>
            product.id ===
            requirements.selectedProductId,
        )
      : availableProducts;

  const requestedColour =
    requirements.colour;

  const colourMatchedProducts =
    requestedColour
      ? products.filter((product) =>
          matchesDefaultColour(
            product,
            requestedColour,
          ),
        )
      : products;

  const evaluatedProducts =
    colourMatchedProducts.map((product) =>
      evaluateProduct(
        product,
        requirements,
      ),
    );

  const exactMatches =
    evaluatedProducts
      .filter(
        (recommendation) =>
          recommendation.exactMatch &&
          recommendation.matchPercentage >
            0,
      )
      .sort(
      (first, second) =>
        second.matchPercentage -
        first.matchPercentage,
    );

  if (exactMatches.length > 0) {
    return selectStoreAttendantOptions(
      exactMatches,
      requirements,
      limit,
    ).map((recommendation) =>
      createRecommendation(
        recommendation,
        "exact",
      ),
    );
  }

  const requestedDepartment =
    getRequestedDepartment(requirements);

  const sameDepartment =
    evaluatedProducts.filter(
      (recommendation) =>
        !requestedDepartment ||
        matchesDepartment(
          recommendation.product,
          requirements,
        ),
    );

  const sameCategory =
    requirements.category
      ? sameDepartment.filter(
          (recommendation) =>
            matchesCategory(
              recommendation.product,
              requirements.category!,
            ),
        )
      : sameDepartment;

  const alternativePool =
    sameCategory.length > 0
      ? sameCategory
      : sameDepartment.length > 0
        ? sameDepartment
        : evaluatedProducts;

  const sortedAlternatives =
    alternativePool
      .filter(
        (recommendation) =>
          recommendation.matchPercentage >= 20,
      )
      .sort(
        (first, second) =>
          second.matchPercentage -
            first.matchPercentage ||
          first.warnings.length -
            second.warnings.length,
      );

  return selectStoreAttendantOptions(
    sortedAlternatives,
    requirements,
    limit,
  ).map((recommendation) =>
    createRecommendation(
      recommendation,
      "alternative",
    ),
  );
}

/**
 * Return useful alternatives instead of ending a shopping flow.
 * Keep the customer's explicitly selected garment category first:
 * relax budget, then occasion/event, before widening beyond it.
 */
export function recommendClosestProducts(
  requirements: CustomerRequirements,
  limit = 12,
): ProductRecommendation[] {
  const sameChoiceWithoutBudget =
    recommendExactProducts(
      {
        ...requirements,
        budgetMin: null,
        budgetMax: null,
      },
      limit,
    );

  if (sameChoiceWithoutBudget.length > 0) {
    return sameChoiceWithoutBudget;
  }

  /*
   * If the occasion/event is too specific, keep the chosen
   * garment (Overcoats, Suits, Shirts, etc.) and relax only
   * the occasion before considering another category.
   */
  if (requirements.category) {
    const sameGarmentWithoutOccasion =
      recommendExactProducts(
        {
          ...requirements,
          occasion: null,
          weddingFunction: null,
          budgetMin: null,
          budgetMax: null,
        },
        limit,
      );

    if (sameGarmentWithoutOccasion.length > 0) {
      return sameGarmentWithoutOccasion;
    }
  }

  const scoredAlternatives = recommendProducts(
    requirements,
    limit,
  );

  if (scoredAlternatives.length > 0) {
    return scoredAlternatives;
  }

  return recommendProducts(
    {
      ...requirements,
      category: null,
      subcategory: null,
      occasion: null,
      weddingFunction: null,
      budgetMin: null,
      budgetMax: null,
      colour: null,
      fabric: null,
      fit: null,
      stylePreference: null,
    },
    limit,
  );
}

export function recommendExactProducts(
  requirements: CustomerRequirements,
  limit = 12,
): ProductRecommendation[] {
  const products =
    requirements.selectedProductId !== null
      ? getCatalogProducts().filter(
          (product) =>
            product.id ===
              requirements.selectedProductId &&
            product.inStock,
        )
      : getAvailableProductsForSelection(
          requirements,
          true,
        );

  const exactMatches = products
    .filter(
      (product) =>
        (!requirements.colour ||
          matchesDefaultColour(
            product,
            requirements.colour,
          )) &&
        (!requirements.fabric ||
          matchesFabric(
            product,
            requirements.fabric,
          )) &&
        (!requirements.fit ||
          matchesFit(
            product,
            requirements.fit,
            requirements.measurementMethod,
          )) &&
        (!requirements.stylePreference ||
          matchesStyle(
            product,
            requirements.stylePreference,
          )),
    )
    .map((product) =>
      evaluateProduct(product, requirements),
    )
    .filter(
      (recommendation) =>
        recommendation.exactMatch,
    )
    .sort(
      (first, second) =>
        second.matchPercentage -
        first.matchPercentage,
    );

  return selectStoreAttendantOptions(
    exactMatches,
    requirements,
    limit,
  ).map((recommendation) =>
    createRecommendation(
      recommendation,
      "exact",
    ),
  );
}
