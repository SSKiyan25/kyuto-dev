import { useUserValues } from "~/composables/user/useUserValues";
import { collection, getDocs, query, where } from "firebase/firestore";
import type { Organization } from "~/types/models/Organization";

export const useOrganizationValues = () => {
  const { userData } = useUserValues();
  const db = useFirestore();

  const currentOrganization: Partial<Organization> = {
    name: "",
    contactEmail: "",
    address: "",
    addressImages: [],
    description: "",
    phoneNumber: "",
    icon: "",
    images: [],
    isVerified: false,
    dateCreated: new Date(),
    accounts: [],
  };

  const organizationData = ref<Partial<Organization>>(currentOrganization);
  const organizationID = ref("");
  const organizationLoading = ref(true);

  watch(
    userData,
    async (newUser) => {
      if (newUser && newUser.organization) {
        try {
          const orgQuery = query(
            collection(db, "organizations"),
            where("name", "==", newUser.organization)
          );
          const querySnapshot = await getDocs(orgQuery);
          if (!querySnapshot.empty) {
            const orgDoc = querySnapshot.docs[0];
            organizationData.value = orgDoc.data() as Partial<Organization>;
            organizationID.value = orgDoc.id;
            console.log("Organization data fetched successfully:", organizationData.value);
          } else {
            console.log("No organization data found");
            organizationLoading.value = false;
          }
        } catch (error) {
          console.error("Error fetching organization data:", error);
          organizationLoading.value = false;
        } finally {
          organizationLoading.value = false;
        }
      } else {
        console.log("No organization associated with the current user");
        organizationLoading.value = false;
      }
    },
    { immediate: true }
  );

  return { organizationData, organizationLoading, organizationID };
};
