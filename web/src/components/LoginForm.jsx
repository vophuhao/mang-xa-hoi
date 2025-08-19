
import { GoogleLogin } from '@react-oauth/google'; 
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { login, googleLogin } from "../lib/api";
import { toast } from 'react-toastify';
const LoginForm = ({ onSwitch, onClose }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const {
        mutate: signIn,
       
    } = useMutation({
        mutationFn: login,
        onSuccess: () => {
            toast.success("Đăng nhập thành công!");
            onClose()
        },
        onError:()=>{
            toast.error("Tài khoản hoặc mật khẩu không chính xác");
        }
    });
    
    const handleGoogleLogin = async (credentialResponse) => {
      const credential = credentialResponse.credential;
      await googleLogin({ credential });
      toast.success("Đăng nhập thành công nghe!");
      onClose()
    
  };
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
            onKeyDown={(e) => e.key === "Enter" && signIn({ email, password })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-12 focus:outline-none"
          />
          <span className="absolute right-4 top-2.5 text-sm text-gray-500 cursor-pointer">Hiện</span>
        </div>

        <div className="text-right">
          <a href="#" className="text-sm text-blue-500 hover:underline">Quên mật khẩu?</a>
        </div>

        <button
          onClick={() => signIn({ email, password })}
          type="button"
          className="bg-[#009689] w-full py-2 rounded-lg text-white font-bold hover:bg-[#009699] transition cursor-pointer"
        >
          Đăng nhập
        </button>
      </form>

      <p className="text-center mt-4 text-sm">
        Tạo tài khoản mới{" "}
        <span className="text-blue-500 hover:underline cursor-pointer" onClick={onSwitch}>
          Nhấn vào đây
        </span>
      </p>

      <div className="flex items-center my-4">
        <hr className="flex-grow border-gray-300" />
        <span className="mx-2 text-gray-400 text-sm">Hoặc</span>
        <hr className="flex-grow border-gray-300" />
      </div>

      <div className="mt-7 mb-15">
        <GoogleLogin  onSuccess={handleGoogleLogin}
      onError={() => toast.error("Đăng nhập thất bại")}
      useOneTap/>
      </div>
    </>
  );
};
export default LoginForm;