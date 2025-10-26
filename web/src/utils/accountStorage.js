/**
 * Account Storage Utility
 * Quản lý danh sách tài khoản đã lưu trong localStorage
 * Behavior tương tự Instagram/Facebook
 */

const SAVED_ACCOUNTS_KEY = "pixyy_saved_accounts";
const MAX_SAVED_ACCOUNTS = 5;

/**
 * Lấy tất cả tài khoản đã lưu
 * @returns {Array} Danh sách tài khoản
 */
export const getSavedAccounts = () => {
  try {
    const accounts = localStorage.getItem(SAVED_ACCOUNTS_KEY);
    return accounts ? JSON.parse(accounts) : [];
  } catch (error) {
    console.error("Error reading saved accounts:", error);
    return [];
  }
};

/**
 * Lưu hoặc cập nhật thông tin tài khoản
 * @param {Object} accountData - { userId, email, username, avatarUrl }
 * @returns {boolean} Success status
 */
export const saveAccount = (accountData) => {
  try {
    const { userId, email, username, avatarUrl } = accountData;

    if (!userId || !email) {
      console.error("userId and email are required");
      return false;
    }

    const accounts = getSavedAccounts();

    // Tìm tài khoản đã tồn tại (theo userId)
    const existingIndex = accounts.findIndex((acc) => acc.userId === userId);

    const accountToSave = {
      userId,
      email,
      username: username || email.split("@")[0],
      avatarUrl: avatarUrl || null,
      lastLogin: new Date().toISOString(),
    };

    if (existingIndex !== -1) {
      // Cập nhật tài khoản đã tồn tại
      accounts[existingIndex] = accountToSave;

      // Di chuyển lên đầu nếu không phải ở vị trí đầu
      if (existingIndex !== 0) {
        const [account] = accounts.splice(existingIndex, 1);
        accounts.unshift(account);
      }
    } else {
      // Thêm tài khoản mới vào đầu danh sách
      accounts.unshift(accountToSave);
    }

    // Giới hạn số lượng tài khoản
    const limitedAccounts = accounts.slice(0, MAX_SAVED_ACCOUNTS);

    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(limitedAccounts));
    return true;
  } catch (error) {
    console.error("Error saving account:", error);
    return false;
  }
};

/**
 * Xóa tài khoản khỏi danh sách
 * @param {string} userId - ID của tài khoản cần xóa
 * @returns {boolean} Success status
 */
export const removeAccount = (userId) => {
  try {
    const accounts = getSavedAccounts();
    const filteredAccounts = accounts.filter((acc) => acc.userId !== userId);

    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(filteredAccounts));
    return true;
  } catch (error) {
    console.error("Error removing account:", error);
    return false;
  }
};

/**
 * Cập nhật thông tin tài khoản (avatar, username)
 * @param {string} userId - ID của tài khoản
 * @param {Object} updates - { username, avatarUrl }
 * @returns {boolean} Success status
 */
export const updateAccount = (userId, updates) => {
  try {
    const accounts = getSavedAccounts();
    const accountIndex = accounts.findIndex((acc) => acc.userId === userId);

    if (accountIndex === -1) {
      return false;
    }

    accounts[accountIndex] = {
      ...accounts[accountIndex],
      ...updates,
      lastLogin: new Date().toISOString(),
    };

    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
    return true;
  } catch (error) {
    console.error("Error updating account:", error);
    return false;
  }
};

/**
 * Lấy thông tin tài khoản theo userId
 * @param {string} userId - ID của tài khoản
 * @returns {Object|null} Account data hoặc null
 */
export const getAccountById = (userId) => {
  try {
    const accounts = getSavedAccounts();
    return accounts.find((acc) => acc.userId === userId) || null;
  } catch (error) {
    console.error("Error getting account:", error);
    return null;
  }
};

/**
 * Kiểm tra tài khoản đã được lưu chưa
 * @param {string} userId - ID của tài khoản
 * @returns {boolean}
 */
export const isAccountSaved = (userId) => {
  try {
    const accounts = getSavedAccounts();
    return accounts.some((acc) => acc.userId === userId);
  } catch (error) {
    console.error("Error checking account:", error);
    return false;
  }
};

/**
 * Xóa tất cả tài khoản đã lưu
 * @returns {boolean} Success status
 */
export const clearAllAccounts = () => {
  try {
    localStorage.removeItem(SAVED_ACCOUNTS_KEY);
    return true;
  } catch (error) {
    console.error("Error clearing accounts:", error);
    return false;
  }
};
