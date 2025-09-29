import { useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { googleLogin } from "../../lib/api";
import GoogleIcon from "../ui/GoogleIcon";

const GoogleLoginButton = () => {
  const navigate = useNavigate();

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Sử dụng access_token để lấy thông tin user từ Google API
        const userInfoResponse = await fetch(
          `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenResponse.access_token}`,
        );
        const userInfo = await userInfoResponse.json();

        // Gửi thông tin user thay vì token
        await googleLogin({
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          googleId: userInfo.id,
        });

        navigate("/");
      } catch (error) {
        console.error("Google login error:", error);
        toast.error("Đăng nhập thất bại");
        navigate("/login");
      }
    },
    onError: () => {
      toast.error("Đăng nhập thất bại");
      navigate("/login");
    },
    // Không cần flow vì mặc định đã là authorization code flow
  });

  return (
    <button
      type="button"
      onClick={() => login()}
      className="text-foreground border-border flex w-full items-center justify-center space-x-3 rounded-2xl border bg-white/70 px-4 py-4 font-bold transition-all duration-300 hover:bg-white dark:bg-white/10 dark:hover:bg-white/40"
    >
      <GoogleIcon />
      <span>Đăng nhập bằng Google</span>
    </button>
  );
};

export default GoogleLoginButton;
