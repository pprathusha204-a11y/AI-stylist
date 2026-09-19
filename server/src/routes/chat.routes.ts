import {
  Router,
  type Request,
  type Response,
} from "express";

import {
  determineNextStep,
} from "../services/conversation.service";

import {
  extractWithGemini,
} from "../services/gemini-extraction.service";

import {
  classifyPurchaseIntent,
  type PurchaseIntent,
} from "../services/intent.service";

import {
  getQuickReplies,
} from "../services/quick-replies.service";

import {
  getAvailableProductColours,
  recommendClosestProducts,
  recommendExactProducts,
} from "../services/recommendation.service";

import {
  extractRequirements,
} from "../services/requirements.service";

import {
  createSessionCheckpoint,
  getOrCreateSession,
  restoreSessionCheckpoint,
  updateSession,
  type CustomerRequirements,
  type RequirementField,
} from "../services/session.service";

import {
  classifyWorkflow,
  type WorkflowType,
} from "../services/workflow.service";

import {
  recommendFabrics,
} from "../services/fabric-recommendation.service";

import {
  getCatalogProductById,
} from "../services/catalog.service";

import {
  getCustomizationGroupById,
  type CustomizationGroup,
} from "../services/customization-catalog.service";

import {
  getBodyTypeGroup,
  getFitOptionsGroup,
} from "../services/body-type.service";

const chatRouter = Router();

function normalizeValue(
  value: string | null,
): string {
  return (
    value
      ?.toLowerCase()
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim() ?? ""
  );
}

function getRecommendationStartingPrice(
  recommendations: Array<{
    product: { price: number };
  }>,
): string | null {
  if (recommendations.length === 0) {
    return null;
  }

  const startingPrice = Math.min(
    ...recommendations.map(
      (recommendation) =>
        recommendation.product.price,
    ),
  );

  return `₹${startingPrice.toLocaleString("en-IN")}`;
}

function getFriendlyWeddingEvent(
  requirements: CustomerRequirements,
): string | null {
  const event = requirements.weddingFunction
    ?.replace(/^wedding\s*-\s*/i, "")
    .trim();

  return event || null;
}

function buildFallbackRecommendationMessage(
  requirements: CustomerRequirements,
  recommendations: Array<{
    product: { price: number };
  }>,
): string {
  const startingPrice =
    getRecommendationStartingPrice(
      recommendations,
    );
  const weddingEvent =
    getFriendlyWeddingEvent(requirements);

  const selectionContext = weddingEvent
    ? ` for ${weddingEvent}`
    : requirements.occasion &&
        normalizeValue(
          requirements.occasion,
        ) !== "all"
      ? ` for ${requirements.occasion}`
      : "";

  const priceText = startingPrice
    ? ` These alternatives start from ${startingPrice}.`
    : "";

  return "Stylist picks based on your choices so far.";
}

function removeNullRequirements(
  requirements: Partial<CustomerRequirements>,
): Partial<CustomerRequirements> {
  return Object.fromEntries(
    Object.entries(requirements).filter(
      ([, value]) =>
        value !== null &&
        value !== undefined,
    ),
  ) as Partial<CustomerRequirements>;
}

function isRecommendationRequest(
  message: string,
): boolean {
  const normalizedMessage =
    message.toLowerCase().trim();

  return (
    normalizedMessage.includes(
      "recommend",
    ) ||
    normalizedMessage.includes(
      "you choose",
    ) ||
    normalizedMessage.includes(
      "your choice",
    ) ||
    normalizedMessage.includes(
      "no preference",
    ) ||
    normalizedMessage === "any"
  );
}

