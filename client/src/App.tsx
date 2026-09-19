import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ChevronDown,
  RotateCcw,
} from "lucide-react";

import Header from "./components/layout/Header";
import ChatInput from "./features/stylist/ChatInput";
import ChatMessage from "./features/stylist/ChatMessage";
import FabricRecommendationCard from "./features/stylist/FabricRecommendationCard";
import ProductRecommendationCard from "./features/stylist/ProductRecommendationCard";
import StylistWelcome from "./features/stylist/StylistWelcome";
import CustomizationOptionsPanel from "./features/stylist/CustomizationOptionsPanel";
import BodyTypeOptionsPanel from "./features/stylist/BodyTypeOptionsPanel";
import CustomMeasurementsPanel from "./features/stylist/CustomMeasurementsPanel";
import TailoredOrderSummary from "./features/stylist/TailoredOrderSummary";
import TechnicianDatePanel from "./features/stylist/TechnicianDatePanel";
import SupportActions from "./features/stylist/SupportActions";

import {
  restoreChatCheckpoint,
  sendChatMessage,
  type BodyTypeGroup,
  type BodyTypeOption,
  type ChatCheckpoint,
  type ConversationStage,
  type CustomerRequirements,
  type CustomizationGroup,
  type CustomizationOption,
  type FabricRecommendation,
  type ProductRecommendation,
  type QuickReply,
  type RequirementField,
} from "./services/chatApi";

type Message = {
  id: number;

  role:
    | "user"
    | "assistant";

  text: string;
  image?: string;

  stage?: ConversationStage;

  requirements?: CustomerRequirements;

  checkpoint?: ChatCheckpoint;

  acknowledgement?: string | null;

  recommendationMessage?:
    | string
    | null;

  recommendations?:
    ProductRecommendation[];

  fabricRecommendations?:
    FabricRecommendation[];

  customizationGroup?:
    | CustomizationGroup
    | null;

  bodyTypeGroup?:
    | BodyTypeGroup
    | null;

  quickReplies?: QuickReply[];
};

const optionMessages: Record<
  string,
  string
> = {
  "Shop Men":
    "I am shopping for men",

  "Shop Women":
    "I am shopping for women",

  "Shop Accessories":
    "I am shopping for accessories",

  "Shop by Occasion":
    "I want to shop by occasion",

  "Explore Fabrics":
    "I want to explore fabric options",

  "More Services":
    "I want to explore other Tech-Tailor services",

  "Customize Design":
    "I want to use the custom design service",

  "Schedule Technician":
    "I want to schedule a technician visit",

  "Track My Order":
    "I need help tracking an existing order",

  "Delivery Status":
    "I need the delivery status for an existing order",

  "Change Delivery Address":
    "I need to change the delivery address for an existing order",

  "Measurement Correction":
    "I need a measurement correction for an existing order",

  "Return or Rework":
    "I need return or rework help for an existing order",
};

