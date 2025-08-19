
import { useState } from 'react';
import { Calendar, MapPin, Send } from 'lucide-react';
export default function HomeBanner() {

    const [destination, setDestination] = useState('');
    const [departureDate, setDepartureDate] = useState('Linh hoạt');
    const [from, setFrom] = useState('Hồ Chí Minh');
    return (
        <section className="relative text-white px-4 sm:px-6 lg:px-8">
            <div
                className="relative h-[500px] sm:h-[600px] lg:h-[700px] bg-cover bg-center rounded-4xl overflow-hidden"
                style={{
                    backgroundImage:
                        "url('https://travelwp.physcode.com/main-demo/wp-content/uploads/sites/7/2023/07/home-banner.png')"
                }}>
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40"></div>

                {/* Content */}
                <div className="relative z-10 max-w-5xl mx-auto px-2 sm:px-4 pt-20 sm:pt-28">
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
                        Trải nghiệm kỳ nghỉ tuyệt vời
                    </h3>
                    <p className="text-base sm:text-lg md:text-xl mt-4">
                        Combo khách sạn - vé máy bay - đưa đón sân bay giá tốt nhất
                    </p>

                    {/* Search Box */}
                    <div className="bg-white/90 backdrop-blur-lg p-4 rounded-2xl shadow-md w-full max-w-5xl mx-auto mt-10 space-y-4">
                        {/* Hàng 1: ô nhập điểm đến */}
                        <div className="flex items-center gap-2 bg-white rounded-xl p-3 shadow border">
                            <MapPin className="text-gray-500 shrink-0" />
                            <input
                                type="text"
                                placeholder="Bạn muốn đi đâu?"
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                className="w-full border-none outline-none bg-transparent placeholder-gray-400 text-gray-800 py-2"
                            />
                        </div>

                        {/* Hàng 2: responsive grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Ngày khởi hành */}
                            <div className="flex items-center gap-2 bg-white rounded-xl p-3 shadow border hover:cursor-pointer">
                                <Calendar className="text-gray-500 shrink-0" />
                                <div>
                                    <p className="text-gray-500 text-sm">Ngày khởi hành</p>
                                    <p className="text-gray-800 font-semibold">{departureDate}</p>
                                </div>
                            </div>

                            {/* Khởi hành từ */}
                            <div className="flex items-center gap-2 bg-white rounded-xl p-3 shadow border hover:cursor-pointer">
                                <Send className="text-gray-500 shrink-0" />
                                <div>
                                    <p className="text-gray-500 text-sm">Khởi hành từ</p>
                                    <p className="text-gray-800 font-semibold">{from}</p>
                                </div>
                            </div>

                            {/* Nút tìm */}
                            <button className="bg-[#009689] text-white w-full h-full rounded-xl font-bold hover:bg-[#009699] transition text-lg py-3">
                                Tìm
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

    );
}
