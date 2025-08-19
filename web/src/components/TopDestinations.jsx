export default function TopDestinations() {
  const destinations = [
    {
      name: "Bali",
      desc: "Discover the Bali with our special tours",
      image: "https://travelwp.physcode.com/main-demo/wp-content/uploads/sites/7/2023/07/phuket.png"
    },
    {
      name: "Bangkok",
      desc: "Visit Thailand's stunning temples",
      image: "https://travelwp.physcode.com/main-demo/wp-content/uploads/sites/7/2023/07/Tokyo.png"
    },
    {
      name: "Cancun",
      desc: "Relax on the Mexican beaches",
      image: "https://media.timeout.com/images/105211701/750/422/image.jpg"
    },
    {
      name: "Nha Trang",
      desc: "Explore Vietnam’s coastal city",
      image: "https://travelwp.physcode.com/main-demo/wp-content/uploads/sites/7/2023/07/bangkok.png"
    }
  ];

  return (
    <section className="px-30 py-12 ">
      <h2 className="text-3xl md:text-4xl font-bold  mb-8">
        Top Destination For Your Next Vacation
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {destinations.map((d, index) => (
          <div
            key={index}
            className="relative rounded-2xl overflow-hidden shadow-lg group h-[400px] w-full flex items-end bg-cover bg-center"
            style={{ backgroundImage: `url(${d.image})` }}
          >
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-all duration-300"></div>
            <div className="relative p-4 text-white">
              <h3 className="text-xl font-bold">{d.name}</h3>
              <p className="text-sm">{d.desc}</p>
              <button className="mt-4 border border-white px-4 py-1 rounded-full text-sm hover:bg-white hover:text-black transition">
                See All Tours
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
