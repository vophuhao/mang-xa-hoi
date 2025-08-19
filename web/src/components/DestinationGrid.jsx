import { useState } from "react";

const Destinations = [
  // Danh sách tổng (ví dụ 20 items)
  { name: "Bali", img: "link1" },
  { name: "Bangkok", img: "link2" },
  { name: "Cancun", img: "link3" },
  { name: "Nha Trang", img: "link4" },
  { name: "Da Nang", img: "link5" },
  { name: "Tokyo", img: "link6" },
  { name: "Paris", img: "link7" },
  { name: "Rome", img: "link8" },
  { name: "New York", img: "link9" },
  { name: "Seoul", img: "link10" },
  { name: "Singapore", img: "link11" },
  { name: "London", img: "link12" },
  // Thêm tiếp nếu muốn
];

export default function DestinationGrid() {
  const [visibleCount, setVisibleCount] = useState(8); // 4 hàng đầu (4x4)

  const visibleDestinations = Destinations.slice(0, visibleCount);
  const hasMore = visibleCount < Destinations.length;

  const handleShowMore = () => {
    setVisibleCount(prev => prev + 8);
  };

  return (
    <section className="px-30 py-12">
      <h3 className="text-3xl md:text-4xl font-bold  mb-8">
        Top Destination 
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {visibleDestinations.map((item, idx) => (
          <div key={idx} className="bg-white rounded-xl overflow-hidden shadow-md">
            <img src={item.img} alt={item.name} className="h-48 w-full object-cover" />
            <div className="p-4">
              <h3 className="text-lg font-semibold">{item.name}</h3>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={handleShowMore}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
          >
            Xem thêm
          </button>
        </div>
      )}
    </section>
  );
}
