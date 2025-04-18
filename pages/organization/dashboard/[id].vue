<script lang="ts" setup>
  import { _colors } from "#tailwind-config/theme";
  import { _muted, _violet } from "#tailwind-config/theme/colors";
  import type { ApexOptions } from "apexcharts";

  definePageMeta({
    layout: "organization",
    middleware: ["auth"],
  });

  type DataRecord = { name: string; total: number };
  const chart = ref<HTMLDivElement | null>(null);

  onMounted(async () => {
    const XYContainer = (await import("@unovis/ts")).XYContainer;
    const Axis = (await import("@unovis/ts")).Axis;
    const GroupedBar = (await import("@unovis/ts")).GroupedBar;
    const Tooltip = (await import("@unovis/ts")).Tooltip;

    const tooltip = new Tooltip({
      horizontalPlacement: "right",
      triggers: {
        [GroupedBar.selectors.bar]: (d: DataRecord) =>
          `<span class='text-sm font-medium'>${d.name}: ${new Intl.NumberFormat("en-US", {
            currency: "PHP",
            style: "currency",
          }).format(d.total)}</span>`,
      },
    });
    const data: DataRecord[] = [
      {
        name: "Jan",
        total: Math.floor(Math.random() * 5000) + 1000,
      },
      {
        name: "Feb",
        total: Math.floor(Math.random() * 5000) + 1000,
      },
      {
        name: "Mar",
        total: Math.floor(Math.random() * 5000) + 1000,
      },
      {
        name: "Apr",
        total: Math.floor(Math.random() * 5000) + 1000,
      },
      {
        name: "May",
        total: Math.floor(Math.random() * 5000) + 1000,
      },
      {
        name: "Jun",
        total: Math.floor(Math.random() * 5000) + 1000,
      },
      {
        name: "Jul",
        total: Math.floor(Math.random() * 5000) + 1000,
      },
      {
        name: "Aug",
        total: Math.floor(Math.random() * 5000) + 1000,
      },
      {
        name: "Sep",
        total: Math.floor(Math.random() * 5000) + 1000,
      },
      {
        name: "Oct",
        total: Math.floor(Math.random() * 5000) + 1000,
      },
      {
        name: "Nov",
        total: Math.floor(Math.random() * 5000) + 1000,
      },
      {
        name: "Dec",
        total: Math.floor(Math.random() * 5000) + 1000,
      },
    ];

    const bar = new GroupedBar<DataRecord>({
      x: (d, i) => i,
      y: (d) => d.total,
      color: "#FDC530",
      barPadding: 0.05,
      roundedCorners: 4,
    });
    await nextTick(() => {
      new XYContainer(
        chart.value!,
        {
          height: "100%",
          components: [bar],
          xAxis: new Axis<DataRecord>({
            tickFormat: (d, _, __) => data[d as number].name,
            numTicks: data.length,
            gridLine: false,
            domainLine: false,
            tickLine: false,
          }),
          yAxis: new Axis<DataRecord>({
            gridLine: false,
            tickLine: false,
            domainLine: false,
          }),
          tooltip,
        },
        data
      );
    });
  });

  const statusCards = [
    {
      title: "Total Revenue",
      icon: "lucide:dollar-sign",
      amount: "₱45,231.89",
      subtext: "+20.1% from last month",
    },
    {
      title: "Members",
      icon: "lucide:users",
      amount: "+2350",
      subtext: "+180.1% from last month",
    },
    {
      title: "Sales",
      icon: "lucide:credit-card",
      amount: "+12,234",
      subtext: "+19% from last month",
    },
    {
      title: "Total Products",
      icon: "lucide:box",
      amount: "+573",
      subtext: "+4 since last month",
    },
  ];

  const recentSales = [
    {
      avatar: "https://avatar.vercel.sh/oliviamartin",
      initials: "OM",
      name: "Olivia Martin",
      email: "olivia.martin@email.com",
      amount: "+₱1,999.00",
    },
    {
      avatar: "https://avatar.vercel.sh/jackson",
      initials: "JL",
      name: "Jackson Lee",
      email: "jackson.lee@email.com",
      amount: "+₱39.00",
    },
    {
      avatar: "https://avatar.vercel.sh/isabellanguyen",
      initials: "IN",
      name: "Isabella Nguyen",
      email: "isabella.nguyen@email.com",
      amount: "+₱299.00",
    },
    {
      avatar: "https://avatar.vercel.sh/williamkim",
      initials: "WK",
      name: "William Kim",
      email: "will@email.com",
      amount: "+₱99.00",
    },
    {
      avatar: "https://avatar.vercel.sh/sofiadavis",
      initials: "SD",
      name: "Sofia Davis",
      email: "sofia.davis@email.com",
      amount: "+₱39.00",
    },
  ];

  const series: ApexOptions["series"] = [70, 30, 60];

  const options: ApexOptions = {
    plotOptions: {
      pie: {
        dataLabels: {
          minAngleToShowLabel: 50,
          offset: -10,
        },
        expandOnClick: true,
      },
    },
    legend: {
      fontFamily: "inherit",
      fontWeight: 500,
      show: true,
      position: "bottom",
      labels: {
        colors: _muted.foreground,
      },
    },
    stroke: {
      lineCap: "round",
      colors: ["transparent"],
      width: 2,
    },
    colors: [_violet["400"], _violet["700"], _violet["900"]],
    chart: {
      toolbar: {
        show: window.innerWidth > 768,
      },
    },
    labels: ["T-shirt", "Lanyard", "CS Polo Shirt"],
  };
