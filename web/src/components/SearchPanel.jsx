export default function SearchPanel() {
  return (
    <div className="h-full border-r bg-white">
      <div className="p-4 border-b">
        <input
          type="text"
          placeholder="Tìm kiếm"
          className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
      </div>

      <div className="p-4 text-sm text-gray-500">Gần đây</div>

      <div className="px-4 space-y-3">
        {["nguyenvan_a", "lethib", "phamvan_c"].map((user, i) => (
          <div key={i} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 p-2 rounded-lg">
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
