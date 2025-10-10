const ProgressBar = ({ progress, isVisible = true, className = "" }) => {
  if (!isVisible) return null;

  return (
    <div className={`h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 ${className}`}>
      <div
        className="h-2 rounded-full bg-blue-500 transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
};

export default ProgressBar;
