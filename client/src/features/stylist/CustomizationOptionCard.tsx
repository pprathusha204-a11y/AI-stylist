import type {
  CustomizationOption,
} from "../../services/chatApi";

type CustomizationOptionCardProps = {
  option: CustomizationOption;
  selected?: boolean;
  disabled?: boolean;

  onSelect: (
    option: CustomizationOption,
  ) => void;
};

function CustomizationOptionCard({
  option,
  selected = false,
  disabled = false,
  onSelect,
}: CustomizationOptionCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(option)}
      className={`overflow-hidden rounded-xl border bg-white text-left transition ${
        selected
          ? "border-slate-900 ring-1 ring-slate-900"
          : "border-slate-200 hover:border-slate-400"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <div className="h-28 overflow-hidden bg-slate-100 sm:h-32">
        {option.imageUrl ? (
          <img
            src={option.imageUrl}
            alt={option.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-3 text-center text-[10px] text-slate-400">
            Preview unavailable
          </div>
        )}
      </div>

      <div className="flex min-h-12 items-center justify-between gap-2 p-2.5">
        <p className="text-[11px] font-semibold leading-snug text-slate-800">
          {option.name}
        </p>

        <span
          className={`h-3.5 w-3.5 shrink-0 rounded-full border ${
            selected
              ? "border-slate-900 bg-slate-900"
              : "border-slate-300"
          }`}
          aria-hidden="true"
        />
      </div>
    </button>
  );
}

export default CustomizationOptionCard;