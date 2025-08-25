const Divider = ({ text = "or" }) => (
  <div className="flex items-center my-6">
    <div className="flex-1 border-t border-gray-300 dark:border-gray-500"></div>
    <span className="px-4 text-gray-500 dark:text-white text-sm">{text}</span>
    <div className="flex-1 border-t border-gray-300 dark:border-gray-500"></div>
  </div>
);

export default Divider;
