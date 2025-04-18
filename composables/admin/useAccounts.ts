import type { Account } from "~/types/models/Account";

export const useAdminAccounts = () => {
  const fetchAccounts = async (): Promise<Account[]> => {
    try {
      const data = await $fetch<Account[]>("/api/admin/accounts");
      return data || [];
    } catch (error) {
      console.error("Error fetching accounts:", error);
      return [];
    }
  };

  const fetchAccount = async (uid: string) => {
    try {
      const data = await $fetch<Account>(`/api/admin/accounts/${uid}`);
      return data || null;
    } catch (error) {
      console.error("Error fetching account:", error);
      return null;
    }
  };

  const createAccount = async (email: string, password: string, accountData: object) => {
    try {
      const data = await $fetch("/api/admin/accounts/create", {
        method: "POST",
        body: { email, password, accountData },
      });
      return data;
    } catch (error) {
      console.error("Error creating account:", error);
      throw error;
    }
  };

  const toggleArchive = async (uid: string, isArchived: boolean) => {
    try {
      const data = await $fetch("/api/admin/accounts/toggle-archive", {
        method: "POST",
        body: { uid, isArchived },
      });
      return data;
    } catch (error) {
      console.error("Error toggling archive status:", error);
      throw error;
    }
  };

  const deleteAccount = async (uid: string) => {
    try {
      const data = await $fetch("/api/admin/accounts/delete", {
        method: "POST",
        body: { uid },
      });
      return data;
    } catch (error) {
      console.error("Error deleting account:", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const data = await $fetch("/api/admin/accounts/reset-password", {
        method: "POST",
        body: { email },
      });
      return data;
    } catch (error) {
      console.error("Error resetting password:", error);
      throw error;
    }
  };

  const disableAccount = async (uid: string, disabled: boolean) => {
    try {
      const data = await $fetch("/api/admin/accounts/disable", {
        method: "POST",
        body: { uid, disabled },
      });
      return data;
    } catch (error) {
      console.error("Error disabling account:", error);
      throw error;
    }
  };

  return {
    fetchAccounts,
    fetchAccount,
    createAccount,
    toggleArchive,
    deleteAccount,
    resetPassword,
    disableAccount,
  };
};
