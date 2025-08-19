import { X } from "lucide-react";
import { useState } from "react";
import RegisterForm from "./RegisterForm";
import LoginForm from "./LoginForm";
export default function AuthModal({ isOpen, onClose }) {
    
    const [isRegistering, setIsRegistering] = useState(false);
    
    if (!isOpen) return null;

    
    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl p-6 w-[90%] max-w-md relative shadow-lg">

        {/* Close button */}
        <button
          onClick={() => {
            onClose();
            setIsRegistering(false);
            }} 
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 hover:cursor-pointer"
        >
          <X size={24} />
        </button>

        {/* Title */}
        <h2 className="mt-[10px] relative top-[20px] text-[40px] font-bold pb-[20px] bg-gradient-to-r from-[#009680] via-[#009688] to-[#009695] bg-clip-text text-transparent text-center mb-10">
          {isRegistering ? "Đăng ký" : "Đăng nhập"}
        </h2>

        {/* Nội dung thay đổi theo chế độ */}
        {isRegistering ? (
          <RegisterForm onSwitch={() => setIsRegistering(false)}  
          onClose={onClose}/>
        ) : (
          <LoginForm
            onSwitch={() => setIsRegistering(true)}
            onClose={onClose}
            
          />
        )}
      </div>
    </div>
  );
}
