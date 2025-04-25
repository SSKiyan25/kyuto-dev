<template>
  <UiDivider class="my-2" />
  <UiContainer
    as="footer"
    class="flex flex-col items-center justify-between gap-7 py-6 lg:flex-row"
  >
    <NuxtLink to="/" class="flex items-center gap-3">
      <!-- eslint-disable-next-line vue/html-self-closing -->
      <img
        src="/logo-verch.webp"
        fit="contain"
        alt="Verch"
        title="Verch Logo"
        class="h-10 object-contain lg:h-8"
      />
      <span class="text-xl font-semibold lg:text-lg">Verch</span>
    </NuxtLink>
    <ul class="flex flex-wrap gap-5">
      <li>
        <NuxtLink class="text-secondary-foreground/80 hover:text-secondary-foreground" to="/terms"
          >Terms</NuxtLink
        >
      </li>
      <li>
        <NuxtLink class="text-secondary-foreground/80 hover:text-secondary-foreground" to="/privacy"
          >Privacy</NuxtLink
        >
      </li>
      <li>
        <NuxtLink
          class="text-secondary-foreground/80 hover:text-secondary-foreground"
          to="/report-bugs"
          >Report Bugs</NuxtLink
        >
      </li>
    </ul>

    <p class="text-muted-foreground">&copy; {{ new Date().getFullYear() }} Verch</p>
  </UiContainer>
</template>