function App() {
  const [messages, setMessages] =
    useState<Message[]>([]);

  const [sessionId, setSessionId] =
    useState<string | undefined>(
      undefined,
    );

  const [isLoading, setIsLoading] =
    useState(false);

  const [
    visibleRecommendationCounts,
    setVisibleRecommendationCounts,
  ] = useState<Record<number, number>>({});

  const messagesEndRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isLoading]);

  const handleNewSession = () => {
    setMessages([]);
    setSessionId(undefined);
    setIsLoading(false);
    setVisibleRecommendationCounts({});
  };

  const handleConversation = async (
    visibleMessage: string,
    apiMessage: string = visibleMessage,
    image?: string,
  ) => {
    if (
      isLoading ||
      !visibleMessage.trim()
    ) {
      return false;
    }

    const messageId = Date.now();

    setMessages(
      (currentMessages) => [
        ...currentMessages,
        {
          id: messageId,
          role: "user",
          text: visibleMessage,
          image,
        },
      ],
    );

    setIsLoading(true);

    try {
      const result =
        await sendChatMessage(
          apiMessage,
          sessionId,
          image,
        );

      setSessionId(result.sessionId);

      setMessages(
        (currentMessages) => {
          const messagesWithCheckpoint =
            currentMessages.map(
              (message) =>
                message.id === messageId
                  ? {
                      ...message,

                      checkpoint:
                        result.checkpoint,
                    }
                  : message,
            );

          return [
            ...messagesWithCheckpoint,

            {
              id: messageId + 1,

              role:
                "assistant" as const,

              text: result.reply,

              stage: result.stage,

              requirements: result.requirements,

              acknowledgement:
                result.acknowledgement,

              recommendationMessage:
                result.recommendationMessage,

              recommendations:
                result.recommendations ??
                [],

              fabricRecommendations:
                result.fabricRecommendations ??
                [],

              customizationGroup:
                result.customizationGroup,

              bodyTypeGroup:
                result.bodyTypeGroup,

              quickReplies:
                result.quickReplies ?? [],
            },
          ];
        },
      );
      return true;
    } catch (error) {
      console.error(
        "Stylist request failed:",
        error,
      );

      setMessages(
        (currentMessages) => [
          ...currentMessages,

          {
            id: messageId + 1,

            role: "assistant",

            text:
              error instanceof Error ? error.message : "Sorry, I couldn't connect to the stylist service. Please try again.",
          },
        ],
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreCheckpoint =
    async (
      userMessageId: number,
      checkpointId: string,
      answeredField:
        | RequirementField
        | null,
    ) => {
      if (isLoading) {
        return;
      }

      /*
       * The first checkpoint represents a
       * welcome-card selection. Return to the
       * real welcome screen so all six entry
       * choices are restored.
       */
      if (answeredField === null) {
        handleNewSession();
        return;
      }

      if (!sessionId) {
        return;
      }

      setIsLoading(true);

      try {
        const result =
          await restoreChatCheckpoint(
            sessionId,
            checkpointId,
          );

        setSessionId(result.sessionId);
        setVisibleRecommendationCounts({});

        setMessages(
          (currentMessages) => {
            const targetIndex =
              currentMessages.findIndex(
                (message) =>
                  message.id ===
                  userMessageId,
              );

            if (targetIndex === -1) {
              return currentMessages;
            }

            /*
             * Remove the selected user answer
             * and every message after it.
             */
            const earlierMessages =
              currentMessages.slice(
                0,
                targetIndex,
              );

            const restoredAssistantMessage:
              Message = {
              id: Date.now(),

              role: "assistant",

              text: result.reply,

              stage: result.stage,

              requirements: result.requirements,

              acknowledgement:
                result.acknowledgement,

              recommendationMessage:
                result.recommendationMessage,

              recommendations:
                result.recommendations ??
                [],

              fabricRecommendations:
                result.fabricRecommendations ??
                [],

              customizationGroup:
                result.customizationGroup,

              bodyTypeGroup:
                result.bodyTypeGroup,

              quickReplies:
                result.quickReplies ?? [],
            };

            /*
             * Replace the previous assistant
             * question instead of displaying
             * the same question twice.
             */
            let previousAssistantIndex =
              -1;

            for (
              let index =
                earlierMessages.length -
                1;
              index >= 0;
              index -= 1
            ) {
              if (
                earlierMessages[index]
                  .role === "assistant"
              ) {
                previousAssistantIndex =
                  index;

                break;
              }
            }

            if (
              previousAssistantIndex >= 0
            ) {
              return earlierMessages.map(
                (message, index) =>
                  index ===
                  previousAssistantIndex
                    ? {
                        ...restoredAssistantMessage,
                        id: message.id,
                      }
                    : message,
              );
            }

            return [
              ...earlierMessages,
              restoredAssistantMessage,
            ];
          },
        );
      } catch (error) {
        console.error(
          "Checkpoint restore failed:",
          error,
        );

        setMessages(
          (currentMessages) => [
            ...currentMessages,

            {
              id: Date.now(),

              role: "assistant",

              text:
                "Sorry, I couldn't restore that step. Please try again.",
            },
          ],
        );
      } finally {
        setIsLoading(false);
      }
    };

  const handleWelcomeOptionSelect = (
    option: string,
  ) => {
    const apiMessage =
      optionMessages[option] ??
      option;

    void handleConversation(
      option,
      apiMessage,
    );
  };

  const handleQuickReplySelect = (
    quickReply: QuickReply,
  ) => {
    void handleConversation(
      quickReply.label,
      quickReply.value,
    );
  };

  const handleFabricSelect = (
    fabricName: string,
    selectValue: string,
  ) => {
    void handleConversation(
      fabricName,
      selectValue,
    );
  };

  const handleCustomizationSubmit = (
    options: CustomizationOption[],
  ) => {
    if (options.length === 0) {
      void handleConversation(
        "No additional option",
        "I select no additional customization options",
      );

      return;
    }

    const optionNames = options
      .map((option) => option.name)
      .join(", ");

    const optionIds = options
      .map((option) => option.id)
      .join(",");

    const idLabel =
      options.length === 1
        ? "ID"
        : "IDs";

    void handleConversation(
      options
        .map((option) => option.name)
        .join(" + "),
      `I select customization option ${idLabel} ${optionIds}: ${optionNames}`,
    );
  };

  const handleBodyTypeSelect = (
    option: BodyTypeOption,
  ) => {
    void handleConversation(
      option.name,
      option.selectValue,
    );
  };

  const handleTechnicianDateSubmit = (
    date: string,
  ) => {
    void handleConversation(
      date,
      `My preferred date is ${date}`,
    );
  };

  const handleProductSelect = (
    product: ProductRecommendation["product"],
  ) => {
    void handleConversation(
      `Selected: ${product.name}`,
      `I select product ID ${product.id}: ${product.name}`,
    );
  };

  const handleShowMoreRecommendations = (
    messageId: number,
  ) => {
    setVisibleRecommendationCounts(
      (currentCounts) => ({
        ...currentCounts,
        [messageId]:
          (currentCounts[messageId] ?? 3) +
          3,
      }),
    );
  };

  const handleSendMessage = (
    text: string,
    image?: string,
  ) => {
    return handleConversation(text, text, image);
  };

  const latestAssistantMessageId =
    [...messages]
      .reverse()
      .find(
        (message) =>
          message.role ===
          "assistant",
      )?.id;

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <Header
        onNewSession={
          handleNewSession
        }
      />

      <main className="pb-28">
        {messages.length === 0 ? (
          <StylistWelcome
            onOptionSelect={
              handleWelcomeOptionSelect
            }
          />
        ) : (
          <section className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pt-8">
            {messages.map(
              (message) => {
                const isLatestAssistant =
                  message.role ===
                    "assistant" &&
                  message.id ===
                    latestAssistantMessageId;

                const visibleRecommendationCount =
                  visibleRecommendationCounts[
                    message.id
                  ] ?? 3;

                const visibleRecommendations =
                  message.recommendations?.slice(
                    0,
                    visibleRecommendationCount,
                  ) ?? [];

                const hasMoreRecommendations =
                  visibleRecommendationCount <
                  (message.recommendations
                    ?.length ?? 0);

                if (
                  message.role === "user"
                ) {
                  return (
                    <div
                      key={message.id}
                      className="space-y-1"
                    >
                      <ChatMessage
                        role="user"
                        text={message.text}
                        image={message.image}
                      />


                      {message.checkpoint && (
                        <div className="flex justify-end pr-1">
                          <button
                            type="button"
                            disabled={
                              isLoading
                            }
                            onClick={() =>
                              void handleRestoreCheckpoint(
                                message.id,

                                message
                                  .checkpoint!
                                  .id,

                                message
                                  .checkpoint!
                                  .answeredField,
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Go back and change this answer"
                          >
                            <RotateCcw
                              size={11}
                              strokeWidth={
                                1.8
                              }
                            />

                            Go Back
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={message.id}
                    className="space-y-3"
                  >
                    {message.acknowledgement && (
                      <ChatMessage
                        role="assistant"
                        text={
                          message.acknowledgement
                        }
                      />
                    )}

                    {message.recommendationMessage && (
                      <ChatMessage
                        role="assistant"
                        text={
                          message.recommendationMessage
                        }
                      />
                    )}

                    {message.recommendations &&
                      message
                        .recommendations
                        .length > 0 && (
                        <div className="space-y-3">
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {visibleRecommendations.map(
                              (
                                recommendation,
                              ) => (
                                <ProductRecommendationCard
                                  key={
                                    recommendation
                                      .product
                                      .id
                                  }
                                  recommendation={
                                    recommendation
                                  }
                                  disabled={
                                    isLoading ||
                                    !isLatestAssistant
                                  }
                                  onSelect={
                                    handleProductSelect
                                  }

                                  showMatchPercentage={
                                      message.stage ===
                                      "select_product_style"
                                    }
                                />
                              ),
                            )}
                          </div>

                          {hasMoreRecommendations && (
                            <div className="flex justify-center pt-1">
                              <button
                                type="button"
                                disabled={
                                  isLoading ||
                                  !isLatestAssistant
                                }
                                onClick={() =>
                                  handleShowMoreRecommendations(
                                    message.id,
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-5 py-2.5 text-xs font-semibold text-blue-800 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
                              >
                                More Options

                                <ChevronDown
                                  size={14}
                                  strokeWidth={2}
                                />
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                    {message.text && (
                      <ChatMessage
                        role="assistant"
                        text={message.text}
                      />
                    )}

                    {message.stage ===
  "review_tailored_order" &&
  message.requirements && (
    <TailoredOrderSummary
      requirements={
        message.requirements
      }
    />
  )}

                    

                    {message.customizationGroup && (
                      <CustomizationOptionsPanel
                        group={
                          message.customizationGroup
                        }
                        disabled={
                          isLoading ||
                          !isLatestAssistant
                        }
                        onSubmit={
                          handleCustomizationSubmit
                        }
                      />
                    )}

                    {message.bodyTypeGroup && (
                      <BodyTypeOptionsPanel
                        group={
                          message.bodyTypeGroup
                        }
                        disabled={
                          isLoading ||
                          !isLatestAssistant
                        }
                        onSelect={
                          handleBodyTypeSelect
                        }
                      />
                    )}

                    {message.stage ===
  "collect_custom_measurements" &&
  message.requirements && (
    <CustomMeasurementsPanel
      requirements={
        message.requirements
      }
      disabled={
        isLoading ||
        !isLatestAssistant
      }
      onSubmit={
        handleSendMessage
      }
    />
  )}

                    {message.stage ===
                      "discover_technician_date" && (
                      <TechnicianDatePanel
                        disabled={
                          isLoading ||
                          !isLatestAssistant
                        }
                        onSubmit={
                          handleTechnicianDateSubmit
                        }
                      />
                    )}

                    {message.fabricRecommendations &&
                      message
                        .fabricRecommendations
                        .length > 0 && (
                        <div className="space-y-2 pt-1">
                          <p className="pl-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                            Recommended fabrics
                          </p>

                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {message.fabricRecommendations.map(
                              (
                                recommendation,
                              ) => (
                                <FabricRecommendationCard
                                  key={
                                    recommendation
                                      .fabric.id
                                  }
                                  recommendation={
                                    recommendation
                                  }
                                  disabled={
                                    isLoading ||
                                    !isLatestAssistant
                                  }
                                  onSelect={
                                    handleFabricSelect
                                  }
                                />
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {!message.customizationGroup &&
                      !message.bodyTypeGroup &&
                      message.quickReplies &&
                      message.quickReplies
                        .length > 0 && (
                        <div className="flex flex-wrap gap-2 pl-1">
                          {message.quickReplies.map(
                            (
                              quickReply,
                            ) => (
                              <button
                                key={`${message.id}-${quickReply.label}`}
                                type="button"
                                disabled={
                                  isLoading ||
                                  !isLatestAssistant
                                }
                                onClick={() =>
                                  handleQuickReplySelect(
                                    quickReply,
                                  )
                                }
                                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:shadow-none"
                              >
                                {
                                  quickReply.label
                                }
                              </button>
                            ),
                          )}
                        </div>
                      )}

                    {isLatestAssistant && (
                      <SupportActions />
                    )}
                  </div>
                );
              },
            )}

            {isLoading && (
              <ChatMessage
                role="assistant"
                text="Let me find the best options for you..."
              />
            )}

            <div
              ref={messagesEndRef}
            />
          </section>
        )}
      </main>

      <ChatInput
        disabled={isLoading}
        onSendMessage={
          handleSendMessage
        }
      />
    </div>
  );
}

export default App;
