import {
  readFileSync,
} from "node:fs";

import {
  resolve,
} from "node:path";

import {
  URL,
} from "node:url";

import {
  z,
} from "zod";

const rawProductSchema = z.object({
  id: z.number().int().positive(),

  name: z.string().min(1),
  sku: z.string(),
  short_description: z.string(),

  mrp_inr: z.number().nonnegative(),
  sell_price_inr: z.number().nonnegative(),

  thumbnail: z.string(),
  image_1: z.string().nullable(),
  image_2: z.string().nullable(),
  image_3: z.string().nullable(),

  image_1_info: z.string().nullable(),
  image_2_info: z.string().nullable(),
  image_3_info: z.string().nullable(),

  description: z.string(),
  style_detail: z.string(),
  package_detail: z.string(),

  customizations: z.string(),
  default_fabric: z.number().int(),

  type: z.string(),
  status: z.string(),

  category_id: z.number().int(),
  sub_category_id: z.number().int(),
  sub_sub_category_id: z.number().int(),

  show_fabric: z.number().int(),
  show_customizations: z.number().int(),
  show_size_chart: z.number().int(),
  show_choose_height: z.number().int(),
  show_ready_made: z.number().int(),
  show_custom_measurements: z.number().int(),
  show_schedule_technician: z.number().int(),

  category_name: z.string(),
  sub_category_name: z.string(),
  sub_sub_category_name: z.string(),

  fabric_name: z.string(),
  fabric_colors: z.string(),
});

const rawCatalogueSchema = z.array(
  rawProductSchema,
);

export type CatalogProduct = {
  id: number;
  name: string;
  sku: string;
  shortDescription: string;

  price: number;
  mrp: number;

  imageUrl: string;
  galleryImageUrls: string[];
  productUrl: string;

  categoryId: number;
  subcategoryId: number;
  subSubcategoryId: number;

  category: string;
  subcategory: string;
  subSubcategory: string;

  defaultFabricId: number;
  fabric: string;
  fabricColourIds: number[];

  customizationIds: number[];

  canChangeFabric: boolean;
  canCustomizeStyle: boolean;
  supportsSizeChart: boolean;
  supportsHeightSelection: boolean;
  supportsReadyMade: boolean;
  supportsCustomMeasurements: boolean;
  supportsTechnicianVisit: boolean;

  imageColourText: string;
  searchText: string;
  inStock: boolean;
};

const blockedProductPattern =
  /\b(test|dummy|demo|sample|trial)\b/i;

let cachedProducts:
  | CatalogProduct[]
  | null = null;

