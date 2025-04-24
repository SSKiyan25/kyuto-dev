<template>
  <UiDatatable :options="options" :columns="columns" :data="tableData" />
</template>

<script lang="ts">
  import { Timestamp } from "firebase/firestore";
  import type { StocksLogs } from "~/types/models/Product";
  import type { Config, ConfigColumns } from "datatables.net";

  export default defineComponent({
    name: "StocksHistory",
    props: {
      tableData: {
        type: Array as PropType<StocksLogs[]>,
        required: true,
      },
    },
    setup() {
      const formatDate = (timestamp: Timestamp | Date) => {
        const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat("en-US", {
          month: "long",
          day: "2-digit",
          year: "numeric",
        }).format(date);
      };

      const columns: ConfigColumns[] = [
        {
          title: "Date",
          data: "dateCreated",
          render: (data: any) => {
            try {
              return formatDate(data);
            } catch {
              return "Invalid Date";
            }
          },
        },
        {
          title: "Action",
          data: "action",
          render: (data: string) => {
            let colorClass = "bg-gray-200 text-gray-800";
            if (data === "Initial Stock") {
              colorClass = "bg-blue-200 text-blue-800";
            } else if (data === "Add Stock") {
              colorClass = "bg-green-200 text-green-800";
            } else if (data === "Remove Stock") {
              colorClass = "bg-red-200 text-red-800";
            }
            return `<span class="px-2 py-1 rounded ${colorClass} capitalize">${data}</span>`;
          },
        },
        {
          title: "Quantity",
          data: "quantity",
        },
        {
          title: "Selected Variation",
          data: "selectedVariation",
        },
      ];

      const options: Config = {
        buttons: [
          {
            extend: "colvis",
            text: "Columns",
            columns: ":not(.no-export)",
          },
          {
            extend: "copy",
            exportOptions: {
              columns: ":not(.no-export)",
            },
          },
          {
            extend: "excel",
            exportOptions: {
              columns: ":not(.no-export)",
            },
          },
          {
            extend: "pdf",
            exportOptions: {
              columns: ":not(.no-export)",
            },
          },
          {
            extend: "print",
            exportOptions: {
              columns: ":not(.no-export)",
            },
          },
          {
            extend: "csv",
            exportOptions: {
              columns: ":not(.no-export)",
            },
          },
        ],
        dom: "Q<'flex flex-col lg:flex-row w-full lg:items-start lg:justify-between gap-5 mb-5'Bf><'border rounded-lg't><'flex flex-col lg:flex-row gap-5 lg:items-center lg:justify-between pt-3 p-5'li><''p>",
        responsive: true,
        autoWidth: true,
        select: true,
      };

      return {
        columns,
        options,
      };
    },
  });
</script>
