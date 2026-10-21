export default function SettingToggle({ label, description, checked, onChange, disabled = false }) {
  return (
    <label className={`settings-toggle ${disabled ? 'is-disabled' : ''}`}>
      <span className="settings-toggle-copy">
        <span className="settings-toggle-title">{label}</span>
        {description && <span className="settings-toggle-description">{description}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="settings-toggle-checkbox"
      />
    </label>
  );
}
