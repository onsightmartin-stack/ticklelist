import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DatePrecision } from "@/lib/peak-catalog";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface Props {
  id?: string;
  label?: string;
  /** ISO date string (YYYY-MM-DD) or "" when unknown. */
  value: string;
  precision: DatePrecision;
  onChange: (value: string, precision: DatePrecision) => void;
  hint?: string;
}

/**
 * Date field with three levels of memory: exact date, month & year, or year only.
 * Year is a free text field so you can type it digit by digit.
 */
const PrecisionDateInput = ({
  id = "precision-date",
  label = "Date",
  value,
  precision,
  onChange,
  hint = "Don't remember the exact day? Log the month and year, or just the year.",
}: Props) => {
  const [year, setYear] = useState(value ? value.slice(0, 4) : "");
  const [month, setMonth] = useState(value ? value.slice(5, 7) : "");

  // Keep local parts in sync when the parent resets or loads a value.
  useEffect(() => {
    setYear(value ? value.slice(0, 4) : "");
    setMonth(value ? value.slice(5, 7) : "");
  }, [value]);

  const emit = (nextYear: string, nextMonth: string, nextPrecision: DatePrecision) => {
    if (nextYear.length !== 4) {
      onChange("", nextPrecision);
      return;
    }
    const mm = nextPrecision === "year" ? "01" : nextMonth || "01";
    onChange(`${nextYear}-${mm}-01`, nextPrecision);
  };

  const changePrecision = (next: DatePrecision) => {
    if (next === "day") {
      // Nothing reliable to carry over — let the user pick a real date.
      onChange(value && value.length === 10 ? value : "", next);
      return;
    }
    emit(year, month, next);
  };

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {precision === "day" ? (
          <Input
            id={id}
            type="date"
            className="flex-1 min-w-[10rem]"
            value={value}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => onChange(e.target.value, "day")}
          />
        ) : (
          <>
            {precision === "month" && (
              <select
                aria-label="Month"
                value={month}
                onChange={(e) => { setMonth(e.target.value); emit(year, e.target.value, "month"); }}
                className="h-10 rounded-md border border-input bg-background px-2 text-sm flex-1 min-w-[8rem]"
              >
                <option value="">Month…</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>
                ))}
              </select>
            )}
            <Input
              id={id}
              type="text"
              inputMode="numeric"
              maxLength={4}
              className="w-24"
              placeholder="Year"
              value={year}
              onChange={(e) => {
                const next = e.target.value.replace(/\D/g, "").slice(0, 4);
                setYear(next);
                emit(next, month, precision);
              }}
            />
          </>
        )}
        <select
          aria-label="How exact is the date?"
          value={precision}
          onChange={(e) => changePrecision(e.target.value as DatePrecision)}
          className="h-10 rounded-md border border-input bg-background px-2 text-sm shrink-0"
        >
          <option value="day">Exact date</option>
          <option value="month">Month &amp; year</option>
          <option value="year">Year only</option>
        </select>
      </div>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
};

export default PrecisionDateInput;
