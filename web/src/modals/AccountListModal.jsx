import { useEffect, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, User, X } from "lucide-react";

import { USER_QUERY_KEYS } from "@/hooks/useUser";
import { getSavedAccounts, removeAccount } from "@/utils/accountStorage";

export default function AccountListModal({ isOpen, onClose, onSelectAccount }) {
  const [savedAccounts, setSavedAccounts] = useState([]);
  const queryClient = useQueryClient();
  const currentUserData = queryClient.getQueryData(USER_QUERY_KEYS.currentUser);
  const currentUserId = currentUserData?.data?._id;

  useEffect(() => {
    if (isOpen) {
      setSavedAccounts(getSavedAccounts());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSelectAccount = (account) => {
    onSelectAccount(account.email);
    onClose();
  };

  const handleRemoveAccount = (userId, e) => {
    e.stopPropagation();

    // Không cho phép xóa tài khoản hiện tại
    if (userId === currentUserId) {
      return;
    }

    removeAccount(userId);
    setSavedAccounts((prev) => prev.filter((acc) => acc.userId !== userId));
  };

  const handleAddNewAccount = () => {
    onSelectAccount("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          aria-label="Đóng"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Chuyển tài khoản</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Chọn tài khoản để đăng nhập
          </p>
        </div>

        {/* Account List */}
        <div className="space-y-2">
          {savedAccounts.length > 0 ? (
            savedAccounts.map((account) => {
              const isCurrentUser = account.userId === currentUserId;

              return (
                <button
                  key={account.userId}
                  onClick={() => handleSelectAccount(account)}
                  className={`group flex w-full items-center justify-between rounded-xl border p-4 transition-all ${
                    isCurrentUser
                      ? "border-blue-500 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20"
                      : "border-gray-200 bg-gray-50 hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="relative">
                      {account.avatarUrl ? (
                        <img
                          src={account.avatarUrl}
                          alt={account.username || account.email}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
                          <User size={24} className="text-white" />
                        </div>
                      )}

                      {/* Badge for current user */}
                      {isCurrentUser && (
                        <div className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900">
                          <svg
                            className="h-3 w-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Account Info */}
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {account.username || "Người dùng"}
                        </p>
                        {isCurrentUser && (
                          <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs font-medium text-white">
                            Hiện tại
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{account.email}</p>
                    </div>
                  </div>

                  {/* Remove Button - chỉ hiển thị nếu không phải current user */}
                  {!isCurrentUser && (
                    <button
                      onClick={(e) => handleRemoveAccount(account.userId, e)}
                      className="rounded-full p-2 text-gray-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      aria-label="Xóa tài khoản"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </button>
              );
            })
          ) : (
            <div className="py-8 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <User size={32} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chưa có tài khoản nào được lưu
              </p>
            </div>
          )}

          {/* Add New Account Button */}
          <button
            onClick={handleAddNewAccount}
            className="flex w-full items-center justify-center space-x-2 rounded-xl border-2 border-dashed border-gray-300 bg-transparent p-4 text-gray-600 transition-all hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-blue-500 dark:hover:bg-gray-800 dark:hover:text-blue-400"
          >
            <Plus size={20} />
            <span className="font-medium">Đăng nhập tài khoản khác</span>
          </button>
        </div>

        {/* Footer Note */}
        <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-500">
          Tài khoản được lưu trên thiết bị này
        </p>
      </div>
    </div>
  );
}
