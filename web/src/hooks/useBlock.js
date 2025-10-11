import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useCurrentUser } from "@/hooks/useUser";
import { toggleBlockUser } from "@/lib/api"; // ✅ API duy nhất
/**
 * Hook xử lý chặn / bỏ chặn người dùng (chung 1 API)
 */
export const useBlockActions = () => {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();

  // 🔄 Mutation chung cho block/unblock
  const blockToggleMutation = useMutation({
    mutationFn: toggleBlockUser,
    onMutate: async (targetUserId) => {
      await queryClient.cancelQueries(["user"]);

      const previousData = queryClient.getQueryData(["user", "current"]);

      queryClient.setQueryData(["user", "current"], (old) => {
        if (!old?.data) return old;

        const blockedList = new Set(old.data.blockedUsers || []);
        if (blockedList.has(targetUserId)) blockedList.delete(targetUserId);
        else blockedList.add(targetUserId);

        return {
          ...old,
          data: { ...old.data, blockedUsers: Array.from(blockedList) },
        };
      });

      return { previousData };
    },
    onError: (err, targetUserId, context) => {
      if (context?.previousData)
        queryClient.setQueryData(["user", "current"], context.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries(["user"]);
    },
  });

  // ✅ Kiểm tra đã chặn user chưa
  const isBlocked = (userId) => {
    if (!currentUser?.data?.blockedUsers) return false;
    return currentUser.data.blockedUsers.some(
      (blocked) => blocked._id === userId || blocked === userId
    );
  };

  return {
    toggleBlockUser: blockToggleMutation.mutateAsync,
    isBlocked,
    isBlocking: blockToggleMutation.isLoading,
  };
};
