import { useUserValues } from "~/composables/user/useUserValues";
import { collection, query, where } from "firebase/firestore";
import type { Organization } from "~/types/models/Organization";

export async function useOrganizationValues() {
  const { userData, loading: userLoading } = await useUserValues();
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

  const orgQuery = computed(() => {
    if (userData.value && userData.value.organization) {
      return query(
        collection(db, "organizations"),
        where("name", "==", userData.value.organization)
      );
    }
    return null;
  });

  const { data: organizationData, pending: organizationLoading } =
    useCollection<Organization>(orgQuery);

  console.log("Organization data: ", organizationData);
  const organizationID = computed(() => {
    if (organizationData.value && organizationData.value.length > 0) {
      return organizationData.value[0].id ?? "";
    }
    return "";
  });

  return { organizationData, organizationLoading, organizationID };
}
