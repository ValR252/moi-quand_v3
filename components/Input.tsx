/**
 * Input simple (UI Designer)
 */

export function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
}: {
  label?: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  error?: string
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`
          w-full px-4 py-2.5 rounded-xl
          bg-white/50 dark:bg-gray-800/50
          border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}
          backdrop-blur-sm
          focus:outline-none focus:ring-2 focus:ring-indigo-500
          transition-all
        `}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium mb-2">{label}</label>}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="
          w-full px-4 py-2.5 rounded-xl
          bg-white/50 dark:bg-gray-800/50
          border border-gray-300 dark:border-gray-700
          backdrop-blur-sm
          focus:outline-none focus:ring-2 focus:ring-indigo-500
          transition-all
        "
      />
    </div>
  )
}
