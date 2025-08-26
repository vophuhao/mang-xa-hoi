import { useState } from "react";

const FloatingInput = ({
  type = "text",
  id,
  value,
  onChange,
  label,
  required = false,
  onKeyDown,
  className = "",
  showPasswordToggle = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = showPasswordToggle
    ? showPassword
      ? "text"
      : "password"
    : type;

  const togglePassword = () => setShowPassword(!showPassword);

  return (
    <div className={`relative w-full ${className}`}>
      <input
        type={inputType}
        id={id}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder=" "
        required={required}
        className="peer w-full rounded-2xl border border-white/30 bg-white/20 px-4 pt-6 pb-2 text-gray-800 transition-all duration-300 focus:border-transparent focus:ring-2 focus:ring-pink-200 focus:outline-none dark:border-white/20 dark:bg-white/10 dark:text-white"
        {...props}
      />
      <label
        htmlFor={id}
        className="absolute top-2 left-4 text-sm text-gray-500 transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-2 peer-focus:text-sm dark:text-gray-300 dark:peer-placeholder-shown:text-white"
      >
        {label}
      </label>

      {showPasswordToggle && (
        <button
          type="button"
          onClick={togglePassword}
          className="absolute top-1/2 right-3 -translate-y-1/2 p-2 text-gray-500 transition-colors duration-200 dark:text-white"
          aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        >
          {showPassword ? (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
              />
            </svg>
          )}
        </button>
      )}
    </div>
  );
};

export default FloatingInput;
