import {
  AlertTriangle,
  ExternalLink,
  ShoppingBag,
} from "lucide-react";

import type {
  ProductRecommendation,
} from "../../services/chatApi";

type ProductRecommendationCardProps = {
  recommendation: ProductRecommendation;
  disabled?: boolean;
  showMatchPercentage?: boolean;
  onSelect?: (
    product: ProductRecommendation["product"],
  ) => void;
};

function ProductRecommendationCard({
  recommendation,
  disabled = false,
  showMatchPercentage = true,
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

  const productServiceLabel =
    product.canCustomizeStyle
      ? "Customizable"
      : product.supportsCustomMeasurements
        ? "Made to measure"
        : null;

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

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        isAlternative
          ? "border-amber-200"
          : "border-slate-200"
      }`}
    >
<div className="flex h-full flex-col">
<div className="relative h-36 w-full shrink-0 bg-slate-100">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ShoppingBag
                size={30}
                strokeWidth={1.3}
                className="text-slate-400"
              />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-3.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${
                isAlternative
                  ? "bg-amber-50 text-amber-700"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              {isAlternative && (
                <AlertTriangle
                  size={11}
                  strokeWidth={1.8}
                />
              )}

              {isAlternative
                ? "Closest Alternative"
                : "Stylist Pick"}
            </span>

            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
              {showMatchPercentage
                ? `${matchPercentage}% match`
                : "Best match so far"}
            </span>

            {productServiceLabel && (
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                {productServiceLabel}
              </span>
            )}
          </div>

          <h2 className="mt-2.5 line-clamp-2 text-sm font-semibold leading-snug text-slate-950">
            {product.name}
          </h2>

          <div className="mt-2 flex items-baseline gap-1.5">
            {product.priceIsStartingPrice && (
              <span className="text-[10px] font-medium text-slate-500">
                From
              </span>
            )}

            <span className="text-base font-semibold text-slate-900">
              {formattedPrice}
            </span>

            {product.mrp > product.price && (
              <span className="text-[10px] text-slate-400 line-through">
                {formattedMrp}
              </span>
            )}
          </div>

          {reasons.length > 0 && (
            <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
              {reasons[0]}
            </p>
          )}

          {tailoringMessage && (
            <p className="mt-2 rounded-lg bg-violet-50 px-2.5 py-2 text-[10px] font-medium leading-relaxed text-violet-700">
              {tailoringMessage}
            </p>
          )}

          {product.customizationOptions.length >
            0 && (
            <p className="mt-2 rounded-lg bg-violet-50 px-2.5 py-2 text-[10px] font-medium leading-relaxed text-violet-700">
              Customize: {product.customizationOptions.join(" • ")}
            </p>
          )}

          {isAlternative &&
            warnings.length > 0 && (
              <p className="mt-2 line-clamp-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[10px] leading-relaxed text-amber-700">
                {warnings[0]}
              </p>
            )}

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
            {onSelect && (
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  onSelect(product)
                }
                className="rounded-full bg-slate-900 px-3.5 py-2 text-[11px] font-medium text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {product.canCustomizeStyle
                  ? "Customize Design"
                  : "Select Style"}
              </button>
            )}

            <a
              href={product.productUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-2 text-[11px] font-medium text-slate-700 transition hover:border-slate-300 hover:text-blue-900"
            >
              View

              <ExternalLink
                size={12}
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