function recommendColour(
  requirements: CustomerRequirements,
): string {
  const eventTime = normalizeValue(
    requirements.eventTime,
  );

  const style = normalizeValue(
    requirements.stylePreference,
  );

  const weddingFunction =
    normalizeValue(
      requirements.weddingFunction,
    );

  const occasion = normalizeValue(
    requirements.occasion,
  );

  let preferredColour = "navy blue";

  if (
    weddingFunction.includes("haldi")
  ) {
    preferredColour = "cream";
  } else if (
    weddingFunction.includes("mehendi")
  ) {
    preferredColour = "sage green";
  } else if (
    weddingFunction.includes(
      "cocktail",
    ) ||
    eventTime.includes("evening")
  ) {
    preferredColour = "navy blue";
  } else if (
    style.includes("traditional") ||
    eventTime.includes("day")
  ) {
    preferredColour = "beige";
  } else if (
    occasion.includes("business") ||
    occasion.includes("interview")
  ) {
    preferredColour = "navy blue";
  }

  const colourCandidates = [
    preferredColour,
    "navy blue",
    "black",
    "charcoal grey",
    "beige",
    "white",
    "burgundy",
    "light blue",
    "blue",
    "grey",
    "cream",
    "brown",
    "green",
    "red",
    "pink",
    "yellow",
  ].filter(
    (colour, index, colours) =>
      colours.indexOf(colour) === index,
  );

  return (
    getAvailableProductColours(
      requirements,
      colourCandidates,
    )[0] ?? preferredColour
  );
}

function recommendFabric(
  requirements: CustomerRequirements,
): string {
  const category = normalizeValue(
    requirements.category,
  );

  const occasion = normalizeValue(
    requirements.occasion,
  );

  const eventTime = normalizeValue(
    requirements.eventTime,
  );

  const style = normalizeValue(
    requirements.stylePreference,
  );

  if (category.includes("shirt")) {
    return "cotton";
  }

  if (
    category.includes("sherwani") ||
    category.includes("kurta") ||
    category.includes("bandhgala") ||
    category.includes(
      "indian ceremonial",
    ) ||
    style.includes("traditional")
  ) {
    return "silk blend";
  }

  if (
    eventTime.includes("day") ||
    occasion.includes("travel") ||
    occasion.includes("casual")
  ) {
    return "linen";
  }

  if (
    category.includes("suit") ||
    occasion.includes("business") ||
    occasion.includes("interview")
  ) {
    return "wool";
  }

  return "cotton";
}

function recommendFit(
  requirements: CustomerRequirements,
): string {
  const style = normalizeValue(
    requirements.stylePreference,
  );

  const occasion = normalizeValue(
    requirements.occasion,
  );

  if (
    style.includes("modern") ||
    occasion.includes("party")
  ) {
    return "slim";
  }

  if (
    occasion.includes("casual") ||
    occasion.includes("travel")
  ) {
    return "loose";
  }

  return "regular";
}

function recommendStyle(
  requirements: CustomerRequirements,
): string {
  const category = normalizeValue(
    requirements.category,
  );

  const occasion = normalizeValue(
    requirements.occasion,
  );

  if (
    category.includes("sherwani") ||
    category.includes("kurta") ||
    category.includes("bandhgala") ||
    category.includes(
      "indian ceremonial",
    )
  ) {
    return "traditional";
  }

  if (
    occasion.includes("wedding")
  ) {
    return "modern";
  }

  if (
    occasion.includes("business") ||
    occasion.includes("interview") ||
    occasion.includes("office")
  ) {
    return "classic";
  }

  if (occasion.includes("party")) {
    return "modern";
  }

  return "classic";
}

