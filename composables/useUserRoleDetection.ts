import { useOrganization } from "~/composables/useOrganizationValues";

export const useUserRoleDetection = () => {
  const user = useCurrentUser();
  const isUserSeller = ref(false);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  const checkUserRole = async () => {
    if (!user.value) {
      isUserSeller.value = false;
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const { getOrganizationIDFromUserId } = useOrganization();
      const { userData, organizationId } = await getOrganizationIDFromUserId(user.value.uid);

      // User is a seller if they have an organizationId or role is admin/manager/staff
      isUserSeller.value =
        !!organizationId ||
        userData?.role === "admin" ||
        userData?.role === "manager" ||
        userData?.role === "staff";

      console.log("User role check:", {
        isSeller: isUserSeller.value,
        organizationId,
        role: userData?.role,
      });
    } catch (err) {
      console.error("Error checking user role:", err);
      error.value = err instanceof Error ? err : new Error(String(err));
    } finally {
      isLoading.value = false;
    }
  };

  // Auto-check when user changes
  watch(
    user,
    () => {
      checkUserRole();
    },
    { immediate: true }
  );

  return {
    isUserSeller,
    isLoading,
    error,
    checkUserRole,
  };
};
