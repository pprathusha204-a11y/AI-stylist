import {
  readFileSync,
} from "node:fs";

import {
  join,
} from "node:path";

import {
  z,
} from "zod";

const rawFabricSchema = z.object({
  id: z.number().int().positive(),

  name: z.string().min(1),
  sku: z.string().default(""),

  image: z.string().min(1),
  image_1: z.string().nullable(),
  image_2: z.string().nullable(),
  image_3: z.string().nullable(),

  image_1_info: z.string().nullable(),
  image_2_info: z.string().nullable(),
  image_3_info: z.string().nullable(),

  mrp_inr: z.number().nonnegative(),
  sell_price_inr: z.number().nonnegative(),

  desc: z.string().default(""),
  style_detail: z.string().default(""),

  colours: z.string().optional(),
  colors: z.string().default("[]"),

  category_id: z.string().default("[]"),
  sub_category_id: z.string().default("[]"),
  sub_sub_category_id: z.string().default("[]"),

  status: z.string(),
});

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

let cachedFabrics:
  | CatalogFabric[]
  | null = null;

const blockedFabricPattern =
  /\b(test|dummy|demo|sample|trial)\b/i;

function parseIdList(
  value: string,
): number[] {
  try {
    const parsedValue =
      JSON.parse(value);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .map((item) => Number(item))
      .filter(
        (item) =>
          Number.isInteger(item) &&
          item > 0,
      );
  } catch {
    return [];
  }
}

function createAssetUrl(
  assetPath: string | null,
): string | null {
  if (!assetPath) {
    return null;
  }

  if (
    assetPath.startsWith("http://") ||
    assetPath.startsWith("https://")
  ) {
    return assetPath;
  }

  const cleanedPath =
    assetPath.replace(/^\/+/, "");

  return new URL(
    cleanedPath,
    "https://tech-tailor.com/",
  ).toString();
}

function removeHtml(
  value: string,
): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function getCatalogFabrics():
  CatalogFabric[] {
  if (cachedFabrics) {
    return cachedFabrics;
  }

  const fabricFilePath = join(
    process.cwd(),
    "src",
    "data",
    "live-fabrics.json",
  );

  const fileContents =
    readFileSync(
      fabricFilePath,
      "utf8",
    );

  const parsedJson =
    JSON.parse(fileContents);

  const rawFabrics =
    z.array(rawFabricSchema).parse(
      parsedJson,
    );

  const fabrics = rawFabrics
    .filter(
      (fabric) =>
        fabric.status
          .toLowerCase()
          .trim() === "active",
    )
    .filter(
      (fabric) =>
        !blockedFabricPattern.test(
          `${fabric.name} ${fabric.sku}`,
        ),
    )
    .map((fabric): CatalogFabric => {
      const imagePaths = [
        fabric.image,
        fabric.image_1,
        fabric.image_2,
        fabric.image_3,
      ];

      const galleryImageUrls = [
        ...new Set(
          imagePaths
            .map(createAssetUrl)
            .filter(
              (
                imageUrl,
              ): imageUrl is string =>
                Boolean(imageUrl),
            ),
        ),
      ];

      const description =
        removeHtml(
          `${fabric.desc} ${fabric.style_detail}`,
        );

      return {
        id: fabric.id,
        name: fabric.name.trim(),
        sku: fabric.sku.trim(),

        imageUrl:
          galleryImageUrls[0] ?? "",

        galleryImageUrls,

        price:
          fabric.sell_price_inr > 0
            ? fabric.sell_price_inr
            : null,

        mrp:
          fabric.mrp_inr > 0
            ? fabric.mrp_inr
            : null,

        colourIds:
          parseIdList(
            fabric.colors ??
              fabric.colours ??
              "[]",
          ),

        categoryIds:
          parseIdList(
            fabric.category_id,
          ),

        subcategoryIds:
          parseIdList(
            fabric.sub_category_id,
          ),

        subSubcategoryIds:
          parseIdList(
            fabric.sub_sub_category_id,
          ),

        description,

        searchText: [
          fabric.name,
          fabric.sku,
          description,
        ]
          .join(" ")
          .toLowerCase(),

        fabricUrl:
          `https://tech-tailor.com/shop/fabric/${fabric.id}`,

        active: true,
      };
    })
    .filter(
      (fabric) =>
        Boolean(fabric.imageUrl),
    )
    .sort(
      (first, second) =>
        first.name.localeCompare(
          second.name,
        ),
    );

  cachedFabrics = fabrics;

  return fabrics;
}

export function getCatalogFabricById(
  fabricId: number,
): CatalogFabric | undefined {
  return getCatalogFabrics().find(
    (fabric) =>
      fabric.id === fabricId,
  );
}

export function clearFabricCatalogCache():
  void {
  cachedFabrics = null;
}