import { useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { saveAccount } from "@/utils/accountStorage";

/**
 * Hook to automatically save current user to localStorage
 * Behavior giống Instagram/Facebook - tự động lưu user hiện tại
 */
export const useSaveCurrentUser = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Lắng nghe thay đổi của currentUser query
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // Chỉ xử lý khi currentUser query được cập nhật thành công
      if (
        event.type === "updated" &&
        event.query.queryKey[0] === "user" &&
        event.query.queryKey[1] === "current" &&
        event.query.state.status === "success"
      ) {
        const userData = event.query.state.data;

        if (userData?.data) {
          // Lưu/cập nhật tài khoản hiện tại
          saveAccount({
            userId: userData.data._id,
            email: userData.data.email,
            username: userData.data.username,
            avatarUrl: userData.data.avatarUrl,
          });
        }
      }
    });

    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  }, [queryClient]);
};
