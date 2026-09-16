import type {
  CustomerRequirements,
  RequirementField,
} from "./session.service";

import type {
  WorkflowType,
} from "./workflow.service";

import {
  getCatalogProductById,
} from "./catalog.service";

import {
  getAvailableCustomizableProductCategories,
  getAvailableProductCategories,
  getAvailableProductColours,
  getAvailableProductOccasions,
  getAvailableProductPricePoints,
  getAvailableProductSubcategories,
} from "./recommendation.service";

export type QuickReply = {
  label: string;
  value: string;
};

function option(
  label: string,
  value?: string,
): QuickReply {
  return {
    label,
    value: value ?? label,
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

  if (department.includes("women")) {
    return "women";
  }

  if (department.includes("men")) {
    return "men";
  }

  const gender = normalizeValue(
    requirements.gender,
  );

  if (
    gender === "men" ||
    gender === "male" ||
    gender === "man"
  ) {
    return "men";
  }

  if (
    gender === "women" ||
    gender === "female" ||
    gender === "woman"
  ) {
    return "women";
  }

  return "";
}

type OccasionKey =
  | "business"
  | "wedding"
  | "party"
  | "festival"
  | "casual";

function getOccasionKey(
  requirements: CustomerRequirements,
): OccasionKey | null {
  const occasion = normalizeValue(
    requirements.occasion,
  );

  if (
    occasion.includes("office") ||
    occasion.includes("business")
  ) {
    return "business";
  }

  if (occasion.includes("wedding")) {
    return "wedding";
  }

  if (occasion.includes("party")) {
    return "party";
  }

  if (occasion.includes("festival")) {
    return "festival";
  }

  if (occasion.includes("casual")) {
    return "casual";
  }

  return null;
}

const occasionCategoryLabels: Record<
  "men" | "women",
  Record<OccasionKey, string[]>
> = {
  men: {
    business: [
      "Mens Suits",
      "Mens Trousers",
      "Mens Shirts",
      "Mens Overcoats",
    ],
    wedding: [
      "Mens Suits",
      "Indian Ceremonial",
      "Mens Shirts",
    ],
    party: [
      "Mens Suits",
      "Mens Shirts",
      "Indian Ceremonial",
      "T-shirts",
    ],
    festival: [
      "Indian Ceremonial",
      "Mens Shirts",
    ],
    casual: [
      "Mens Shirts",
      "Mens Trousers",
      "T-shirts",
      "Mens Overcoats",
    ],
  },
  women: {
    business: [
      "Women Suits",
      "Women Jackets",
      "Women Trousers and Skirts",
      "Women Shirts and Tops",
    ],
    wedding: [
      "Women Suits",
      "Women Jackets",
      "Women Shirts and Tops",
    ],
    party: [
      "Women Suits",
      "Women Jackets",
      "Women Trousers and Skirts",
      "Women Shirts and Tops",
    ],
    festival: [
      "Women Suits",
      "Women Jackets",
      "Women Shirts and Tops",
    ],
    casual: [
      "Women Jackets",
      "Women Trousers and Skirts",
      "Women Shirts and Tops",
    ],
  },
};

const occasionAccessoryLabels: Record<
  OccasionKey,
  string[]
> = {
  business: [
    "Tie Box Combos",
    "Belts",
    "Ties",
    "Scarves",
  ],
  wedding: [
    "Tie Box Combos",
    "Bow Ties",
    "Ties",
    "Scarves",
  ],
  party: [
    "Bow Ties",
    "Ties",
    "Belts",
    "Scarves",
  ],
  festival: [
    "Tie Box Combos",
    "Scarves",
  ],
  casual: [
    "Belts",
    "Scarves",
  ],
};

function getCategoryReplies(
  workflow: WorkflowType,
  requirements: CustomerRequirements,
): QuickReply[] {
  const department =
    getDepartment(requirements);

  let categoryReplies:
    QuickReply[];

  if (department === "women") {
    categoryReplies = [
      option(
        "Women Suits",
        "I am looking for Women Suits",
      ),
      option(
        "Women Jackets",
        "I am looking for Women Jackets",
      ),
      option(
        "Women Trousers and Skirts",
        "I am looking for Women Trousers and Skirts",
      ),
      option(
        "Women Shirts and Tops",
        "I am looking for Women Shirts and Tops",
      ),
    ];
  } else {
    categoryReplies = [
      option(
        "Mens Suits",
        "I am looking for Mens Suits",
      ),
      option(
        "Mens Trousers",
        "I am looking for Mens Trousers",
      ),
      option(
        "Mens Shirts",
        "I am looking for Mens Shirts",
      ),
      option(
        "Mens Overcoats",
        "I am looking for Mens Overcoats",
      ),
      option(
        "Indian Ceremonial",
        "I am looking for Indian Ceremonial clothing",
      ),
      option(
        "T-shirts",
        "I am looking for T-shirts",
      ),
    ];
  }

  const occasionKey =
    getOccasionKey(requirements);

  if (
    workflow === "occasion_shopping" &&
    occasionKey &&
    (department === "men" ||
      department === "women")
  ) {
    const allowedLabels = new Set(
      occasionCategoryLabels[
        department
      ][occasionKey],
    );

    categoryReplies =
      categoryReplies.filter((reply) =>
        allowedLabels.has(reply.label),
      );
  }

  const availableCategories =
    new Set(
      getAvailableProductCategories(
        requirements,
        categoryReplies.map(
          (reply) => reply.label,
        ),
      ),
    );

  const availableReplies =
    categoryReplies.filter(
    (reply) =>
      availableCategories.has(
        reply.label,
      ),
  );

  if (workflow !== "custom_design") {
    return availableReplies;
  }

  const customizableCategoryLabels =
    new Set(
      getAvailableCustomizableProductCategories(
        requirements,
        availableReplies.map(
          (reply) => reply.label,
        ),
      ),
    );

  return availableReplies.filter((reply) =>
    customizableCategoryLabels.has(
      reply.label,
    ),
  );
}

function getSubcategoryReplies(
  workflow: WorkflowType,
  requirements: CustomerRequirements,
): QuickReply[] {
  if (workflow === "hospital_uniform") {
    return [
      option(
        "Doctor Coats",
        "We require Doctor Coats",
      ),
      option(
        "Scrubs",
        "We require Scrubs",
      ),
      option(
        "Patient Gowns",
        "We require Patient Gowns",
      ),
      option(
        "Hospital Linen",
        "We require Hospital Linen",
      ),
    ];
  }

  if (workflow === "hotel_uniform") {
    return [
      option(
        "Chef Uniforms",
        "We require Chef Uniforms",
      ),
      option(
        "Steward Uniforms",
        "We require Steward Uniforms",
      ),
      option(
        "Housekeeping Uniforms",
        "We require Housekeeping Uniforms",
      ),
      option(
        "Front Office Attire",
        "We require Front Office Attire",
      ),
    ];
  }

  if (workflow === "corporate_uniform") {
    return [
      option(
        "Shirts",
        "We require uniform shirts",
      ),
      option(
        "Trousers",
        "We require uniform trousers",
      ),
      option(
        "Blazers",
        "We require uniform blazers",
      ),
      option(
        "Jackets",
        "We require uniform jackets",
      ),
      option(
        "T-shirts",
        "We require uniform T-shirts",
      ),
      option(
        "Complete Uniform Sets",
        "We require complete uniform sets",
      ),
    ];
  }

  const department =
    getDepartment(requirements);

  if (department === "accessories") {
    const replies = [
      option(
        "Tie Box Combos",
        "I am looking for Tie Box Combos",
      ),
      option(
        "Belts",
        "I am looking for Belts",
      ),
      option(
        "Bow Ties",
        "I am looking for Bow Ties",
      ),
      option(
        "Ties",
        "I am looking for Ties",
      ),
      option(
        "Scarves",
        "I am looking for Scarves",
      ),
    ];

    const occasionKey =
      getOccasionKey(requirements);

    if (
      workflow !== "occasion_shopping" ||
      !occasionKey
    ) {
      return replies;
    }

    const allowedLabels = new Set(
      occasionAccessoryLabels[
        occasionKey
      ],
    );

    return replies.filter((reply) =>
      allowedLabels.has(reply.label),
    );
  }

  const category = normalizeValue(
    requirements.category,
  );

  if (
    category === "shirt" ||
    category.includes("mens shirts")
  ) {
    const replies = [
      option(
        "Formal Shirts",
        "I prefer Formal Shirts",
      ),
      option(
        "Ceremonial Shirts",
        "I prefer Ceremonial Shirts",
      ),
    ];

    const occasion = normalizeValue(
      requirements.occasion,
    );

    /*
     * Office / Business has one clear shirt
     * destination, so resolve it silently.
     * Wedding / Ceremony and Just Exploring
     * keep both website-backed shirt choices.
     */
    if (
      occasion.includes("office") ||
      occasion.includes("business")
    ) {
      return [replies[0]];
    }

    return replies;
  }

  if (
    category === "suit" ||
    category.includes("suits")
  ) {
    const replies = [
      option(
        "Formal Wear",
        "I prefer Formal Wear",
      ),
      option(
        "Semi-Formal Wear",
        "I prefer Semi-Formal Wear",
      ),
      option(
        "Complete Attire",
        "I prefer Complete Attire",
      ),
      option(
        "Tuxedos",
        "I prefer Tuxedos",
      ),
    ];

    return replies;
  }

  return [];
}

const defaultPriceBands = [
  {
    label: "Under ₹10,000",
    value: "My budget is under ₹10,000",
  },
  {
    label: "₹10,000–₹20,000",
    value:
      "My budget is ₹10,000 to ₹20,000",
  },
  {
    label: "₹20,000–₹40,000",
    value:
      "My budget is ₹20,000 to ₹40,000",
  },
  {
    label: "₹40,000–₹55,000",
    value:
      "My budget is ₹40,000 to ₹55,000",
  },
];

function formatPrice(
  price: number,
): string {
  return `₹${price.toLocaleString(
    "en-IN",
  )}`;
}

function createCataloguePriceReply(
  minimumPrice: number,
  maximumPrice: number,
  isFirstRange = false,
): QuickReply {
  const minimumLabel =
    formatPrice(minimumPrice);

  const maximumLabel =
    formatPrice(maximumPrice);

  const label = isFirstRange
    ? `Under ${maximumLabel}`
    : minimumPrice === maximumPrice
      ? minimumLabel
      : `${minimumLabel}–${maximumLabel}`;

  return option(
    label,
    isFirstRange
      ? `My budget is under ${maximumLabel}`
      : `My budget is ${minimumLabel} to ${maximumLabel}`,
  );
}

function getStandardPriceStep(
  maximumPrice: number,
): number {
  if (maximumPrice <= 5_000) {
    return 500;
  }

  if (maximumPrice <= 20_000) {
    return 5_000;
  }

  return 10_000;
}

function getCataloguePriceReplies(
  pricePoints: Array<{
    price: number;
    mrp: number;
  }>,
): QuickReply[] {
  const uniquePrices = [
    ...new Set(
      pricePoints.map(
        (pricePoint) =>
          pricePoint.price,
      ),
    ),
  ].sort(
    (firstPrice, secondPrice) =>
      firstPrice - secondPrice,
  );

  if (uniquePrices.length === 0) {
    return [];
  }

  /*
   * A budget question has no filtering value
   * when every available product has the same
   * selling price. Returning no bands lets the
   * single-option resolver skip this step.
   */
  if (uniquePrices.length === 1) {
    return [];
  }

  const actualMaximumPrice =
    uniquePrices[uniquePrices.length - 1];

  const priceStep =
    getStandardPriceStep(
      actualMaximumPrice,
    );

  const firstMaximum =
    (Math.floor(
      uniquePrices[0] / priceStep,
    ) + 1) * priceStep;

  const availableMaximums = [
    ...new Set(
      uniquePrices.map((price) =>
        Math.min(
          price <= firstMaximum
            ? firstMaximum
            : Math.ceil(
                price / priceStep,
              ) * priceStep,
          actualMaximumPrice,
        ),
      ),
    ),
  ].sort(
    (
      firstMaximumPrice,
      secondMaximumPrice,
    ) =>
      firstMaximumPrice -
      secondMaximumPrice,
  );

  if (availableMaximums.length === 1) {
    return [];
  }

  const groupCount = Math.min(
    3,
    availableMaximums.length,
  );
  const displayedMaximums: number[] = [];

  for (
    let groupIndex = 0;
    groupIndex < groupCount;
    groupIndex += 1
  ) {
    const endIndex =
      Math.floor(
        ((groupIndex + 1) *
          availableMaximums.length) /
          groupCount,
      ) - 1;

    displayedMaximums.push(
      availableMaximums[endIndex],
    );
  }

  const replies: QuickReply[] = [];
  let previousMaximum = 0;

  displayedMaximums.forEach(
    (maximumPrice, groupIndex) => {
      replies.push(
        createCataloguePriceReply(
          groupIndex === 0
            ? 0
            : previousMaximum,
          maximumPrice,
          groupIndex === 0,
        ),
      );

      previousMaximum = maximumPrice;
    },
  );

  return replies;
}

function getAllPriceRangesReply():
  QuickReply {
  return option(
    "All Price Ranges",
    "Show me products from all price ranges",
  );
}

function getDefaultBudgetReplies():
  QuickReply[] {
  return [
    ...defaultPriceBands.map((band) =>
      option(band.label, band.value),
    ),
    getAllPriceRangesReply(),
  ];
}

function getBudgetReplies(
  requirements: CustomerRequirements,
): QuickReply[] {
  const department =
    getDepartment(requirements);

  if (
    department !== "men" &&
    department !== "women"
  ) {
    return getDefaultBudgetReplies();
  }

  const pricePoints =
    getAvailableProductPricePoints(
      requirements,
    );

  const cataloguePriceReplies =
    getCataloguePriceReplies(
      pricePoints,
    );

  if (
    cataloguePriceReplies.length === 0
  ) {
    /*
     * Keep the manager-approved price step visible even when
     * the current catalogue collapses to a single price band.
     * The single-option resolver would otherwise auto-select
     * "All Price Ranges" and make the question disappear.
     */
    if (pricePoints.length === 0) {
      return getDefaultBudgetReplies();
    }

    const minimumPrice = Math.min(
      ...pricePoints.map(
        (pricePoint) => pricePoint.price,
      ),
    );

    const maximumPrice = Math.max(
      ...pricePoints.map(
        (pricePoint) => pricePoint.price,
      ),
    );

    const priceStep =
      getStandardPriceStep(maximumPrice);

    const roundedMinimum = Math.max(
      0,
      Math.floor(
        Math.max(0, minimumPrice - 1) /
          priceStep,
      ) * priceStep,
    );

    // Never advertise a budget ceiling above the
    // highest selling price that actually exists for
    // the current candidate products. For example, a
    // ₹55k product must not create a ₹60k range.
    const roundedMaximum = maximumPrice;

    const availableRangeReply =
      createCataloguePriceReply(
        roundedMinimum,
        roundedMaximum,
        false,
      );

    return [
      {
        ...availableRangeReply,
        label: `Available ${availableRangeReply.label}`,
      },
    ];
  }

  return [
    ...cataloguePriceReplies,
    getAllPriceRangesReply(),
  ];
}

const commonQuickReplies: Partial<
  Record<RequirementField, QuickReply[]>
> = {
  department: [
    option(
      "Shop Men",
      "I am shopping for men",
    ),
    option(
      "Shop Women",
      "I am shopping for women",
    ),
    option(
      "Shop Accessories",
      "I am shopping for accessories",
    ),
  ],

  gender: [
    option(
      "Men",
      "The recipient is a man",
    ),
    option(
      "Women",
      "The recipient is a woman",
    ),
    option(
      "Someone Else",
      "The recipient is someone else",
    ),
  ],

  ageGroup: [
    option(
      "Under 18",
      "The age group is under 18",
    ),
    option(
      "18–25",
      "The age group is 18 to 25",
    ),
    option(
      "26–35",
      "The age group is 26 to 35",
    ),
    option(
      "36–50",
      "The age group is 36 to 50",
    ),
    option(
      "Above 50",
      "The age group is above 50",
    ),
  ],

occasion: [
  option(
    "Office / Business",
    "I need it for office or business wear",
  ),
  option(
    "Wedding / Ceremony",
    "I need it for a wedding or ceremony",
  ),
  option(
    "Just Exploring",
    "I am just exploring options",
  ),
],

  weddingFunction: [
    option(
      "Haldi",
      "The event is Wedding - Haldi",
    ),
    option(
      "Pool Party",
      "The event is Wedding - Pool Party",
    ),
    option(
      "Mehendi",
      "The event is Wedding - Mehendi",
    ),
    option(
      "Sundowner",
      "The event is Wedding - Sundowner",
    ),
    option(
      "Cocktail",
      "The event is Wedding - Cocktail",
    ),
    option(
      "Reception",
      "The event is Wedding - Reception",
    ),
  ],

  customerRole: [
    option(
      "Groom",
      "I am the groom",
    ),
    option(
      "Groomsman",
      "I am a groomsman",
    ),
    option(
      "Family Member",
      "I am a family member",
    ),
    option(
      "Wedding Guest",
      "I am a wedding guest",
    ),
  ],

  eventDate: [
    option(
      "This Week",
      "The event is this week",
    ),
    option(
      "Next Week",
      "The event is next week",
    ),
    option(
      "This Month",
      "The event is this month",
    ),
    option(
      "Next Month",
      "The event is next month",
    ),
    option(
      "Not Decided",
      "The event date is not decided",
    ),
  ],

  venue: [
    option(
      "Indoor",
      "The event will be indoors",
    ),
    option(
      "Outdoor",
      "The event will be outdoors",
    ),
    option(
      "Destination Venue",
      "It is a destination event",
    ),
    option(
      "Not Decided",
      "The venue is not decided",
    ),
  ],

  eventTime: [
    option(
      "Day",
      "It is a daytime event",
    ),
    option(
      "Evening",
      "It is an evening event",
    ),
    option(
      "Not Decided",
      "The event time is not decided",
    ),
  ],

  budgetMin: getDefaultBudgetReplies(),

  budgetMax: getDefaultBudgetReplies(),

  colour: [
    option(
      "Navy Blue",
      "I prefer navy blue",
    ),
    option(
      "Light Blue",
      "I prefer light blue",
    ),
    option(
      "Blue",
      "I prefer blue",
    ),
    option(
      "Black",
      "I prefer black",
    ),
    option(
      "Charcoal Grey",
      "I prefer charcoal grey",
    ),
    option(
      "Grey",
      "I prefer grey",
    ),
    option(
      "Beige",
      "I prefer beige",
    ),
    option(
      "Cream",
      "I prefer cream",
    ),
    option(
      "White",
      "I prefer white",
    ),
    option(
      "Burgundy",
      "I prefer burgundy",
    ),
    option(
      "Brown",
      "I prefer brown",
    ),
    option(
      "Green",
      "I prefer green",
    ),
    option(
      "Red",
      "I prefer red",
    ),
    option(
      "Pink",
      "I prefer pink",
    ),
    option(
      "Yellow",
      "I prefer yellow",
    ),
    option(
      "Recommend One",
      "Please recommend a colour",
    ),
  ],

  fabric: [
    option(
      "Cotton",
      "I prefer cotton",
    ),
    option(
      "Linen",
      "I prefer linen",
    ),
    option(
      "Wool",
      "I prefer wool",
    ),
    option(
      "Silk",
      "I prefer silk",
    ),
    option(
      "Bamboo",
      "I prefer bamboo",
    ),
    option(
      "Blend",
      "I prefer a blended fabric",
    ),
    option(
      "Use My Own Fabric",
      "I want to use my own fabric",
    ),
    option(
      "Recommend One",
      "Please recommend a fabric",
    ),
  ],

  fit: [
    option(
      "Regular Fit",
      "I prefer Regular Fit",
    ),
    option(
      "Slim Fit",
      "I prefer Slim Fit",
    ),
    option(
      "Loose Fit",
      "I prefer Loose Fit",
    ),
    option(
      "Recommend One",
      "Please recommend a fitting",
    ),
  ],

  stylePreference: [
    option(
      "Classic",
      "I prefer a classic style",
    ),
    option(
      "Modern",
      "I prefer a modern style",
    ),
    option(
      "Minimal",
      "I prefer a minimal style",
    ),
    option(
      "Traditional",
      "I prefer a traditional style",
    ),
    option(
      "Luxury",
      "I prefer a luxury style",
    ),
    option(
      "Recommend One",
      "Please recommend a style",
    ),
  ],

  quantity: [
    option(
      "10",
      "We require 10 outfits",
    ),
    option(
      "25",
      "We require 25 outfits",
    ),
    option(
      "50",
      "We require 50 outfits",
    ),
    option(
      "100",
      "We require 100 outfits",
    ),
    option(
      "More Than 100",
      "We require more than 100 outfits",
    ),
  ],

  industry: [
    option(
      "Hospital",
      "Our industry is healthcare",
    ),
    option(
      "Hotel",
      "Our industry is hospitality",
    ),
    option(
      "Restaurant",
      "Our industry is restaurant services",
    ),
    option(
      "Bank",
      "Our industry is banking",
    ),
    option(
      "IT Company",
      "Our industry is information technology",
    ),
    option(
      "Security Agency",
      "Our industry is security services",
    ),
    option(
      "Manufacturing",
      "Our industry is manufacturing",
    ),
    option(
      "Other",
      "Our industry is another sector",
    ),
  ],

  employeeCount: [
    option(
      "Up to 25",
      "Approximately 25 employees need uniforms",
    ),
    option(
      "Around 50",
      "Approximately 50 employees need uniforms",
    ),
    option(
      "Around 100",
      "Approximately 100 employees need uniforms",
    ),
    option(
      "Around 250",
      "Approximately 250 employees need uniforms",
    ),
    option(
      "More Than 500",
      "More than 500 employees need uniforms",
    ),
  ],

  branding: [
    option(
      "Logo Embroidery",
      "We require logo embroidery",
    ),
    option(
      "Logo Printing",
      "We require logo printing",
    ),
    option(
      "Name Embroidery",
      "We require name embroidery",
    ),
    option(
      "No Branding",
      "We do not require branding",
    ),
  ],

  customizationPreference: [
    option(
      "Customize Design",
      "I want to customize this design",
    ),
    option(
      "Keep Current Design",
      "I want to keep the current design",
    ),
  ],

  lapelStyle: [
    option(
      "Notch Lapel",
      "I prefer a Notch Lapel",
    ),
    option(
      "Peak Lapel",
      "I prefer a Peak Lapel",
    ),
    option(
      "Shawl Lapel",
      "I prefer a Shawl Lapel",
    ),
    option(
      "Recommend One",
      "Please recommend a lapel style",
    ),
  ],

  buttonStyle: [
    option(
      "One Button",
      "I prefer a One Button style",
    ),
    option(
      "Two Button",
      "I prefer a Two Button style",
    ),
    option(
      "Three Button",
      "I prefer a Three Button style",
    ),
    option(
      "Double-Breasted",
      "I prefer a Double-Breasted style",
    ),
    option(
      "Recommend One",
      "Please recommend a button style",
    ),
  ],

  pocketStyle: [
    option(
      "Flap Pockets",
      "I prefer Flap Pockets",
    ),
    option(
      "Jetted Pockets",
      "I prefer Jetted Pockets",
    ),
    option(
      "Patch Pockets",
      "I prefer Patch Pockets",
    ),
    option(
      "Ticket Pocket",
      "I prefer a Ticket Pocket",
    ),
    option(
      "Recommend One",
      "Please recommend a pocket style",
    ),
  ],

  liningPreference: [
    option(
      "Classic",
      "I prefer a Classic lining",
    ),
    option(
      "Contrast",
      "I prefer a Contrast lining",
    ),
    option(
      "Printed",
      "I prefer a Printed lining",
    ),
    option(
      "Unlined",
      "I prefer an Unlined garment",
    ),
    option(
      "Recommend One",
      "Please recommend a lining",
    ),
  ],


  measurementMethod: [
  option(
    "Ready Size",
    "I want to select a Ready Size",
  ),
  option(
    "Custom Measurements",
    "I want to provide Custom Measurements",
  ),
  option(
    "Automated Measurements",
    "I want to use Automated Measurements",
  ),
  option(
    "Schedule Technician",
    "I want to Schedule a Technician",
  ),
],technicianCity: [
  option(
    "Bangalore",
    "Schedule the technician in Bangalore",
  ),
  option(
    "Gurgaon",
    "Schedule the technician in Gurgaon",
  ),
  option(
    "Mumbai",
    "Schedule the technician in Mumbai",
  ),
],



    heightProfile: [
    option(
      "Short",
      "My height profile is Short below 168 cm",
    ),
    option(
      "Regular",
      "My height profile is Regular between 168 and 186 cm",
    ),
    option(
      "Tall",
      "My height profile is Tall above 186 cm",
    ),
  ],

  readySize: [
    option(
      "S",
      "My ready size is S",
    ),
    option(
      "M",
      "My ready size is M",
    ),
    option(
      "L",
      "My ready size is L",
    ),
    option(
      "XL",
      "My ready size is XL",
    ),
    option(
      "2XL",
      "My ready size is 2XL",
    ),
    option(
      "Not Sure",
      "I am not sure about my ready size",
    ),
  ],

  country: [
    option(
      "India",
      "The delivery country is India",
    ),
    option(
      "United Kingdom",
      "The delivery country is the United Kingdom",
    ),
    option(
      "United States",
      "The delivery country is the United States",
    ),
    option(
      "Europe",
      "The delivery destination is in Europe",
    ),
    option(
      "Other",
      "The delivery country is another country",
    ),
  ],
};

export function getQuickReplies(
  expectedField: RequirementField | null,
  workflow: WorkflowType,
  requirements: CustomerRequirements,
): QuickReply[] {
  if (!expectedField) {
    return [];
  }

  if (
    expectedField === "department" &&
    normalizeValue(requirements.category)
      .includes("suit")
  ) {
    return [
      option(
        "Shop Men",
        "I am shopping for Mens Suits",
      ),
      option(
        "Shop Women",
        "I am shopping for Women Suits",
      ),
    ];
  }

  if (
    expectedField === "department" &&
    [
      "custom_design",
    ].includes(workflow)
  ) {
    return (
      commonQuickReplies.department ?? []
    ).filter(
      (reply) =>
        reply.label !== "Shop Accessories",
    );
  }

  if (expectedField === "category") {
    return getCategoryReplies(
      workflow,
      requirements,
    );
  }

  if (expectedField === "subcategory") {
    return getSubcategoryReplies(
      workflow,
      requirements,
    );
  }

if (expectedField === "occasion") {
  return commonQuickReplies.occasion ?? [];
}

  if (expectedField === "weddingFunction") {
    return (
      commonQuickReplies.weddingFunction ??
      []
    );
  }

  if (
    expectedField === "budgetMin" ||
    expectedField === "budgetMax"
  ) {
    return getBudgetReplies(
      requirements,
    );
  }

  if (expectedField === "measurementMethod") {
    const selectedProduct =
      requirements.selectedProductId !==
      null
        ? getCatalogProductById(
            requirements.selectedProductId,
          )
        : null;

    if (!selectedProduct) {
      return [];
    }

    return (
      commonQuickReplies.measurementMethod ??
      []
    ).filter((reply) => {
      if (reply.label === "Ready Size") {
        return selectedProduct.supportsReadyMade;
      }

      if (
        reply.label ===
          "Custom Measurements" ||
        reply.label ===
          "Automated Measurements"
      ) {
        return selectedProduct
          .supportsCustomMeasurements;
      }

      if (
        reply.label === "Schedule Technician"
      ) {
        return selectedProduct
          .supportsTechnicianVisit;
      }

      return false;
    });
  }

  if (expectedField === "colour") {
    const colourReplies =
      commonQuickReplies.colour ?? [];

    const selectableColours =
      colourReplies.filter(
        (reply) =>
          reply.label !== "Recommend One",
      );

    const availableColours = new Set(
      getAvailableProductColours(
        requirements,
        selectableColours.map(
          (reply) => reply.label,
        ),
      ),
    );

    return colourReplies.filter(
      (reply) =>
        reply.label === "Recommend One" ||
        availableColours.has(reply.label),
    );
  }

  if (
    expectedField === "customerRole" &&
    workflow === "bridegroom_party"
  ) {
    return [
      option(
        "Best Man",
        "I am the best man",
      ),
      option(
        "Groomsman",
        "I am a groomsman",
      ),
      option(
        "Family Member",
        "I am a family member",
      ),
      option(
        "Wedding Guest",
        "I am a wedding guest",
      ),
    ];
  }

  return (
    commonQuickReplies[expectedField] ??
    []
  );
}
