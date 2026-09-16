import {
  useEffect,
  useState,
} from "react";

import type {
  CustomizationGroup,
  CustomizationOption,
} from "../../services/chatApi";

import CustomizationOptionCard from "./CustomizationOptionCard";

type CustomizationOptionsPanelProps = {
  group: CustomizationGroup;
  disabled?: boolean;

  onSubmit: (
    options: CustomizationOption[],
  ) => void;
};

function CustomizationOptionsPanel({
  group,
  disabled = false,
  onSubmit,
}: CustomizationOptionsPanelProps) {
  const [selectedOptions, setSelectedOptions] =
    useState<CustomizationOption[]>([]);

  const isMultiple =
    group.selectionType === "multiple";

  useEffect(() => {
    setSelectedOptions([]);
  }, [group.id]);

  const handleOptionSelect = (
    option: CustomizationOption,
  ) => {
    if (!isMultiple) {
      onSubmit([option]);
      return;
    }

    setSelectedOptions(
      (currentOptions) => {
        const isSelected =
          currentOptions.some(
            (currentOption) =>
              currentOption.id === option.id,
          );

        if (isSelected) {
          return currentOptions.filter(
            (currentOption) =>
              currentOption.id !== option.id,
          );
        }

        return [
          ...currentOptions,
          option,
        ];
      },
    );
  };

  return (
    <div className="space-y-3">
      <p className="pl-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
        {group.name}
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {group.options.map(
          (option) => (
            <CustomizationOptionCard
              key={`${group.id}-${option.id}`}
              option={option}
              disabled={disabled}
              selected={selectedOptions.some(
                (selectedOption) =>
                  selectedOption.id ===
                  option.id,
              )}
              onSelect={
                handleOptionSelect
              }
            />
          ),
        )}
      </div>

      {isMultiple && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={
              disabled ||
              selectedOptions.length === 0
            }
            onClick={() =>
              onSubmit(selectedOptions)
            }
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Continue
            {selectedOptions.length > 0
              ? ` (${selectedOptions.length})`
              : ""}
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onSubmit([])}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            No additional option
          </button>
        </div>
      )}
    </div>
  );
}

export default CustomizationOptionsPanel;