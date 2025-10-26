import { useMemo, useState } from "react";

import { toast } from "react-toastify";

import { useUserFollowing, useUserFollowers } from "@/hooks/useUser";
import { sendMessage } from "@/lib/api";


export default function ShareModal({ open, post, currentUser, onClose, onShare, onCopy }) {
  // Hooks must run unconditionally
  const [q, setQ] = useState("");
  const [sendingTo, setSendingTo] = useState(null);


  const username = currentUser?.data?.userId || currentUser?.userId;
  const followingQuery = useUserFollowing(username, 1);
  const followersQuery = useUserFollowers(username, 1);

  const followings = followingQuery?.data?.data || followingQuery?.data || [];
  const followers = followersQuery?.data?.data || followersQuery?.data || [];

  const filterUsers = (list) =>
    list.filter(u => {
      const name = (u.userId || u.username || u._id || "").toString().toLowerCase();
      return name.includes(q.trim().toLowerCase());
    });

  const visibleFollowings = useMemo(() => filterUsers(followings), [q, followings]);
  const visibleFollowers = useMemo(() => filterUsers(followers), [q, followers]);

  if (!open) return null;

  const buildPostUrl = (p) => {
    if (!p) return window.location.origin;
    // prefer canonical fields if available
    if (p.userId && p._id) return `${window.location.origin}/${p.userId}/p/${p._id}`;
    if (p._id) return `${window.location.origin}/post/${p._id}`;
    return window.location.origin;
  };

  const handleSendToUser = async (targetUser) => {
    if (!targetUser) return;
    const recipientId = targetUser._id || targetUser.userId || targetUser.id;
    if (!recipientId) {
      toast.error("Người nhận không hợp lệ");
      return;
    }

    const postUrl = buildPostUrl(post);
    try {
      setSendingTo(recipientId);
      // send as post_share: include sharedPost reference and optional content (url)
      await sendMessage({
        recipientId,
        messageType: "post_share",
        sharedPost: post?._id || post?.id,
        content: postUrl,
      });
      toast.success("Đã gửi");
      // optional parent callback (open conversation / analytics)
      if (typeof onShare === "function") onShare(targetUser, postUrl);
      onClose && onClose();
    } catch (err) {
      console.error(err);
      toast.error("Gửi thất bại");
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black opacity-40" onClick={onClose}></div>
      <div className="relative w-[520px] bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Share</h3>
            <button onClick={onClose} className="text-gray-500">✕</button>
          </div>
          <div className="mt-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search"
              className="w-full px-3 py-2 border rounded bg-gray-50"
            />
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto p-3">
          {followingQuery.isLoading || followersQuery.isLoading ? (
            <div className="text-center py-6 text-gray-500">Đang tải...</div>
          ) : (
            <>
              {visibleFollowings.length > 0 && (
                <>
                  <div className="text-sm text-gray-500 mb-2">Following</div>
                  <div className="space-y-2 mb-4">
                    {visibleFollowings.map(user => (
                      <div key={user._id || user.userId} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                        <div className="flex items-center space-x-3">
                          <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.userId || user.username}&background=random`} alt="" className="w-8 h-8 rounded-full" />
                          <div>
                            <div className="text-sm font-medium">{user.userId || user.username || "User"}</div>
                            <div className="text-xs text-gray-500">{user.displayName || ""}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSendToUser(user)}
                          className="text-sm text-blue-600 px-3 py-1 rounded"
                          disabled={sendingTo === (user._id || user.userId || user.id)}
                        >
                          {sendingTo === (user._id || user.userId || user.id) ? "Đang gửi..." : "Gửi"}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {visibleFollowers.length > 0 && (
                <>
                  <div className="text-sm text-gray-500 mb-2">Followers</div>
                  <div className="space-y-2 mb-4">
                    {visibleFollowers.map(user => (
                      <div key={user._id || user.userId} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                        <div className="flex items-center space-x-3">
                          <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.userId || user.username}&background=random`} alt="" className="w-8 h-8 rounded-full" />
                          <div>
                            <div className="text-sm font-medium">{user.userId || user.username || "User"}</div>
                            <div className="text-xs text-gray-500">{user.displayName || ""}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSendToUser(user)}
                          className="text-sm text-blue-600 px-3 py-1 rounded"
                          disabled={sendingTo === (user._id || user.userId || user.id)}
                        >
                          {sendingTo === (user._id || user.userId || user.id) ? "Đang gửi..." : "Gửi"}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {visibleFollowings.length === 0 && visibleFollowers.length === 0 && (
                <div className="text-center py-6 text-gray-500">No users found</div>
              )}
            </>
          )}
        </div>

        <div className="p-3 border-t flex items-center justify-between">
          <div className="text-sm text-gray-500">Copy link</div>
          <button
            onClick={() => { if (typeof onCopy === "function") onCopy(post); }}
            className="px-3 py-2 bg-gray-100 rounded text-sm"
          >
            Copy link
          </button>
        </div>
      </div>
    </div>
  );
}