function getStylistRecommendation(
  message: string,
  session: ReturnType<
    typeof getOrCreateSession
  >,
): {
  requirements:
    Partial<CustomerRequirements>;
  note: string | null;
} {
  if (
    !isRecommendationRequest(message)
  ) {
    return {
      requirements: {},
      note: null,
    };
  }

  const expectedField =
    session.expectedField;

  if (expectedField === "colour") {
    const recommendedColour =
      recommendColour(
        session.requirements,
      );

    return {
      requirements: {
        colour: recommendedColour,
      },

      note:
        `I recommend ${recommendedColour} ` +
        "for this occasion.",
    };
  }

  if (expectedField === "fabric") {
    const recommendedFabric =
      recommendFabric(
        session.requirements,
      );

    return {
      requirements: {
        fabric: recommendedFabric,
      },

      note:
        `I recommend ${recommendedFabric} ` +
        "for comfort and suitability.",
    };
  }

  if (expectedField === "fit") {
    const recommendedFit =
      recommendFit(
        session.requirements,
      );

    return {
      requirements: {
        fit: recommendedFit,
      },

      note:
        `I recommend a ${recommendedFit} fit ` +
        "for this look.",
    };
  }

  if (
    expectedField ===
    "stylePreference"
  ) {
    const recommendedStyle =
      recommendStyle(
        session.requirements,
      );

    return {
      requirements: {
        stylePreference:
          recommendedStyle,
      },

      note:
        `I recommend a ${recommendedStyle} ` +
        "style for this occasion.",
    };
  }

  return {
    requirements: {},
    note: null,
  };
}

const customizationGroupByField:
  Partial<
    Record<RequirementField, number>
  > = {
  lapelStyle: 1,
  shoulderStyle: 2,
  buttonStyle: 4,
  ventType: 5,
  blazerOptions: 6,
  trouserStyle: 17,
  trouserWaistbandStyle: 18,
};

function getActiveCustomizationGroup(
  expectedField:
    | RequirementField
    | null,
  requirements: CustomerRequirements,
): CustomizationGroup | null {
  if (
    !expectedField ||
    requirements.selectedProductId ===
      null
  ) {
    return null;
  }

  const groupId =
    customizationGroupByField[
      expectedField
    ];

  if (!groupId) {
    return null;
  }

  const selectedProduct =
    getCatalogProductById(
      requirements.selectedProductId,
    );

  if (
    !selectedProduct ||
    !selectedProduct.customizationIds.includes(
      groupId,
    )
  ) {
    return null;
  }

  return getCustomizationGroupById(
    groupId,
  );
}

function resolveSingleQuickReplySteps(
  purchaseIntent: PurchaseIntent,
  workflow: WorkflowType,
  initialRequirements:
    CustomerRequirements,
): {
  requirements: CustomerRequirements;
  nextStep: ReturnType<
    typeof determineNextStep
  >;
  quickReplies: ReturnType<
    typeof getQuickReplies
  >;
} {
  let requirements: CustomerRequirements = {
    ...initialRequirements,
    selectedCustomizationOptionIds: [
      ...initialRequirements
        .selectedCustomizationOptionIds,
    ],
  };

  let nextStep = determineNextStep(
    purchaseIntent,
    workflow,
    requirements,
  );

  let quickReplies = getQuickReplies(
    nextStep.expectedField,
    workflow,
    requirements,
  );

  for (
    let skippedStepCount = 0;
    skippedStepCount < 12;
    skippedStepCount += 1
  ) {
    if (
      !nextStep.expectedField ||
      quickReplies.length !== 1 ||
      nextStep.expectedField === "budgetMin" ||
      nextStep.expectedField === "budgetMax"
    ) {
      break;
    }

    const onlyReply = quickReplies[0];
    const automaticallyExtracted =
      extractRequirements(
        onlyReply.value,
        nextStep.expectedField,
      );

    if (
      Object.keys(automaticallyExtracted)
        .length === 0
    ) {
      break;
    }

    const candidateRequirements:
      CustomerRequirements = {
      ...requirements,
      ...automaticallyExtracted,
    };

    if (
      JSON.stringify(candidateRequirements) ===
      JSON.stringify(requirements)
    ) {
      break;
    }

    const candidateNextStep =
      determineNextStep(
        purchaseIntent,
        workflow,
        candidateRequirements,
      );

    if (
      candidateNextStep.expectedField ===
        nextStep.expectedField &&
      candidateNextStep.stage ===
        nextStep.stage
    ) {
      break;
    }

    requirements = candidateRequirements;
    nextStep = candidateNextStep;
    quickReplies = getQuickReplies(
      nextStep.expectedField,
      workflow,
      requirements,
    );
  }

  return {
    requirements,
    nextStep,
    quickReplies,
  };
}

