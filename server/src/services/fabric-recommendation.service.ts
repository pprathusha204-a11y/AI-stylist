import {
  getCatalogFabrics,
  type CatalogFabric,
} from "./fabric-catalog.service";

import type {
  CustomerRequirements,
} from "./session.service";

export type FabricRecommendation = {
  fabric: CatalogFabric;
  matchPercentage: number;
  reasons: string[];
  selectValue: string;
};

const placeholderPattern =
  /choose other fabric|default fabric|^accessories$|^trouser fabric$|^bandhgala fabric$/i;

const ceremonialFabricPattern =
  /bandhgala|achkan|sherwani|kurta/i;

const ceremonialRequestPattern =
  /indian ceremonial|ceremonial|bandhgala|achkan|sherwani|kurta/i;

const garmentSubcategoryIds:
  Record<string, number[]> = {
  suit: [1],
  jacket: [1],
  blazer: [1],
  tuxedo: [1],

  trousers: [16, 20],
  trouser: [16, 20],

  shirt: [17, 21, 22],

  overcoat: [18],

  sherwani: [19],
  kurta: [19],
  bandhgala: [19],
  achkan: [19],
  ceremonial: [19],

  "t-shirt": [23],
  tshirt: [23],
};

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

function isCeremonialRequest(
  requirements: CustomerRequirements,
): boolean {
  const shoppingText = [
    requirements.category,
    requirements.subcategory,
    requirements.occasion,
    requirements.weddingFunction,
  ]
    .filter(
      (value): value is string =>
        value !== null,
    )
    .join(" ");

  return ceremonialRequestPattern.test(
    shoppingText,
  );
}

function isCeremonialFabric(
  fabric: CatalogFabric,
): boolean {
  return ceremonialFabricPattern.test(
    `${fabric.name} ${fabric.sku} ${fabric.searchText}`,
  );
}

function getDepartmentId(
  requirements: CustomerRequirements,
): number | null {
  const departmentText =
    normalizeValue(
      `${requirements.department ?? ""} ${
        requirements.gender ?? ""
      }`,
    );

  if (
    departmentText.includes("men") &&
    !departmentText.includes("women")
  ) {
    return 1;
  }

  if (departmentText.includes("women")) {
    return 2;
  }

  if (
    departmentText.includes("accessor")
  ) {
    return 4;
  }

  return null;
}

function getRequestedSubcategoryIds(
  requirements: CustomerRequirements,
): number[] {
  const shoppingText =
    normalizeValue(
      `${requirements.category ?? ""} ${
        requirements.subcategory ?? ""
      }`,
    );

  const matchedIds = new Set<number>();

  for (
    const [keyword, ids] of
    Object.entries(
      garmentSubcategoryIds,
    )
  ) {
    if (
      shoppingText.includes(keyword)
    ) {
      ids.forEach((id) =>
        matchedIds.add(id),
      );
    }
  }

  return [...matchedIds];
}

function getColourTerms(
  colour: string,
): string[] {
  const normalizedColour =
    normalizeValue(colour);

  const aliases:
    Record<string, string[]> = {
    "navy blue": [
      "navy",
      "midnight blue",
      "dark blue",
    ],

    "charcoal grey": [
      "charcoal",
      "dark grey",
      "slate",
    ],

    beige: [
      "beige",
      "fawn",
      "sand",
      "ecru",
      "tan",
    ],

    white: [
      "white",
      "pearl",
      "ivory",
      "cream",
      "eggshell",
    ],

    blue: [
      "blue",
      "navy",
      "cobalt",
      "azure",
    ],

    black: [
      "black",
      "jet black",
    ],

    burgundy: [
      "burgundy",
      "wine",
      "maroon",
    ],
  };

  return aliases[normalizedColour] ?? [
    normalizedColour,
  ];
}

function intersects(
  firstValues: number[],
  secondValues: number[],
): boolean {
  return firstValues.some((value) =>
    secondValues.includes(value),
  );
}

