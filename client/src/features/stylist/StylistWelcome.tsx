import { useState } from "react";

const stylistOptions = [
  "Shop Men",
  "Shop Women",
  "Shop Accessories",
  "Shop by Occasion",
  "Explore Fabrics",
  "More Services",
];

const moreServiceOptions = [
  "Virtual Try-On",
  "Measurement Help",
  "Customize Design",
  "Order Support",
  "Corporate Orders",
];

const measurementOptions = [
  "Automated Measurement",
  "Men's Measurement Guide",
  "Women's Measurement Guide",
  "Schedule Technician",
];

const orderSupportOptions = [
  "Track My Order",
  "Delivery Status",
  "Change Delivery Address",
  "Measurement Correction",
  "Return or Rework",
];

const externalLinks: Record<string, string> = {
  "Virtual Try-On":
    "https://tt-virtual-try-on-frontend.vercel.app/",
  "Automated Measurement":
    "https://web.truetoform.fit/send-avatar?clientId=614652",
  "Men's Measurement Guide":
    "https://tech-tailor.com/download/men/mens-body-measurements.pdf",
  "Women's Measurement Guide":
    "https://tech-tailor.com/download/women/womens-body-measurements.pdf",
  "Corporate Orders":
    "https://tech-tailor.com/corporate-orders",
};

type WelcomeView =
  | "main"
  | "services"
  | "measurements"
  | "support";

type StylistWelcomeProps = {
  onOptionSelect: (option: string) => void;
};

function StylistWelcome({
  onOptionSelect,
}: StylistWelcomeProps) {
  const [view, setView] =
    useState<WelcomeView>("main");

  const visibleOptions =
    view === "services"
      ? moreServiceOptions
      : view === "measurements"
        ? measurementOptions
        : view === "support"
          ? orderSupportOptions
          : stylistOptions;

  const heading =
    view === "services"
      ? "How can Tech-Tailor help you?"
      : view === "measurements"
        ? "How can we help with measurements?"
        : view === "support"
          ? "What do you need help with?"
          : "Hi there! What can I help you style today?";

  const handleOptionSelect = (
    option: string,
  ) => {
    if (option === "More Services") {
      setView("services");
      return;
    }

    if (option === "Measurement Help") {
      setView("measurements");
      return;
    }

    if (option === "Order Support") {
      setView("support");
      return;
    }

    const externalLink =
      externalLinks[option];

    if (externalLink) {
      window.open(
        externalLink,
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }

    onOptionSelect(option);
  };

  const handleGoBack = () => {
    setView(
      view === "services"
        ? "main"
        : "services",
    );
  };

  return (
    <section className="mx-auto w-full max-w-3xl px-4 pt-10 text-center sm:pt-12">
      <h1 className="mx-auto max-w-[320px] font-sans text-[22px] font-medium leading-[1.25] text-slate-950 sm:max-w-xl sm:text-[27px]">
        {heading}
      </h1>

      {view === "measurements" && <div className="mx-auto mt-4 max-w-xl space-y-2 text-left text-sm text-slate-600">
        <p><strong>Measure yourself:</strong> Follow the illustrated guide, then enter measurements in inches during your order.</p>
        <p><strong>Automated measurement:</strong> Open the body-scan service and follow its capture instructions.</p>
        <p><strong>Technician visit:</strong> Request a location and date; Tech-Tailor will confirm availability.</p>
        <p><strong>Ready size:</strong> Choose a standard size when the stylist asks for your measurement method.</p>
      </div>}
      <div className="mx-auto mt-5 flex max-w-[340px] flex-wrap justify-center gap-2 sm:max-w-xl sm:gap-2.5">
        {visibleOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() =>
              handleOptionSelect(option)
            }
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:px-5 sm:py-2.5 sm:text-xs"
          >
            {option}
          </button>
        ))}
      </div>

      {view !== "main" && (
        <button
          type="button"
          onClick={handleGoBack}
          className="mt-4 text-xs font-medium text-slate-500 transition hover:text-slate-900"
        >
          Go Back
        </button>
      )}
    </section>
  );
}

export default StylistWelcome;
