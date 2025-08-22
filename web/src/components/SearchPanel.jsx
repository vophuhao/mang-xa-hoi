export default function SearchPanel() {
  return (


    <div className="h-full  border-r border-gray-200/60 bg-white rounded-lg">
      <div className="px-6 py-5 text-2xl font-semibold text-gray-800 ">
        Tìm kiếm
      </div>

      {/* Ô input */}
      <div className="p-4 border-b border-gray-200/60">
        <input
          type="text"
          placeholder="Tìm kiếm"
          className="w-full rounded-xl border border-gray-300/50 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
      </div>

      {/* Tiêu đề */}
      <div className="p-4 text-sm text-gray-500">Gần đây</div>

      {/* Danh sách gợi ý */}
      <div className="px-4 space-y-3">
        {["nguyenvan_a", "lethib", "phamvan_c"].map((user, i) => (
          <div
            key={i}
            className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition"
          >
            <img
              src={`https://i.pravatar.cc/40?img=${i + 10}`}
              alt={user}
              className="w-10 h-10 rounded-full"
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