function parseIdList(
  value: string,
): number[] {
  try {
    const parsedValue: unknown =
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

function removeHtml(
  value: string,
): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function createAssetUrl(
  assetPath: string | null,
): string | null {
  if (!assetPath?.trim()) {
    return null;
  }

  if (
    assetPath.startsWith("http://") ||
    assetPath.startsWith("https://")
  ) {
    return assetPath;
  }

  return new URL(
    assetPath.replace(/^\/+/, ""),
    "https://tech-tailor.com/",
  ).toString();
}

function isTechTailorUrl(
  value: string,
): boolean {
  try {
    const hostname =
      new URL(value).hostname;

    return (
      hostname === "tech-tailor.com" ||
      hostname.endsWith(
        ".tech-tailor.com",
      )
    );
  } catch {
    return false;
  }
}

function toBoolean(
  value: number,
): boolean {
  return value === 1;
}

function isApprovedProduct(
  product: CatalogProduct,
): boolean {
  const searchableName =
    `${product.name} ${product.sku}`;

  if (
    blockedProductPattern.test(
      searchableName,
    )
  ) {
    return false;
  }

  if (product.price < 100) {
    return false;
  }

  if (!product.inStock) {
    return false;
  }

  if (
    !isTechTailorUrl(
      product.productUrl,
    ) ||
    !isTechTailorUrl(
      product.imageUrl,
    )
  ) {
    return false;
  }

  return true;
}

function loadCatalogue():
  CatalogProduct[] {
  const cataloguePath = resolve(
    process.cwd(),
    "src",
    "data",
    "live-products-tailoring.json",
  );

  const fileContents = readFileSync(
    cataloguePath,
    "utf8",
  );

  const parsedData: unknown =
    JSON.parse(fileContents);

  const validationResult =
    rawCatalogueSchema.safeParse(
      parsedData,
    );

  if (!validationResult.success) {
    const firstIssue =
      validationResult.error.issues[0];

    throw new Error(
      `Invalid tailoring catalogue: ${
        firstIssue?.message ||
        "Unknown validation error"
      }`,
    );
  }

  const products =
    validationResult.data.map(
      (rawProduct): CatalogProduct => {
        const galleryImageUrls = [
          rawProduct.thumbnail,
          rawProduct.image_1,
          rawProduct.image_2,
          rawProduct.image_3,
        ]
          .map(createAssetUrl)
          .filter(
            (
              imageUrl,
            ): imageUrl is string =>
              Boolean(imageUrl),
          );

        const uniqueGalleryImages = [
          ...new Set(
            galleryImageUrls,
          ),
        ];

        const searchableText = [
          rawProduct.name,
          rawProduct.sku,
          rawProduct.short_description,
          rawProduct.description,
          rawProduct.style_detail,
          rawProduct.image_1_info ?? "",
          rawProduct.image_2_info ?? "",
          rawProduct.image_3_info ?? "",
          rawProduct.category_name,
          rawProduct.sub_category_name,
          rawProduct.sub_sub_category_name,
          rawProduct.fabric_name,
        ]
          .map(removeHtml)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        const imageColourText = [
          rawProduct.name,
          rawProduct.image_1_info ?? "",
          rawProduct.image_2_info ?? "",
          rawProduct.image_3_info ?? "",
        ]
          .map(removeHtml)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        return {
          id: rawProduct.id,
          name: rawProduct.name.trim(),
          sku: rawProduct.sku.trim(),

          shortDescription:
            removeHtml(
              rawProduct.short_description,
            ),

          price:
            rawProduct.sell_price_inr,

          mrp: rawProduct.mrp_inr,

          imageUrl:
            uniqueGalleryImages[0] ?? "",

          galleryImageUrls:
            uniqueGalleryImages,

          productUrl:
            `https://tech-tailor.com/shop/product/${rawProduct.id}`,

          categoryId:
            rawProduct.category_id,

          subcategoryId:
            rawProduct.sub_category_id,

          subSubcategoryId:
            rawProduct.sub_sub_category_id,

          category:
            rawProduct.category_name.trim(),

          subcategory:
            rawProduct.sub_category_name.trim(),

          subSubcategory:
            rawProduct.sub_sub_category_name.trim(),

          defaultFabricId:
            rawProduct.default_fabric,

          fabric:
            rawProduct.fabric_name.trim(),

          fabricColourIds:
            parseIdList(
              rawProduct.fabric_colors,
            ),

          customizationIds:
            parseIdList(
              rawProduct.customizations,
            ),

          canChangeFabric:
            toBoolean(
              rawProduct.show_fabric,
            ),

          canCustomizeStyle:
            toBoolean(
              rawProduct.show_customizations,
            ),

          supportsSizeChart:
            toBoolean(
              rawProduct.show_size_chart,
            ),

          supportsHeightSelection:
            toBoolean(
              rawProduct.show_choose_height,
            ),

          supportsReadyMade:
            toBoolean(
              rawProduct.show_ready_made,
            ),

          supportsCustomMeasurements:
            toBoolean(
              rawProduct.show_custom_measurements,
            ),

          supportsTechnicianVisit:
            toBoolean(
              rawProduct.show_schedule_technician,
            ),

          imageColourText,

          searchText:
            searchableText,

          inStock:
            rawProduct.status ===
            "published",
        };
      },
    );

  const approvedProducts =
    products.filter(
      isApprovedProduct,
    );

  if (approvedProducts.length === 0) {
    throw new Error(
      "No approved products are available in the tailoring catalogue",
    );
  }

  return approvedProducts;
}

export function getCatalogProducts():
  CatalogProduct[] {
  if (!cachedProducts) {
    cachedProducts =
      loadCatalogue();
  }

  return cachedProducts;
}

export function getCatalogProductById(
  productId: number,
): CatalogProduct | null {
  return (
    getCatalogProducts().find(
      (product) =>
        product.id === productId,
    ) || null
  );
}

export function clearCatalogCache():
  void {
  cachedProducts = null;
}