function evaluateFabric(
  fabric: CatalogFabric,
  requirements: CustomerRequirements,
): FabricRecommendation & {
  rankingScore: number;
} {
  let earnedScore = 0;
  let possibleScore = 0;

  const reasons: string[] = [];

  const departmentId =
    getDepartmentId(requirements);

  if (departmentId) {
    possibleScore += 20;

    if (
      fabric.categoryIds.includes(
        departmentId,
      )
    ) {
      earnedScore += 20;
      reasons.push(
        departmentId === 1
          ? "Suitable for the Men collection"
          : departmentId === 2
            ? "Suitable for the Women collection"
            : "Suitable for accessories",
      );
    }
  }

  const requestedSubcategoryIds =
    getRequestedSubcategoryIds(
      requirements,
    );

  if (
    requestedSubcategoryIds.length > 0
  ) {
    possibleScore += 35;

    if (
      intersects(
        fabric.subcategoryIds,
        requestedSubcategoryIds,
      )
    ) {
      earnedScore += 35;
      reasons.push(
        "Suitable for your selected garment",
      );
    }
  }

  if (requirements.fabric) {
    possibleScore += 25;

    if (
      normalizeValue(fabric.name) ===
      normalizeValue(
        requirements.fabric,
      )
    ) {
      earnedScore += 25;
      reasons.push(
        "Exact selected fabric",
      );
    } else if (
      containsPhrase(
        fabric.searchText,
        requirements.fabric,
      )
    ) {
      earnedScore += 25;
      reasons.push(
        `Matches your ${requirements.fabric} preference`,
      );
    }
  }

  if (requirements.colour) {
    possibleScore += 20;

    const colourMatched =
      getColourTerms(
        requirements.colour,
      ).some((colourTerm) =>
        containsPhrase(
          fabric.searchText,
          colourTerm,
        ),
      );

    if (colourMatched) {
      earnedScore += 20;
      reasons.push(
        `Matches your ${requirements.colour} colour preference`,
      );
    }
  }

  const matchPercentage =
    possibleScore > 0
      ? Math.round(
          (earnedScore /
            possibleScore) *
            100,
        )
      : 0;

  let qualityBonus = 0;

  if (fabric.price !== null) {
    qualityBonus += 4;
  }

  if (
    fabric.description.length > 40
  ) {
    qualityBonus += 3;
  }

  if (
    fabric.galleryImageUrls.length > 1
  ) {
    qualityBonus += 2;
  }

  return {
    fabric,
    matchPercentage,

    reasons:
      reasons.length > 0
        ? reasons
        : [
            "Selected from the Tech-Tailor fabric catalogue",
          ],

    selectValue:
      `I select fabric ID ${fabric.id}: ${fabric.name}`,

    rankingScore:
      matchPercentage + qualityBonus,
  };
}

export function recommendFabrics(
  requirements: CustomerRequirements,
  limit = 6,
): FabricRecommendation[] {
  const departmentId =
    getDepartmentId(requirements);

  const requestedSubcategoryIds =
    getRequestedSubcategoryIds(
      requirements,
    );

  const ceremonialRequest =
    isCeremonialRequest(requirements);

  let candidates =
    getCatalogFabrics().filter(
      (fabric) =>
        !placeholderPattern.test(
          fabric.name,
        ),
    );

  if (ceremonialRequest) {
    const ceremonialFabrics =
      candidates.filter(
        isCeremonialFabric,
      );

    if (ceremonialFabrics.length > 0) {
      candidates = ceremonialFabrics;
    }
  } else {
    candidates = candidates.filter(
      (fabric) =>
        !isCeremonialFabric(fabric),
    );
  }

  if (departmentId) {
    const departmentFabrics =
      candidates.filter((fabric) =>
        fabric.categoryIds.includes(
          departmentId,
        ),
      );

    if (
      departmentFabrics.length > 0
    ) {
      candidates =
        departmentFabrics;
    }
  }

  if (
    requestedSubcategoryIds.length > 0
  ) {
    const garmentFabrics =
      candidates.filter((fabric) =>
        intersects(
          fabric.subcategoryIds,
          requestedSubcategoryIds,
        ),
      );

    if (
      garmentFabrics.length > 0
    ) {
      candidates = garmentFabrics;
    }
  }

  /*
 * Do not show known fabric prices
 * above the customer's maximum budget.
 * Fabrics without a fixed price remain
 * available because their final price
 * depends on the selected garment.
 */
if (
  requirements.budgetMax !== null
) {
  candidates = candidates.filter(
    (fabric) =>
      fabric.price === null ||
      fabric.price <=
        requirements.budgetMax!,
  );
}
  return candidates
    .map((fabric) =>
      evaluateFabric(
        fabric,
        requirements,
      ),
    )
    .sort(
      (first, second) =>
        second.rankingScore -
          first.rankingScore ||
        (first.fabric.price ??
          Number.MAX_SAFE_INTEGER) -
          (second.fabric.price ??
            Number.MAX_SAFE_INTEGER),
    )
    .slice(0, limit)
    .map(
      (recommendation): FabricRecommendation => ({
        fabric:
          recommendation.fabric,

        matchPercentage:
          recommendation.matchPercentage,

        reasons:
          recommendation.reasons,

        selectValue:
          recommendation.selectValue,
      }),
    );
}