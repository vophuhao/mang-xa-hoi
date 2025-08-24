import { useState } from "react";

export default function MessagePanel() {
  const [selectedChat, setSelectedChat] = useState(null);

  const chats = [
    { id: 1, name: "Nguyễn Văn A", last: "Hello bạn 👋" },
    { id: 2, name: "Lê Thị B", last: "Mai đi chơi nha" },
    { id: 3, name: "Phạm Văn C", last: "Gửi file giúp mình" },
  ];

  return (
    <div className="h-full flex">
      {/* Danh sách chat */}
      <div className="w-60 border-r">
        <div className="p-4 font-bold border-b">Tin nhắn</div>
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => setSelectedChat(chat)}
            className={`flex items-center p-3 space-x-3 cursor-pointer hover:bg-gray-100 
              ${selectedChat?.id === chat.id ? "bg-gray-200" : ""}`}
          >
            <img
              src={`https://i.pravatar.cc/40?img=${chat.id + 30}`}
              alt={chat.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="font-medium">{chat.name}</p>
              <p className="text-xs text-gray-500">{chat.last}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Khung chat */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="p-4 border-b font-bold">{selectedChat.name}</div>
            <div className="flex-1 p-4 space-y-2 overflow-y-auto">
              <div className="self-start bg-gray-200 px-3 py-2 rounded-xl w-fit">Hello</div>
              <div className="self-end bg-blue-500 text-white px-3 py-2 rounded-xl w-fit">Hi bạn</div>
            </div>
            <div className="p-3 border-t flex space-x-2">
              <input
                type="text"
                placeholder="Nhắn tin..."
                className="flex-1 rounded-xl border px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
              <button className="px-4 py-2 bg-blue-500 text-white rounded-xl">Gửi</button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center flex-1 text-gray-500">
            Chọn một đoạn chat để bắt đầu
          </div>
        )}
      </div>
    </div>
  );
}
