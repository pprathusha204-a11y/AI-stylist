import type {
  BodyTypeGroup,
  BodyTypeOption,
} from "../../services/chatApi";

type BodyTypeOptionsPanelProps = {
  group: BodyTypeGroup;
  disabled?: boolean;

  onSelect: (
    option: BodyTypeOption,
  ) => void;
};

function BodyTypeOptionsPanel({
  group,
  disabled = false,
  onSelect,
}: BodyTypeOptionsPanelProps) {
  return (
    <div className="space-y-2 pt-1">
      <p className="pl-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
        {group.title}
      </p>

      <div className="grid grid-cols-3 gap-2">
        {group.options.map(
          (option) => (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() =>
                onSelect(option)
              }
              className="overflow-hidden rounded-xl border border-slate-200 bg-white text-center transition hover:border-slate-500 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="h-32 bg-slate-50 sm:h-40">
                <img
                  src={option.imageUrl}
                  alt={option.name}
                  loading="lazy"
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="p-2">
                <p className="text-[11px] font-semibold text-slate-900 sm:text-xs">
                  {option.name}
                </p>

                <p className="mt-1 hidden text-[9px] leading-relaxed text-slate-500 sm:line-clamp-2 sm:block">
                  {option.description}
                </p>
              </div>
            </button>
          ),
        )}
      </div>
    </div>
  );
}

export default BodyTypeOptionsPanel;