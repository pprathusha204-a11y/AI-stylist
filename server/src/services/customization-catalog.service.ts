import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { z } from "zod";

const customizationOptionSchema =
  z.object({
    id: z.number().int().positive(),
    name: z.string().min(1),
    description: z.string(),
    imageUrl: z
      .string()
      .url()
      .nullable(),
  });

const customizationGroupSchema =
  z.object({
    id: z.number().int().positive(),
    name: z.string().min(1),

    selectionType: z.enum([
      "single",
      "multiple",
    ]),

    options: z
      .array(
        customizationOptionSchema,
      )
      .min(1),
  });

const customizationCatalogSchema =
  z.object({
    sourceProductId: z
      .number()
      .int()
      .positive(),

    sourceUrl: z.string().url(),

    extractedAt: z.string(),

    groups: z.array(
      customizationGroupSchema,
    ),
  });

export type CustomizationOption =
  z.infer<
    typeof customizationOptionSchema
  >;

export type CustomizationGroup =
  z.infer<
    typeof customizationGroupSchema
  >;

let cachedCustomizationGroups:
  | CustomizationGroup[]
  | null = null;

function loadCustomizationGroups():
  CustomizationGroup[] {
  const filePath = resolve(
    process.cwd(),
    "src",
    "data",
    "live-customizations.json",
  );

  const fileContents =
    readFileSync(
      filePath,
      "utf8",
    );

  const parsedData: unknown =
    JSON.parse(fileContents);

  const validationResult =
    customizationCatalogSchema.safeParse(
      parsedData,
    );

  if (!validationResult.success) {
    const firstIssue =
      validationResult.error.issues[0];

    throw new Error(
      `Invalid customization catalogue: ${
        firstIssue?.message ??
        "Unknown validation error"
      }`,
    );
  }

  return validationResult.data.groups;
}

export function getCustomizationGroups():
  CustomizationGroup[] {
  if (!cachedCustomizationGroups) {
    cachedCustomizationGroups =
      loadCustomizationGroups();
  }

  return cachedCustomizationGroups;
}

export function getCustomizationGroupsByIds(
  customizationIds: number[],
): CustomizationGroup[] {
  if (
    customizationIds.length === 0
  ) {
    return [];
  }

  const requestedIds =
    new Set(customizationIds);

  return getCustomizationGroups().filter(
    (group) =>
      requestedIds.has(group.id),
  );
}

export function getCustomizationGroupById(
  groupId: number,
): CustomizationGroup | null {
  return (
    getCustomizationGroups().find(
      (group) =>
        group.id === groupId,
    ) ?? null
  );
}

export function clearCustomizationCatalogCache():
  void {
  cachedCustomizationGroups = null;
}