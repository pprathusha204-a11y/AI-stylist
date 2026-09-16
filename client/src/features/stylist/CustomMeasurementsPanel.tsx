import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type {
  CustomerRequirements,
} from "../../services/chatApi";

type CustomMeasurementsPanelProps = {
  requirements: CustomerRequirements;
  disabled?: boolean;
  onSubmit: (message: string) => void;
};

type MeasurementField = {
  key: string;
  label: string;
  savedLabel: string;
};

const trouserFields: MeasurementField[] = [
  {
    key: "trouser-crotch",
    label: "Crotch",
    savedLabel: "Trouser Crotch",
  },
  {
    key: "trouser-cuff",
    label: "Cuff",
    savedLabel: "Trouser Cuff",
  },
  {
    key: "trouser-hips",
    label: "Hips",
    savedLabel: "Trouser Hips",
  },
  {
    key: "trouser-thigh",
    label: "Thigh",
    savedLabel: "Trouser Thigh",
  },
  {
    key: "trouser-length",
    label: "Length",
    savedLabel: "Trouser Length",
  },
];

function getMeasurementFields(
  requirements: CustomerRequirements,
): MeasurementField[] {
  const garmentText = [
    requirements.category,
    requirements.subcategory,
    requirements.selectedProductName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const upperFields: MeasurementField[] = [
    {
      key: "upper-bust",
      label: "Bust",
      savedLabel: "Upper Bust",
    },
    {
      key: "upper-waist",
      label: "Waist",
      savedLabel: "Upper Waist",
    },
    {
      key: "upper-hips",
      label: "Hips",
      savedLabel: "Upper Hips",
    },
    {
      key: "upper",
      label: "Upper",
      savedLabel: "Upper",
    },
    {
      key: "upper-neck",
      label: "Neck",
      savedLabel: "Upper Neck",
    },
    {
      key: "outer-arm",
      label: "Outer Arm",
      savedLabel: "Outer Arm",
    },
    {
      key: "upper-shoulder",
      label: "Shoulder",
      savedLabel: "Upper Shoulder",
    },
    {
      key: "upper-length",
      label: "Length",
      savedLabel: "Upper Length",
    },
    {
      key: "upper-width",
      label: "Width",
      savedLabel: "Upper Width",
    },
    {
      key: "neck-point",
      label: "Neck Point",
      savedLabel: "Neck Point",
    },
  ];

  const isTrouserOnly =
    garmentText.includes("trouser") &&
    !garmentText.includes("suit") &&
    !garmentText.includes("set");

  if (isTrouserOnly) {
    return trouserFields;
  }

  const isUpperOnly =
    [
      "shirt",
      "t-shirt",
      "tshirt",
      "jacket",
      "blazer",
      "overcoat",
    ].some((garment) =>
      garmentText.includes(garment),
    ) &&
    !garmentText.includes("suit") &&
    !garmentText.includes("set");

  if (isUpperOnly) {
    return upperFields;
  }

  return [
    ...upperFields,
    ...trouserFields,
  ];
}
function CustomMeasurementsPanel({
  requirements,
  disabled = false,
  onSubmit,
}: CustomMeasurementsPanelProps) {
  const fields = useMemo(
    () =>
      getMeasurementFields(requirements),
    [requirements],
  );

  const [measurements, setMeasurements] =
    useState<Record<string, string>>({});

  const allMeasurementsEntered =
    fields.every((field) => {
      const value = Number(
        measurements[field.key],
      );

      return (
        Number.isFinite(value) &&
        value > 0 &&
        value < 100
      );
    });

  const audienceText = [
    requirements.department,
    requirements.gender,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const measurementGuideUrl =
    audienceText.includes("women") ||
    audienceText.includes("female")
      ? "https://tech-tailor.com/download/women/womens-body-measurements.pdf"
      : "https://tech-tailor.com/download/men/mens-body-measurements.pdf";

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      disabled ||
      !allMeasurementsEntered
    ) {
      return;
    }

    const measurementMessage =
      fields
        .map((field) => {
          const value = Number(
            measurements[field.key],
          );

          return `${field.savedLabel}=${value}`;
        })
        .join("; ");

    onSubmit(
      `My custom measurements in inches are: ${measurementMessage}`,
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Custom Measurements
          </h3>

          <p className="mt-1 text-[11px] text-slate-500">
            Enter all measurements in inches.
          </p>
        </div>

        <a
          href={measurementGuideUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-medium text-blue-700 hover:text-blue-900"
        >
          View measurement guide
        </a>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {fields.map((field) => (
          <label
            key={field.key}
            className="text-[11px] font-medium text-slate-700"
          >
            {field.label}

            <div className="mt-1 flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-blue-400 focus-within:bg-white">
              <input
                type="number"
                min="1"
                max="99.9"
                step="0.1"
                inputMode="decimal"
                required
                disabled={disabled}
                value={
                  measurements[field.key] ?? ""
                }
                onChange={(event) =>
                  setMeasurements(
                    (current) => ({
                      ...current,
                      [field.key]:
                        event.target.value,
                    }),
                  )
                }
                className="min-w-0 flex-1 bg-transparent py-2 text-xs text-slate-900 outline-none disabled:cursor-not-allowed"
              />

              <span className="ml-1 text-[10px] text-slate-400">
                in
              </span>
            </div>
          </label>
        ))}
      </div>

      <button
        type="submit"
        disabled={
          disabled ||
          !allMeasurementsEntered
        }
        className="mt-4 rounded-full bg-slate-900 px-5 py-2 text-xs font-medium text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Save Measurements
      </button>
    </form>
  );
}

export default CustomMeasurementsPanel;
