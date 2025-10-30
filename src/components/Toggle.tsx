interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export default function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-sm text-gray-700 font-medium">{label}</span>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-11 h-6 rounded-full transition-colors ${
            checked ? 'bg-[#FF8800]' : 'bg-gray-300'
          }`}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </div>
      </div>
    </label>
  );
}
