
export default function SettingToggle({ label, description, checked, onChange, disabled = false }) {
  return (
    <label
      className={`flex items-center justify-between gap-4 rounded-lg border border-gray-800 p-3 ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      }`}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-gray-100">
          {label}
        </span>
        {description && (
          <span className="mt-1 block text-xs leading-5 text-gray-400">
            {description}
          </span>
        )}
      </span>

      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 shrink-0 accent-blue-500"
      />
    </label>
  );
}

