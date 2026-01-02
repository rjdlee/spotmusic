"use client";

type SwitchToggleProps = {
  label: string;
  isOn: boolean;
  onToggle: () => void;
  disabled?: boolean;
  ariaLabel?: string;
};

export default function SwitchToggle({
  label,
  isOn,
  onToggle,
  disabled = false,
  ariaLabel,
}: SwitchToggleProps) {
  return (
    <button
      type="button"
      className="mixer-switch"
      data-state={isOn ? "on" : "off"}
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={isOn}
      aria-label={ariaLabel ?? label}
    >
      <span className="mixer-switch__label">{label}</span>
    </button>
  );
}
