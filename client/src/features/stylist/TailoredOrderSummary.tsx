import type {
  CustomerRequirements,
} from "../../services/chatApi";

type TailoredOrderSummaryProps = {
  requirements: CustomerRequirements;
};

function getBodyBuildLabel(
  bodyType: string,
): string {
  const labels: Record<string, string> = {
    ectomorph: "Slim Build",
    mesomorph: "Athletic Build",
    endomorph: "Broad Build",
  };

  return (
    labels[bodyType.toLowerCase()] ??
    bodyType
  );
}

function TailoredOrderSummary({
  requirements,
}: TailoredOrderSummaryProps) {
  const styleChoices = [
    ["Lapel", requirements.lapelStyle],
    [
      "Shoulder",
      requirements.shoulderStyle,
    ],
    ["Closure", requirements.buttonStyle],
    ["Vent", requirements.ventType],
    ["Blazer", requirements.blazerOptions],
    [
      "Trouser",
      requirements.trouserStyle,
    ],
    [
      "Waistband",
      requirements.trouserWaistbandStyle,
    ],
  ].filter(
    (
      choice,
    ): choice is [string, string] =>
      Boolean(choice[1]),
  );

  const measurementMethod =
    requirements.measurementMethod
      ?.toLowerCase() ?? "";

  const usesReadySize =
    measurementMethod.includes("ready");

  const usesCustomMeasurements =
    measurementMethod.includes("custom");

  const usesAutomatedMeasurements =
    measurementMethod.includes(
      "automated",
    );

  const schedulesTechnician =
    measurementMethod.includes(
      "technician",
    ) ||
    measurementMethod.includes(
      "schedule",
    );

  const measurementDetails = [
    [
      "Method",
      requirements.measurementMethod,
    ],
    [
      "Height",
      usesReadySize
        ? requirements.heightProfile
        : null,
    ],
    [
      "Body build",
      usesReadySize &&
      !requirements.fit &&
      requirements.bodyType
        ? getBodyBuildLabel(
            requirements.bodyType,
          )
        : null,
    ],
    [
      "Size",
      usesReadySize
        ? requirements.readySize
        : null,
    ],
    [
      "City",
      schedulesTechnician
        ? requirements.technicianCity
        : null,
    ],
    [
      "Preferred date",
      schedulesTechnician
        ? requirements.technicianDate
        : null,
    ],
  ].filter(
    (
      detail,
    ): detail is [string, string] =>
      Boolean(detail[1]),
  );

  const customMeasurementEntries =
    Object.entries(
      requirements.customMeasurements ??
        {},
    );

  const productUrl =
    requirements.selectedProductId !== null
      ? `https://tech-tailor.com/shop/product/${requirements.selectedProductId}`
      : null;

  const automatedMeasurementsUrl =
    "https://web.truetoform.fit/send-avatar?clientId=614652";

  const actionUrl =
    usesAutomatedMeasurements
      ? automatedMeasurementsUrl
      : productUrl;

  const actionLabel =
    usesAutomatedMeasurements
      ? "Start Automated Measurement"
      : schedulesTechnician
        ? "Schedule Technician"
        : "Continue on Tech-Tailor";

  const actionNote =
    usesCustomMeasurements
      ? "Your measurements are saved in this summary. Confirm them with Tech-Tailor before checkout."
      : usesAutomatedMeasurements
        ? "Complete the secure body scan to capture your measurements."
        : schedulesTechnician
          ? "Tech-Tailor will confirm the available visit time before the appointment."
          : "Confirm these choices on the product page before checkout.";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        Your selection
      </p>

      <h3 className="mt-1 text-base font-semibold text-slate-950">
        {requirements.selectedProductName ??
          "Tailored garment"}
      </h3>

      <div className="mt-3 flex flex-wrap gap-2">
        {requirements.fabric && (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-medium text-blue-700">
            Fabric: {requirements.fabric}
          </span>
        )}

        {requirements.fit && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-700">
            {requirements.fit} fit
          </span>
        )}

        {requirements.colour && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-700">
            {requirements.colour}
          </span>
        )}
      </div>

      {styleChoices.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-800">
            Style
          </p>

          <div className="mt-2 grid gap-x-4 gap-y-2 sm:grid-cols-2">
            {styleChoices.map(
              ([label, value]) => (
                <p
                  key={label}
                  className="text-[11px] text-slate-600"
                >
                  <span className="font-medium text-slate-800">
                    {label}:
                  </span>{" "}
                  {value}
                </p>
              ),
            )}
          </div>
        </div>
      )}

      {measurementDetails.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="text-xs font-semibold text-slate-800">
            Measurements
          </p>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {measurementDetails.map(
              ([label, value]) => (
                <p
                  key={label}
                  className="text-[11px] text-slate-600"
                >
                  <span className="font-medium text-slate-800">
                    {label}:
                  </span>{" "}
                  {value}
                </p>
              ),
            )}
          </div>
        </div>
      )}

      {customMeasurementEntries.length >
        0 && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="text-xs font-semibold text-slate-800">
            Custom Measurements
          </p>

          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            {customMeasurementEntries.map(
              ([label, value]) => (
                <p
                  key={label}
                  className="text-[11px] text-slate-600"
                >
                  <span className="font-medium text-slate-800">
                    {label}:
                  </span>{" "}
                  {value} in
                </p>
              ),
            )}
          </div>
        </div>
      )}

      {actionUrl && (
        <div className="mt-4">
          <a
            href={actionUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-900"
          >
            {actionLabel}
          </a>

          <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
            {actionNote}
          </p>
        </div>
      )}
    </article>
  );
}

export default TailoredOrderSummary;