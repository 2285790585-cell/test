import { monthIndexToIso, TIMELINE_MONTH_COUNT } from "../lib/dates";

type Props = {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  truthIndex?: number | null;
  mode?: "pick" | "result";
};

export function TimeSlider({
  value,
  onChange,
  disabled,
  truthIndex,
  mode,
}: Props) {
  return (
    <div className="time-slider">
      <div className="time-slider__row">
        <span className="muted">1934-10</span>
        <span className="time-slider__current">{monthIndexToIso(value)}</span>
        <span className="muted">1936-10</span>
      </div>
      <input
        className="time-slider__input"
        type="range"
        min={0}
        max={TIMELINE_MONTH_COUNT - 1}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
      />
      {mode === "result" && typeof truthIndex === "number" ? (
        <div className="time-slider__truth">
          正确月份：<strong>{monthIndexToIso(truthIndex)}</strong>
        </div>
      ) : null}
    </div>
  );
}
