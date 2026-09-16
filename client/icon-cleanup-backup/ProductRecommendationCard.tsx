import {
  AlertTriangle,
  ExternalLink,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

import type {
  ProductRecommendation,
} from "../../services/chatApi";

type ProductRecommendationCardProps = {
  recommendation: ProductRecommendation;
  disabled?: boolean;
  onSelect?: (
    product: ProductRecommendation["product"],
  ) => void;
};

function ProductRecommendationCard({
  recommendation,
  disabled = false,
  onSelect,
}: ProductRecommendationCardProps) {
  const {
    product,
    matchPercentage,
    matchType,
    reasons,
    warnings,
    tailoringMessage,
  } = recommendation;

  const isAlternative =
    matchType === "alternative";

  const isCustomizable =
    product.canChangeFabric ||
    product.canCustomizeStyle ||
    product.supportsCustomMeasurements;

  const formattedPrice =
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(product.price);

  const formattedMrp =
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(product.mrp);

  const tailoringCapabilities = [
    product.canChangeFabric
      ? "Choose fabric"
      : null,

    product.canCustomizeStyle
      ? "Customize style"
      : null,

    product.supportsReadyMade
      ? "Ready size"
      : null,

    product.supportsCustomMeasurements
      ? "Custom measurements"
      : null,

    product.supportsTechnicianVisit
      ? "Technician visit"
      : null,
  ].filter(
    (capability): capability is string =>
      capability !== null,
  );

  const showDefaultFabric =
    Boolean(product.fabric) &&
    !product.fabric
      .toLowerCase()
      .includes("choose other fabric");

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        isAlternative
          ? "border-amber-200"
          : "border-blue-100"
      }`}
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative h-56 w-full shrink-0 bg-slate-100 sm:h-auto sm:min-h-56 sm:w-48">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-40 items-center justify-center">
              <ShoppingBag
                size={38}
                strokeWidth={1.3}
                className="text-slate-400"
              />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                isAlternative
                  ? "bg-amber-50 text-amber-700"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              {isAlternative ? (
                <AlertTriangle
                  size={11}
                  strokeWidth={1.8}
                />
              ) : (
                <Sparkles
                  size={11}
                  strokeWidth={1.8}
                />
              )}

              {isAlternative
                ? "Closest Alternative"
                : "AI Stylist Pick"}
            </span>

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
              {matchPercentage}% match
            </span>

            {isCustomizable && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                Tailored for you
              </span>
            )}
          </div>

          <h2 className="mt-3 text-base font-semibold leading-snug text-slate-950">
            {product.name}
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            {product.subcategory}
            {product.subSubcategory
              ? ` • ${product.subSubcategory}`
              : ""}
          </p>

          <div className="mt-3">
            {product.priceIsStartingPrice && (
              <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                Starting from
              </p>
            )}

            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold text-slate-900">
                {formattedPrice}
              </span>

              {product.mrp > product.price && (
                <span className="text-xs text-slate-400 line-through">
                  {formattedMrp}
                </span>
              )}
            </div>
          </div>

          {showDefaultFabric && (
            <p className="mt-1 text-xs text-slate-500">
              Default fabric: {product.fabric}
            </p>
          )}

          {tailoringMessage && (
            <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
              <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-emerald-800">
                <Sparkles
                  size={13}
                  strokeWidth={1.8}
                  className="mt-0.5 shrink-0"
                />

                {tailoringMessage}
              </p>
            </div>
          )}

          {tailoringCapabilities.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tailoringCapabilities.map(
                (capability) => (
                  <span
                    key={capability}
                    className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-medium text-blue-700"
                  >
                    {capability}
                  </span>
                ),
              )}
            </div>
          )}

          {reasons.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {reasons
                .slice(0, 3)
                .map((reason) => (
                  <span
                    key={reason}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] leading-relaxed text-slate-600"
                  >
                    {reason}
                  </span>
                ))}
            </div>
          )}

          {isAlternative &&
            warnings.length > 0 && (
              <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800">
                  <AlertTriangle
                    size={13}
                    strokeWidth={1.8}
                  />

                  What differs
                </p>

                <ul className="mt-1.5 space-y-1">
                  {warnings
                    .slice(0, 3)
                    .map(
                      (
                        warning,
                        index,
                      ) => (
                        <li
                          key={`${warning}-${index}`}
                          className="text-[10px] leading-relaxed text-amber-700"
                        >
                          • {warning}
                        </li>
                      ),
                    )}
                </ul>
              </div>
            )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {onSelect && (
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  onSelect(product)
                }
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Sparkles
                  size={13}
                  strokeWidth={1.8}
                />

                Select This Style
              </button>
            )}

            <a
              href={product.productUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:text-blue-900"
            >
              View Product

              <ExternalLink
                size={13}
                strokeWidth={1.8}
              />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

export default ProductRecommendationCard;