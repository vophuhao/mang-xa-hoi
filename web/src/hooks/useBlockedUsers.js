import { useQuery } from "@tanstack/react-query";

import { getBlockedUsers } from "@/lib/api";

export const BLOCK_QUERY_KEYS = {
  list: ["user", "blockedList"],
};

/**
 * Hook để lấy danh sách người bị chặn
 */
export const useBlockedUsers = () => {
  return useQuery({
    queryKey: BLOCK_QUERY_KEYS.list,
    queryFn: getBlockedUsers,
    staleTime: 5 * 60 * 1000, // cache 5 phút
  });
};
