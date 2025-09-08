export default function SearchPanel() {
  return (
    <div className="h-full rounded-lg border-r border-gray-200/60">
      <div className="px-6 py-5 text-2xl font-semibold text-gray-800">
        Tìm kiếm
      </div>

      {/* Ô input */}
      <div className="border-b border-gray-200/60 p-4">
        <input
          type="text"
          placeholder="Tìm kiếm"
          className="w-full rounded-xl border border-gray-300/50 px-3 py-2 focus:ring-1 focus:ring-gray-400 focus:outline-none"
        />
      </div>

      {/* Tiêu đề */}
      <div className="p-4 text-sm text-gray-500">Gần đây</div>

      {/* Danh sách gợi ý */}
      <div className="space-y-3 px-4">
        {["nguyenvan_a", "lethib", "phamvan_c"].map((user, i) => (
          <div
            key={i}
            className="flex cursor-pointer items-center space-x-3 rounded-lg p-2 transition hover:bg-gray-100"
          >
            <img
              src={`https://i.pravatar.cc/40?img=${i + 10}`}
              alt={user}
              className="h-10 w-10 rounded-full"
            />
            <div>
              <p className="font-medium">{user}</p>
              <p className="text-xs text-gray-500">Tên hiển thị</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
