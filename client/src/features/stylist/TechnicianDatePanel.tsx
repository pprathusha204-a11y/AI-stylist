import {
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  ArrowRight,
  CalendarDays,
} from "lucide-react";

type TechnicianDatePanelProps = {
  disabled?: boolean;
  onSubmit: (date: string) => void;
};

function formatDateInput(
  value: string,
): string {
  const digits = value
    .replace(/\D/g, "")
    .slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function isValidVisitDate(
  value: string,
): boolean {
  const match = value.match(
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
  );

  if (!match) {
    return false;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const selectedDate = new Date(
    year,
    month - 1,
    day,
  );

  const isRealDate =
    selectedDate.getFullYear() === year &&
    selectedDate.getMonth() ===
      month - 1 &&
    selectedDate.getDate() === day;

  if (!isRealDate) {
    return false;
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return selectedDate >= today;
}

function getTodayIsoDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(
    today.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    today.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDisplayDateFromIso(
  isoDate: string,
): string {
  const [year, month, day] =
    isoDate.split("-");

  if (!year || !month || !day) {
    return "";
  }

  return `${day}/${month}/${year}`;
}

function getIsoDateFromDisplay(
  displayDate: string,
): string {
  const match = displayDate.match(
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
  );

  if (!match) {
    return "";
  }

  return `${match[3]}-${match[2]}-${match[1]}`;
}

function TechnicianDatePanel({
  disabled = false,
  onSubmit,
}: TechnicianDatePanelProps) {
  const [date, setDate] =
    useState("");

  const [showError, setShowError] =
    useState(false);

  const calendarInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const dateIsValid =
    isValidVisitDate(date);

  const openCalendar = () => {
    if (disabled) {
      return;
    }

    const calendarInput =
      calendarInputRef.current;

    if (!calendarInput) {
      return;
    }

    try {
      calendarInput.showPicker();
    } catch {
      calendarInput.click();
    }
  };

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (disabled || !dateIsValid) {
      setShowError(true);

      return;
    }

    onSubmit(date);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <label
        htmlFor="technician-visit-date"
        className="text-xs font-semibold text-slate-900"
      >
        Preferred visit date
      </label>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <div
          className={`flex min-w-0 flex-1 items-center rounded-xl border bg-slate-50 px-3 transition focus-within:bg-white ${
            showError && !dateIsValid
              ? "border-red-300 focus-within:border-red-400"
              : "border-slate-200 focus-within:border-blue-400"
          }`}
        >
          <div className="relative shrink-0">
            <button
              type="button"
              disabled={disabled}
              onClick={openCalendar}
              aria-label="Choose visit date from calendar"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
            >
              <CalendarDays
                size={17}
                strokeWidth={1.7}
              />
            </button>

            <input
              ref={calendarInputRef}
              type="date"
              min={getTodayIsoDate()}
              value={
                getIsoDateFromDisplay(date)
              }
              onChange={(event) => {
                setDate(
                  getDisplayDateFromIso(
                    event.target.value,
                  ),
                );

                setShowError(false);
              }}
              tabIndex={-1}
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 h-8 w-8 opacity-0"
            />
          </div>

          <input
            id="technician-visit-date"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={10}
            disabled={disabled}
            value={date}
            onChange={(event) => {
              setDate(
                formatDateInput(
                  event.target.value,
                ),
              );

              setShowError(false);
            }}
            placeholder="DD/MM/YYYY"
            aria-invalid={
              showError && !dateIsValid
            }
            className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
          />
        </div>

        <button
          type="submit"
          disabled={disabled}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-5 py-3 text-xs font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Continue

          <ArrowRight
            size={14}
            strokeWidth={1.9}
          />
        </button>
      </div>

      <p
        className={`mt-2 text-[11px] ${
          showError && !dateIsValid
            ? "text-red-600"
            : "text-slate-500"
        }`}
      >
        {showError && !dateIsValid
          ? "Enter a valid current or future date in DD/MM/YYYY format."
          : "Enter the date in DD/MM/YYYY format."}
      </p>
    </form>
  );
}

export default TechnicianDatePanel;