chatRouter.post(
  "/",
  async (
    request: Request,
    response: Response,
  ) => {
    const message =
      typeof request.body.message ===
      "string"
        ? request.body.message.trim()
        : "";

    const requestedSessionId =
      typeof request.body.sessionId ===
      "string"
        ? request.body.sessionId
        : undefined;

    if (!message) {
      return response.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const image = request.body.image;
    if (image !== undefined && (
      typeof image !== "string" ||
      !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image) ||
      Buffer.from(image.split(",")[1] || "", "base64").length > 5 * 1024 * 1024
    )) {
      return response.status(400).json({ success: false, message: "Choose a JPG, PNG, or WebP image smaller than 5 MB." });
    }
    if (image && !process.env.GEMINI_API_KEY) {
      return response.status(503).json({ success: false, message: "Image analysis is not configured yet. Please describe your outfit in text." });
    }

    const session =
      getOrCreateSession(
        requestedSessionId,
      );

    /*
     * Store the complete session state
     * before processing this answer.
     */
    const checkpoint =
      createSessionCheckpoint(
        session.id,
        message,
      );

    /*
     * Save the field being answered before
     * determining the next question.
     */
    const answeredField =
      session.expectedField;

    const intentResult =
      classifyPurchaseIntent(message);

    const workflowResult =
      classifyWorkflow(message);

    const ruleRequirements =
      extractRequirements(
        message,
        session.expectedField,
      );

    const stylistRecommendation =
      getStylistRecommendation(
        message,
        session,
      );

    /*
     * Quick replies and recognized selections
     * are already understood locally. Avoid an
     * unnecessary external AI request for those
     * messages so the next step appears at once.
     */
    const hasDeterministicResult =
      Object.keys(ruleRequirements)
        .length > 0 ||
      [
        "occasion_shopping",
        "custom_design",
        "technician_service",
        "customer_support",
      ].includes(workflowResult.workflow) ||
      Object.keys(
        stylistRecommendation.requirements,
      ).length > 0 ||
      stylistRecommendation.note !== null;

    const geminiResult =
      hasDeterministicResult && !image
        ? null
        : await extractWithGemini(
            message,
            session,
            image,
          );

    if (image && !geminiResult) {
      return response.status(502).json({ success: false, message: "Unable to analyse this image. Please try again or describe your outfit in text." });
    }

    const fallbackIntent =
      intentResult.confidence ===
        0.35 &&
      session.purchaseIntent !==
        "exploring"
        ? session.purchaseIntent
        : intentResult.intent;

    const fallbackWorkflow =
      workflowResult.confidence ===
        0.35 &&
      session.workflow !==
        "discovery"
        ? session.workflow
        : workflowResult.workflow;

    const isShortFollowUpAnswer =
      session.expectedField !== null &&
      intentResult.confidence ===
        0.35 &&
      workflowResult.confidence ===
        0.35;

    const effectiveIntent =
      isShortFollowUpAnswer &&
      session.purchaseIntent !==
        "exploring"
        ? session.purchaseIntent
        : geminiResult &&
            geminiResult.confidence >=
              0.6
          ? geminiResult.purchaseIntent
          : fallbackIntent;

    const preserveGuidedWorkflow =
      [
        "occasion_shopping",
        "custom_design",
        "technician_service",
      ].includes(session.workflow) &&
      session.expectedField !== null;

    /*
     * Occasion and wedding-event buttons refine the
     * current shopping journey instead of replacing it.
     */
    const preserveShoppingWorkflowForSelectionAnswer =
      (
        (answeredField === "occasion" &&
          ruleRequirements.occasion !== undefined) ||
        (answeredField === "weddingFunction" &&
          ruleRequirements.weddingFunction !== undefined)
      ) &&
      session.workflow !== "discovery";

    const effectiveWorkflow =
      preserveGuidedWorkflow ||
      preserveShoppingWorkflowForSelectionAnswer
        ? session.workflow
        : isShortFollowUpAnswer &&
      session.workflow !==
        "discovery"
        ? session.workflow
        : geminiResult &&
            geminiResult.confidence >=
              0.6
          ? geminiResult.workflow
          : fallbackWorkflow;

    const geminiRequirements =
      geminiResult
        ? removeNullRequirements(
            geminiResult.requirements,
          )
        : {};

const customizationAnswerFields:
  RequirementField[] = [
  "lapelStyle",
  "shoulderStyle",
  "buttonStyle",
  "ventType",
  "blazerOptions",
  "trouserStyle",
  "trouserWaistbandStyle",
];

const isCustomizationAnswer =
  answeredField !== null &&
  customizationAnswerFields.includes(
    answeredField,
  );

const safeGeminiRequirements:
  Partial<CustomerRequirements> = {
  ...geminiRequirements,
};

const safeStylistRequirements:
  Partial<CustomerRequirements> = {
  ...stylistRecommendation.requirements,
};

/*
 * Customization cards provide exact,
 * trusted option IDs and names.
 * Gemini must not guess other options.
 */
if (isCustomizationAnswer) {
  delete safeGeminiRequirements.lapelStyle;
  delete safeGeminiRequirements.shoulderStyle;
  delete safeGeminiRequirements.buttonStyle;
  delete safeGeminiRequirements.ventType;
  delete safeGeminiRequirements.blazerOptions;
  delete safeGeminiRequirements.trouserStyle;
  delete safeGeminiRequirements
    .trouserWaistbandStyle;

  delete safeStylistRequirements.lapelStyle;
  delete safeStylistRequirements.shoulderStyle;
  delete safeStylistRequirements.buttonStyle;
  delete safeStylistRequirements.ventType;
  delete safeStylistRequirements.blazerOptions;
  delete safeStylistRequirements.trouserStyle;
  delete safeStylistRequirements
    .trouserWaistbandStyle;
}

const selectedCustomizationOptionIds =
  Array.from(
    new Set([
      ...session.requirements
        .selectedCustomizationOptionIds,

      ...(
        ruleRequirements
          .selectedCustomizationOptionIds ??
        []
      ),
    ]),
  );

const mergedRequirements:
  CustomerRequirements = {
  ...session.requirements,
  ...safeGeminiRequirements,
  ...safeStylistRequirements,

  /*
   * Deterministic rule extraction must
   * take priority over AI guesses.
   */
  ...ruleRequirements,

  selectedCustomizationOptionIds,
};

/*
 * When a product is selected early,
 * use its catalogue classification so
 * completed discovery questions are skipped.
 */
const selectedCatalogProductForFlow =
  mergedRequirements.selectedProductId !==
  null
    ? getCatalogProductById(
        mergedRequirements.selectedProductId,
      )
    : null;

if (selectedCatalogProductForFlow) {
  mergedRequirements.department =
    selectedCatalogProductForFlow.category;

  mergedRequirements.category =
    selectedCatalogProductForFlow.subcategory;

  mergedRequirements.subcategory =
    selectedCatalogProductForFlow
      .subSubcategory;
}

    const resolvedFlow =
      resolveSingleQuickReplySteps(
        effectiveIntent,
        effectiveWorkflow,
        mergedRequirements,
      );

    const nextStep =
      resolvedFlow.nextStep;

    const updatedSession =
      updateSession(
        session.id,
        {
          purchaseIntent:
            effectiveIntent,

          workflow:
            effectiveWorkflow,

          requirements:
            resolvedFlow.requirements,

          stage:
            nextStep.stage,

          expectedField:
            nextStep.expectedField,
        },
      );

    const quickReplies =
      resolvedFlow.quickReplies;

          const customizationGroup =
            getActiveCustomizationGroup(
              updatedSession.expectedField,
              updatedSession.requirements,
            );

const bodyTypeGroup =
  updatedSession.expectedField ===
  "fit"
    ? getFitOptionsGroup(
        updatedSession.requirements,
      )
    : updatedSession.expectedField ===
        "bodyType"
      ? getBodyTypeGroup(
          updatedSession.requirements,
        )
      : null;

    /*
     * Recommendations are recalculated
     * after every shopping answer.
     */
/*
 * Show product cards only when the
 * customer has completed the preferences
 * and must select a product.
 */
const isAccessoriesRecommendationStep =
  updatedSession.stage ===
    "ready_for_recommendations" &&
  [
    updatedSession.requirements
      .department,
    updatedSession.requirements.category,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes("accessor");

const shouldShowRecommendations =
  updatedSession.requirements
    .selectedProductId === null &&
  (updatedSession.stage ===
    "select_product_style" ||
    isAccessoriesRecommendationStep);

const exactRecommendationCandidates =
  shouldShowRecommendations
    ? recommendExactProducts(
        updatedSession.requirements,
        updatedSession.workflow ===
          "custom_design"
          ? 200
          : 12,
      )
    : [];

const recommendationCandidates =
  shouldShowRecommendations &&
  exactRecommendationCandidates.length === 0 &&
  updatedSession.workflow !== "custom_design"
    ? recommendClosestProducts(
        updatedSession.requirements,
        12,
      )
    : exactRecommendationCandidates;

const usingFallback =
  shouldShowRecommendations &&
  exactRecommendationCandidates.length === 0 &&
  recommendationCandidates.length > 0;

const recommendations =
  updatedSession.workflow ===
    "custom_design"
    ? recommendationCandidates.filter(
        (recommendation) =>
          recommendation.product
            .canCustomizeStyle,
      ).slice(0, 12)
    : recommendationCandidates;

    const shouldShowFabricSuggestions =
      updatedSession.expectedField ===
        "fabric" ||
      message
        .toLowerCase()
        .includes("explore fabric");

    const fabricRecommendations =
      shouldShowFabricSuggestions
        ? recommendFabrics(
            updatedSession.requirements,
            6,
          )
        : [];

    /*
     * Keep the conversation compact: the
     * selected answer is already displayed by
     * the client, so no acknowledgement bubble
     * is needed before the next question.
     */
    const acknowledgement = null;

    let recommendationMessage:
      | string
      | null = null;

    if (recommendations.length > 0) {
      if (usingFallback) {
        recommendationMessage =
          buildFallbackRecommendationMessage(
            updatedSession.requirements,
            recommendations,
          );
      } else if (
        nextStep.stage ===
        "ready_for_recommendations"
      ) {
        recommendationMessage =
          `I found ${recommendations.length} product${
            recommendations.length > 1
              ? "s"
              : ""
          } matching your requirements.`;
      } else {
        recommendationMessage =
          "Stylist picks based on your choices so far.";
      }
    } else if (shouldShowRecommendations) {
      recommendationMessage =
        "I don't have an exact item for that combination right now, but I can still help you explore the nearest Tech-Tailor styles or a wider price range.";
    }

    return response
      .status(200)
      .json({
        success: true,

        data: {
          sessionId:
            updatedSession.id,

          checkpoint: {
            id: checkpoint.id,

            answeredField:
              checkpoint.answeredField,
          },

          userMessage: message,

          /*
           * Frontend display order:
           * acknowledgement
           * recommendationMessage
           * product cards
           * reply
           * quickReplies
           */
          acknowledgement,

          recommendationMessage,

          recommendations,

          fabricRecommendations,

          reply: nextStep.reply,

          quickReplies,

          customizationGroup,

          bodyTypeGroup,

          purchaseIntent:
            updatedSession.purchaseIntent,

          workflow:
            updatedSession.workflow,

          extractionSource:
            geminiResult
              ? "gemini_with_rule_validation"
              : "rule_fallback",

          confidence:
            geminiResult?.confidence ??
            intentResult.confidence,

          stage:
            updatedSession.stage,

          expectedField:
            updatedSession.expectedField,

          requirements:
            updatedSession.requirements,
        },
      });
  },
);
chatRouter.post(
  "/restore",
  (
    request: Request,
    response: Response,
  ) => {
    const sessionId =
      typeof request.body.sessionId ===
      "string"
        ? request.body.sessionId
        : "";

    const checkpointId =
      typeof request.body.checkpointId ===
      "string"
        ? request.body.checkpointId
        : "";

    if (!sessionId || !checkpointId) {
      return response.status(400).json({
        success: false,
        message:
          "Session ID and checkpoint ID are required",
      });
    }

    try {
      const restoredSession =
        restoreSessionCheckpoint(
          sessionId,
          checkpointId,
        );

      const resolvedFlow =
        resolveSingleQuickReplySteps(
          restoredSession.purchaseIntent,
          restoredSession.workflow,
          restoredSession.requirements,
        );

      const nextStep =
        resolvedFlow.nextStep;

      const updatedSession =
        updateSession(
          restoredSession.id,
          {
            requirements:
              resolvedFlow.requirements,

            stage: nextStep.stage,

            expectedField:
              nextStep.expectedField,
          },
        );

      const quickReplies =
        resolvedFlow.quickReplies;

        const customizationGroup =
          getActiveCustomizationGroup(
            updatedSession.expectedField,
            updatedSession.requirements,
          );

        const bodyTypeGroup =
          updatedSession.expectedField ===
          "bodyType"
            ? getBodyTypeGroup(
                updatedSession.requirements,
              )
            : null;
/*
 * Show product cards only when the
 * customer has completed the preferences
 * and must select a product.
 */
const isAccessoriesRecommendationStep =
  updatedSession.stage ===
    "ready_for_recommendations" &&
  [
    updatedSession.requirements
      .department,
    updatedSession.requirements.category,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes("accessor");

const shouldShowRecommendations =
  updatedSession.requirements
    .selectedProductId === null &&
  (updatedSession.stage ===
    "select_product_style" ||
    isAccessoriesRecommendationStep);

const exactRecommendationCandidates =
  shouldShowRecommendations
    ? recommendExactProducts(
        updatedSession.requirements,
        updatedSession.workflow ===
          "custom_design"
          ? 200
          : 12,
      )
    : [];

const recommendationCandidates =
  shouldShowRecommendations &&
  exactRecommendationCandidates.length === 0 &&
  updatedSession.workflow !== "custom_design"
    ? recommendClosestProducts(
        updatedSession.requirements,
        12,
      )
    : exactRecommendationCandidates;

const usingFallback =
  shouldShowRecommendations &&
  exactRecommendationCandidates.length === 0 &&
  recommendationCandidates.length > 0;

const recommendations =
  updatedSession.workflow ===
    "custom_design"
    ? recommendationCandidates.filter(
        (recommendation) =>
          recommendation.product
            .canCustomizeStyle,
      ).slice(0, 12)
    : recommendationCandidates;

      const fabricRecommendations =
        updatedSession.expectedField ===
        "fabric"
          ? recommendFabrics(
              updatedSession.requirements,
              6,
            )
          : [];

      let recommendationMessage:
        | string
        | null = null;

      if (recommendations.length > 0) {
        recommendationMessage = usingFallback
          ? buildFallbackRecommendationMessage(
              updatedSession.requirements,
              recommendations,
            )
          : "These products match your choices at this point.";
      } else if (shouldShowRecommendations) {
        recommendationMessage =
          "I couldn't find an exact match right now. Try another Tech-Tailor category or price range.";
      }

      return response
        .status(200)
        .json({
          success: true,

          data: {
            restored: true,

            sessionId:
              updatedSession.id,

            acknowledgement: null,

            recommendationMessage,

            recommendations,

            fabricRecommendations,

            reply: nextStep.reply,

            quickReplies,

            customizationGroup,
            bodyTypeGroup,

            purchaseIntent:
              updatedSession.purchaseIntent,

            workflow:
              updatedSession.workflow,

            stage:
              updatedSession.stage,

            expectedField:
              updatedSession.expectedField,

            requirements:
              updatedSession.requirements,
          },
        });
    } catch (error) {
      return response
        .status(404)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Unable to restore checkpoint",
        });
    }
  },
);

export default chatRouter;
