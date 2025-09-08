// Tailwind-only Toggle (accessible, có focus-ring)
export function Toggle({ checked, onChange, disabled = false }) {
  return (
    <label className="inline-flex items-center cursor-pointer select-none">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <div
        className="
          relative h-6 w-11 rounded-full
          bg-gray-300 peer-checked:bg-blue-600
          transition-colors duration-200
          peer-focus-visible:outline peer-focus-visible:outline-2
          peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-600
          peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
          after:content-[''] after:absolute after:top-0.5 after:left-0.5
          after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow
          after:transition-transform after:duration-200
          peer-checked:after:translate-x-5
        "
      />
    </label>
  );
}
