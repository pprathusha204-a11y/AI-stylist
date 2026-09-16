import {
  ExternalLink,
  Sparkles,
} from "lucide-react";

import type {
  FabricRecommendation,
} from "../../services/chatApi";

type FabricRecommendationCardProps = {
  recommendation:
    FabricRecommendation;

  disabled?: boolean;

  onSelect: (
    fabricName: string,
    selectValue: string,
  ) => void;
};

function FabricRecommendationCard({
  recommendation,
  disabled = false,
  onSelect,
}: FabricRecommendationCardProps) {
  const {
    fabric,
    matchPercentage,
    reasons,
    selectValue,
  } = recommendation;

  const formattedPrice =
    fabric.price !== null
      ? new Intl.NumberFormat(
          "en-IN",
          {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          },
        ).format(fabric.price)
      : null;

  const formattedMrp =
    fabric.mrp !== null &&
    fabric.price !== null &&
    fabric.mrp > fabric.price
      ? new Intl.NumberFormat(
          "en-IN",
          {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          },
        ).format(fabric.mrp)
      : null;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={fabric.imageUrl}
          alt={fabric.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 hover:scale-105"
        />

        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-blue-700 shadow-sm">
          <Sparkles size={11} />

          AI Fabric Pick
        </span>

        {matchPercentage > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-slate-900/85 px-2.5 py-1 text-[10px] font-semibold text-white">
            {matchPercentage}% suitable
          </span>
        )}
      </div>

      <div className="flex min-h-52 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
          {fabric.name}
        </h3>

        <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-slate-400">
          SKU: {fabric.sku}
        </p>

        <div className="mt-3">
          {formattedPrice ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">
                {formattedPrice}
              </span>

              {formattedMrp && (
                <span className="text-xs text-slate-400 line-through">
                  {formattedMrp}
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs font-medium text-slate-600">
              Price based on selected garment
            </p>
          )}
        </div>

        <div className="mt-3 space-y-1">
          {reasons
            .slice(0, 2)
            .map((reason) => (
              <p
                key={reason}
                className="text-[11px] leading-relaxed text-slate-500"
              >
                • {reason}
              </p>
            ))}
        </div>

        <div className="mt-auto flex gap-2 pt-4">
          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              onSelect(
                fabric.name,
                selectValue,
              )
            }
            className="flex-1 rounded-full bg-slate-800 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-950 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Select Fabric
          </button>

          <a
            href={fabric.fabricUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`View ${fabric.name}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </article>
  );
}

export default FabricRecommendationCard;