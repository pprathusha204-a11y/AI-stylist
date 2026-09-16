import {
  writeFileSync,
} from "node:fs";

import {
  resolve,
} from "node:path";

const BASE_URL =
  "https://tech-tailor.com";

const PAGE_SIZE = 100;
const IMAGE_CONCURRENCY = 12;
const REQUEST_TIMEOUT_MS = 12_000;

const CATALOG_FILTER_COOKIE = [
  "shopFilterOrderBy=name",
  "shopFilterOrderByType=asc",
  "shopFilterCat=[]",
  "shopFilterSubCat=[]",
  "shopFilterSubSubCat=[]",
  "shopFilterColor=[]",
  "shopFilterFabric=[]",
  "shopFilterMinPrice=0",
  "shopFilterMaxPrice=100000",
].join("; ");

type LiveProduct = {
  id?: unknown;
  name?: unknown;
  status?: unknown;
  thumbnail?: unknown;
  image_1?: unknown;
  image_2?: unknown;
  image_3?: unknown;
  [key: string]: unknown;
};

function createUrl(
  value: string,
): string {
  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  return new URL(
    value.replace(/^\/+/, ""),
    `${BASE_URL}/`,
  ).toString();
}

async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const controller =
    new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    return await fetch(url, {
      ...init,
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Tech-Tailor-Catalog-Refresh/1.0",
        ...(init?.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchLiveProducts():
  Promise<LiveProduct[]> {
  const allProducts:
    LiveProduct[] = [];

  for (
    let pageNumber = 1;
    ;
    pageNumber += 1
  ) {
    const url = new URL(
      "/shop/get-products-paged",
      BASE_URL,
    );

    url.searchParams.set(
      "pageNumber",
      String(pageNumber),
    );

    url.searchParams.set(
      "pageSize",
      String(PAGE_SIZE),
    );

    console.log(
      `Fetching catalogue page ${pageNumber}...`,
    );

    const response =
      await fetchWithTimeout(
        url.toString(),
        {
          headers: {
            Accept: "application/json, text/plain, */*",
            Referer: `${BASE_URL}/shop/products`,
            Cookie: CATALOG_FILTER_COOKIE,
          },
        },
      );

    if (!response.ok) {
      const errorBody =
        await response.text();

      throw new Error(
        `Catalogue request failed (${response.status}): ${errorBody.slice(0, 300)}`,
      );
    }

    const payload: unknown =
      await response.json();

    if (!Array.isArray(payload)) {
      throw new Error(
        "Tech-Tailor returned an unexpected catalogue response",
      );
    }

    if (payload.length === 0) {
      break;
    }

    allProducts.push(
      ...(payload as LiveProduct[]),
    );

    if (payload.length < PAGE_SIZE) {
      break;
    }
  }

  const uniqueProducts =
    new Map<number, LiveProduct>();

  for (const product of allProducts) {
    const id = Number(product.id);

    if (
      Number.isInteger(id) &&
      id > 0 &&
      product.status === "published"
    ) {
      uniqueProducts.set(
        id,
        product,
      );
    }
  }

  return [
    ...uniqueProducts.values(),
  ];
}

async function imageWorks(
  imageUrl: string,
): Promise<boolean> {
  try {
    const headResponse =
      await fetchWithTimeout(
        imageUrl,
        {
          method: "HEAD",
        },
      );

    const headType =
      headResponse.headers.get(
        "content-type",
      ) ?? "";

    if (
      headResponse.ok &&
      headType
        .toLowerCase()
        .startsWith("image/")
    ) {
      return true;
    }

    if (
      headResponse.status !== 403 &&
      headResponse.status !== 405
    ) {
      return false;
    }

    const getResponse =
      await fetchWithTimeout(
        imageUrl,
        {
          method: "GET",
          headers: {
            Range: "bytes=0-0",
          },
        },
      );

    const getType =
      getResponse.headers.get(
        "content-type",
      ) ?? "";

    return (
      getResponse.ok &&
      getType
        .toLowerCase()
        .startsWith("image/")
    );
  } catch {
    return false;
  }
}

function getImageCandidates(
  product: LiveProduct,
): string[] {
  return [
    product.thumbnail,
    product.image_1,
    product.image_2,
    product.image_3,
  ]
    .filter(
      (value): value is string =>
        typeof value === "string" &&
        value.trim().length > 0,
    )
    .map((value) => value.trim());
}

async function validateProduct(
  product: LiveProduct,
): Promise<LiveProduct | null> {
  const candidates =
    getImageCandidates(product);

  for (const candidate of candidates) {
    const fullUrl =
      createUrl(candidate);

    if (await imageWorks(fullUrl)) {
      if (
        candidate !== product.thumbnail
      ) {
        product.thumbnail = candidate;
      }

      return product;
    }
  }

  console.warn(
    `Skipping product ${String(product.id)} (${String(product.name)}): no working image`,
  );

  return null;
}

async function validateInBatches(
  products: LiveProduct[],
): Promise<LiveProduct[]> {
  const validProducts:
    LiveProduct[] = [];

  for (
    let start = 0;
    start < products.length;
    start += IMAGE_CONCURRENCY
  ) {
    const batch = products.slice(
      start,
      start + IMAGE_CONCURRENCY,
    );

    const results =
      await Promise.all(
        batch.map(validateProduct),
      );

    for (const result of results) {
      if (result) {
        validProducts.push(result);
      }
    }

    console.log(
      `Validated ${Math.min(start + batch.length, products.length)}/${products.length} products...`,
    );
  }

  return validProducts;
}

async function main():
  Promise<void> {
  console.log(
    "Refreshing Tech-Tailor catalogue from the live website...",
  );

  const liveProducts =
    await fetchLiveProducts();

  console.log(
    `Live published products: ${liveProducts.length}`,
  );

  const validatedProducts =
    await validateInBatches(
      liveProducts,
    );

  validatedProducts.sort(
    (left, right) =>
      Number(left.id) -
      Number(right.id),
  );

  const outputPath = resolve(
    process.cwd(),
    "src",
    "data",
    "live-products-tailoring.json",
  );

  writeFileSync(
    outputPath,
    `${JSON.stringify(validatedProducts, null, 2)}\n`,
    "utf8",
  );

  console.log(
    `Saved ${validatedProducts.length} current products to ${outputPath}`,
  );

  console.log(
    `Excluded ${liveProducts.length - validatedProducts.length} published products with broken/missing images.`,
  );
}

main().catch((error: unknown) => {
  console.error(
    "Catalogue refresh failed:",
    error,
  );

  process.exitCode = 1;
});