</script>

<template>
  <div class="flex w-full flex-col p-12">
    <div><span class="text-2xl font-bold">Dashboard</span></div>

    <div value="overview" class="space-y-4 pt-4">
      <div class="grid gap-4 space-x-4 md:grid-cols-2 lg:grid-cols-4">
        <template v-for="(s, i) in statusCards" :key="i">
          <UiCard>
            <UiCardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <UiCardTitle class="text-sm font-medium"> {{ s.title }} </UiCardTitle>
              <Icon :name="s.icon" class="h-4 w-4 text-muted-foreground" />
            </UiCardHeader>
            <UiCardContent>
              <div class="text-2xl font-bold">{{ s.amount }}</div>
              <p class="text-xs text-muted-foreground">{{ s.subtext }}</p>
            </UiCardContent>
          </UiCard>
        </template>
      </div>
      <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <UiCard class="col-span-4" title="Overview">
          <template #content>
            <UiCardContent class="h-full px-4">
              <div ref="chart" class="h-[80%]" />
            </UiCardContent>
          </template>
        </UiCard>
        <UiCard
          class="col-span-3"
          title="Recent Sales"
          description="You made 265 sales this month."
        >
          <template #content>
            <UiCardContent>
              <div class="space-y-8">
                <template v-for="(r, i) in recentSales" :key="i">
                  <div class="flex items-center">
                    <UiAvatar class="h-9 w-9" :src="r.avatar" alt="Avatar" :fallback="r.initials" />
                    <div class="ml-4 space-y-1">
                      <p class="text-sm font-medium leading-none">{{ r.name }}</p>
                      <p class="text-sm text-muted-foreground">{{ r.email }}</p>
                    </div>
                    <div class="ml-auto font-medium">{{ r.amount }}</div>
                  </div>
                </template>
              </div>
            </UiCardContent>
          </template>
        </UiCard>
      </div>
    </div>
    <div class="h-[500px] w-full py-4">
      <span> Product Sales </span>
      <apexchart width="100%" height="100%" type="pie" :options="options" :series="series" />
    </div>
    <div class="flex justify-end">
      <UiButton> Export All Data </UiButton>
    </div>
  </div>
  <!-- <ADComingSoon /> -->
</template>

<style>
  .apexcharts-menu {
    @apply border-border bg-background text-foreground;
    .apexcharts-menu-item {
      @apply hover:!bg-primary hover:!text-primary-foreground;
    }
  }
</style>
