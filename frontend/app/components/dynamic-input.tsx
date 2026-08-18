interface UniversalInputProps {
  label: string;
  placeholder: string;
  value: string;
  error?: string;
  type?: string;
  onChange: (value: string) => void;
}

export default function UniversalInput({
  label,
  placeholder,
  value,
  error,
  type = "text",
  onChange,
}: UniversalInputProps) {
  return (
    <div className="w-full">
      <label className="text-white text-sm sm:text-base">{label}</label>

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-2 px-4 py-3 rounded-full bg-white/10 
                   border border-white/20 text-white outline-none"
      />

      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  );
}
