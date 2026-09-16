import {
  ExternalLink,
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

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="relative h-28 overflow-hidden bg-slate-100 sm:h-32">
        <img
          src={fabric.imageUrl}
          alt={fabric.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />

        {matchPercentage > 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-slate-900/85 px-2 py-0.5 text-[9px] font-semibold text-white">
            {matchPercentage}% suitable
          </span>
        )}
      </div>

      <div className="flex min-h-32 flex-col p-3">
        <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-slate-900">
          {fabric.name}
        </h3>

        <p className="mt-1 text-[10px] font-medium text-slate-600">
          {formattedPrice ??
            "Price with selected garment"}
        </p>

        {reasons[0] && (
          <p className="mt-1.5 line-clamp-1 text-[10px] text-slate-500">
            {reasons[0]}
          </p>
        )}

        <div className="mt-auto flex items-center gap-2 pt-3">
          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              onSelect(
                fabric.name,
                selectValue,
              )
            }
            className="flex-1 rounded-full bg-slate-900 px-3 py-1.5 text-[10px] font-medium text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Select Fabric
          </button>

          <a
            href={fabric.fabricUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`View ${fabric.name}`}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-blue-900"
          >
            <ExternalLink
              size={12}
              strokeWidth={1.8}
            />
          </a>
        </div>
      </div>
    </article>
  );
}

export default FabricRecommendationCard;