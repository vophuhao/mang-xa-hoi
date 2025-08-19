
import { GoogleLogin } from '@react-oauth/google'; 
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { register } from "../lib/api";
import { toast } from 'react-toastify';
const RegisterForm = ({ onSwitch }) => {
   const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
    const {
        mutate: createAccount,
       
    } = useMutation({
        mutationFn: register,
        onSuccess: () => {
            toast.success("Tạo tài khoản thành công");
            onSwitch()
        },
        onError:()=>{
            toast.error("Lỗi vui lòng thử lại");
        }
    });
    
  return (
    <>
      <form className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          placeholder="Email"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none"
        />
        <div className="relative">
          <input
            type="password"
            value={password}
            placeholder="Mật khẩu"
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-12 focus:outline-none"
          />
          <span className="absolute right-4 top-2.5 text-sm text-gray-500 cursor-pointer">Hiện</span>
        </div>
         <div className="relative">
          <input
             type="password"
             placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  createAccount({ email, password, confirmPassword })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-12 focus:outline-none"
          />
          <span className="absolute right-4 top-2.5 text-sm text-gray-500 cursor-pointer">Hiện</span>
        </div>
        <button
          onClick={() => createAccount({ email, password, confirmPassword })}
          type="button"
          className="bg-[#009689] w-full py-2 rounded-lg text-white font-bold hover:bg-[#009699] transition cursor-pointer"
        >
          Đăng Ký
        </button>
      </form>

        <p className="text-center mt-4 text-sm">
        Đã có tài khoản?{" "}
        <span className="text-blue-500 hover:underline cursor-pointer" onClick={onSwitch}>
            Đăng nhập
        </span>
        </p>
      <div className="flex items-center my-4">
        <hr className="flex-grow border-gray-300" />
        <span className="mx-2 text-gray-400 text-sm">Hoặc</span>
        <hr className="flex-grow border-gray-300" />
      </div>

      <div className="mt-7 mb-15">
        <GoogleLogin  />
      </div>
    </>
  );
};
export default RegisterForm;