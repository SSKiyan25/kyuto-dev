<template>
  <div class="my-8 flex flex-col space-y-4 px-8 pb-16">
    <div class="flex w-1/2 flex-col rounded-sm border p-8">
      <div class="flex flex-row space-x-4">
        <img
          src="/logo-verch.webp"
          alt="Verch Logo"
          title="Verch Logo"
          class="h-8 w-8 object-contain"
        />
        <span class="text-2xl font-bold">Verch</span>
      </div>
      <UiDivider class="my-4" />
      <div class="flex flex-col space-y-2 pl-4 pt-2">
        <AdminDashboardBoxText :title="'Total Users'" :icon="'lucide:user'" :value="'100'" />
        <AdminDashboardBoxText
          :title="'Total Organizations'"
          :icon="'lucide:landmark'"
          :value="'10'"
        />
        <AdminDashboardBoxText
          :title="'No. Free Plan Organizations'"
          :icon="'lucide:house'"
          :value="'20'"
        />
        <AdminDashboardBoxText
          :title="'No. Paid Plan Organizations'"
          :icon="'lucide:house-plus'"
          :value="'10'"
        />
      </div>
    </div>
    <div class="flex flex-col p-2">
      <div>
        <span class="text-lg font-medium">Logs</span>
      </div>
      <div>
        <UiDatatable :options="options" :columns="columns" :data="users">
          <template #actions="{ cellData }: { cellData: Staff }">
            <div class="flex flex-wrap gap-2">
              <UiButton :key="cellData.actions" class="h-7 text-xs" size="sm">
                {{ cellData.actions }}
              </UiButton>
            </div>
          </template>
        </UiDatatable>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { faker } from "@faker-js/faker";
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  import type { DataTablesNamedSlotProps } from "~/components/Ui/Datatable.client.vue";
  import type { Config, ConfigColumns } from "datatables.net";

  definePageMeta({
    layout: "admin",
    middleware: ["auth"],
  });

  interface Staff {
    email: string;
    entity: string;
    actions: string;
    date: string;
  }

  const { data: users } = await useAsyncData<Staff[]>(
    "fakerUsers",
    () => {
      return new Promise((resolve) => {
        // create 1000 fake users
        const users = Array.from({ length: 1000 }, () => {
          return {
            email: faker.internet.email(),
            entity: faker.company.name(),
            actions: faker.helpers.arrayElement([
              "order",
              "pre-order",
              "fulfilled",
              "cancelled",
              "add stocks",
              "remove stocks",
              "add product",
              "archive product",
            ]), // Select 1 random action
            date: useDateFormat(faker.date.past().toISOString(), "MMMM DD, YYYY").value,
          };
        });
        resolve(users);
      });
    },
    { default: () => [] }
  );

  const columns: ConfigColumns[] = [
    { data: "email", title: "Email" },
    { data: "entity", title: "Entity" },
    {
      data: null,
      title: "Actions",
      className: "no-export",
      searchable: false,
      orderable: false,
      name: "actions",
      render: "#actions",
      responsivePriority: 1,
    },
    { data: "date", title: "Date" },
  ];

  const options: Config = {
    buttons: [
      {
        extend: "colvis",
        text: "Columns",
        columns: ":not(.no-export)",
      },
      "copy",
      "excel",
      "pdf",
      "print",
      "csv",
    ],
    dom: "Q<'flex flex-col lg:flex-row w-full lg:items-start lg:justify-between gap-5 mb-5'Bf><'border rounded-lg't><'flex flex-col lg:flex-row gap-5 lg:items-center lg:justify-between pt-3 p-5'li><''p>",
    responsive: true,
    autoWidth: true,
    select: true,
  };
</script>
