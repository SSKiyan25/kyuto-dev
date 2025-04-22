import { collection, deleteDoc, getDocs, writeBatch } from "firebase/firestore";
import { deleteObject, getStorage, ref as storageRef } from "firebase/storage";
import type { Organization } from "~/types/models/Organization";

export const useDeleteOrganizations = () => {
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  const db = useFirestore();
  const storage = getStorage();

  const deleteOrganizationStorage = async (organization: Organization) => {
    try {
      const deletePromises: Promise<void>[] = [];

      // Delete logo image
      if (organization.logoImagePath) {
        deletePromises.push(deleteObject(storageRef(storage, organization.logoImagePath)));
      }

      // Delete cover image
      if (organization.coverImagePath) {
        deletePromises.push(deleteObject(storageRef(storage, organization.coverImagePath)));
      }

      // Delete address images
      if (organization.addressImagesURL?.length) {
        organization.addressImagesURL.forEach((image) => {
          if (image.path) {
            deletePromises.push(deleteObject(storageRef(storage, image.path)));
          }
        });
      }

      // Delete other images
      if (organization.imagesURL?.length) {
        organization.imagesURL.forEach((image) => {
          if (image.path) {
            deletePromises.push(deleteObject(storageRef(storage, image.path)));
          }
        });
      }

      await Promise.all(deletePromises);
    } catch (err) {
      throw new Error("Failed to delete organization storage files");
    }
  };

  const deleteOrganizationAccounts = async (organization: Organization) => {
    try {
      const deletePromises: Promise<void>[] = [];

      // Combine all account UIDs from admin, manager, and staff accounts
      const allAccounts = [
        ...(organization.adminAccounts || []),
        ...(organization.managerAccounts || []),
        ...(organization.staffAccounts || []),
      ];

      // Call the server API to delete each account
      allAccounts.forEach((uid) => {
        deletePromises.push(
          $fetch("/api/admin/accounts/delete", {
            method: "POST",
            body: { uid },
          })
        );
      });

      await Promise.all(deletePromises);
    } catch (err) {
      throw new Error("Failed to delete organization accounts");
    }
  };

  const deleteAllCommissionPayments = async () => {
    try {
      const commissionPaymentsRef = collection(db, "commissionPayments");
      const commissionPaymentsSnapshot = await getDocs(commissionPaymentsRef);

      const deletePromises: Promise<void>[] = [];
      commissionPaymentsSnapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });

      await Promise.all(deletePromises);
    } catch (err) {
      throw new Error("Failed to delete all commission payments");
    }
  };

  const deleteOrgAccounts = async (organization: Organization) => {
    try {
      const accountsRef = collection(db, "accounts");
      const accountsSnapshot = await getDocs(accountsRef);

      const batch = writeBatch(db);

      // Filter accounts by organizationID and delete them
      accountsSnapshot.forEach((doc) => {
        const accountData = doc.data();
        if (accountData.organizationID === organization.id) {
          batch.delete(doc.ref);
        }
      });

      await batch.commit();
    } catch (err) {
      throw new Error(`Failed to delete accounts for organization: ${organization.name}`);
    }
  };

  const deleteAllOrganizations = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const organizationsRef = collection(db, "organizations");
      const organizationsSnapshot = await getDocs(organizationsRef);

      for (const doc of organizationsSnapshot.docs) {
        const organization = doc.data() as Organization;

        // Step 1: Delete associated accounts
        try {
          await deleteOrganizationAccounts(organization);
        } catch (err) {
          error.value = new Error(
            `Failed to delete accounts for organization: ${organization.name}`
          );
          throw error.value;
        }

        try {
          await deleteOrgAccounts(organization);
        } catch (err) {
          error.value = new Error(
            `Failed to delete Firestore accounts for organization: ${organization.name}`
          );
          throw error.value;
        }

        // Step 2: Delete associated storage files
        try {
          await deleteOrganizationStorage(organization);
        } catch (err) {
          error.value = new Error(
            `Failed to delete storage for organization: ${organization.name}`
          );
          throw error.value;
        }

        // Step 3: Delete the organization document
        try {
          await deleteDoc(doc.ref);
        } catch (err) {
          error.value = new Error(`Failed to delete organization document: ${organization.name}`);
          throw error.value;
        }
      }

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error("Failed to delete all organizations");
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    error,
    deleteAllOrganizations,
    deleteAllCommissionPayments,
  };
};
