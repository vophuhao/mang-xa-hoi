import { useState } from "react";
import { FaShoppingCart, FaBars, FaTimes } from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";
import LoginModal from "./AuthModal";

import { toast } from 'react-toastify';
import { logout } from "../lib/api";
import useAuth from "../hooks/useAuth";
export default function Header() {

    const [showLogin, setShowLogin] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const toggleMenu = () => setMobileOpen(!mobileOpen);
    const navItems = ["Tours", "Destination", "Deals", "Careers", "Pages"];
    const dropdownItems = ["Tours", "Destination", "Pages"];
    const { user } = useAuth();
    const handleLogout =  ()=>{
        logout();
        toast.success("Đăng xuất thành công")
    }
    
    return (

        <header className="px-40 py-6  top-0 z-50 ">
            <div className=" mx-auto flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <img className="h-12"
                        src="https://travelwp.physcode.com/main-demo/wp-content/uploads/sites/7/2023/07/logo-black.png"
                        alt="logo"
                    />
                </div>
                {/* Desktop Navigation */}
                <nav className="hidden md:flex gap-15 font-medium text-black text-xl" >
                    {navItems.map((item, i) => (
                        <div
                            key={item}
                            className={`relative flex items-center gap-1 cursor-pointer ${i === 0
                                ? "text-teal-600 after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2px] after:bg-teal-600"
                                : "hover:text-teal-600"
                                }`}
                        >
                            {item}
                            {dropdownItems.includes(item)}
                        </div>
                    ))}
                </nav>
                {/* Right Actions */}
                <div className="hidden md:flex items-center gap-10">
                    {/* <div className="flex items-center gap-1 cursor-pointer text-black hover:text-teal-600">
            <FaGlobe className="text-teal-500" />
            <span>English</span>
            <FiChevronDown size={14} />
          </div>

          <div className="flex items-center gap-1 cursor-pointer text-black hover:text-teal-600">
            USD <FiChevronDown size={14} />
          </div> */}
                    <div className="relative">
                        <div className="bg-gray-100 p-2 rounded-full cursor-pointer">
                            <FaShoppingCart size={25} />
                        </div>
                        <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                            0
                        </div>
                    </div>
                    {user ? (
                        <button
                            className="rounded-full bg-cover bg-center hover:cursor-pointer "
                            style={{
                                backgroundImage: `url(${user.avatarUrl})`,
                                width: '40px',
                                height: '40px',
                            }}
                            onClick={() => handleLogout()}
                        >

                        </button>
                    ) : (
                        <button
                            className="bg-teal-500 text-white text-xl px-4 py-2 rounded-full hover:bg-teal-600"
                            onClick={() => setShowLogin(true)}>
                            Đăng nhập
                        </button>
                    )}

                </div>
                {/* Mobile Toggle */}
                <button
                    onClick={toggleMenu}
                    className="md:hidden text-black text-xl p-2">
                    {mobileOpen ? <FaTimes /> : <FaBars />}
                </button>
            </div>
            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="md:hidden mt-4 space-y-4 px-4 pb-4">
                    {navItems.map((item) => (
                        <div
                            key={item}
                            className="flex items-center gap-1 text-sm text-black hover:text-teal-600"
                        >
                            {item}
                            {dropdownItems.includes(item) && <FiChevronDown size={14} />}
                        </div>
                    ))}
                    <div className="flex gap-4 flex-wrap items-center text-sm mt-2">
                        <div className="flex items-center gap-1 text-black hover:text-teal-600">
                            <FaShoppingCart size={16} />
                            Cart (0)
                        </div>
                        <button className="bg-teal-500 text-white text-sm px-4 py-2 rounded-full hover:bg-teal-600 mt-2" onClick={() => setShowLogin(true)}>
                            Đăng nhập
                        </button>
                    </div>
                </div>
            )}
            <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
        </header>

    );
}
