<template>
  <div>Homepage</div>
  <ClientOnly>
    <div v-if="loading">Loading...</div>
    <div v-else-if="userData.email !== ''">{{ userData }}</div>
    <div v-else>No User</div>
  </ClientOnly>
  <ClientOnly>
    <div v-if="organizationLoading">Loading...</div>
    <div v-else-if="organizationData.name !== ''">
      {{ organizationData }} , {{ organizationID }}
    </div>
    <div v-else>No Organization</div>
  </ClientOnly>
</template>

<script lang="ts" setup>
  import { useOrganizationValues } from "~/composables/organization/useOrganizationValues";
  import { useUserValues } from "~/composables/user/useUserValues";

  const { userData, loading } = useUserValues();
  const { organizationData, organizationLoading, organizationID } = useOrganizationValues();
</script>
