// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },

  modules: [
    "@nuxtjs/tailwindcss",
    "@nuxtjs/color-mode",
    "@vueuse/nuxt",
    "@nuxt/icon",
    "nuxt-vuefire",
    "@vee-validate/nuxt",
    "@morev/vue-transitions/nuxt",
    "@samk-dev/nuxt-vcalendar",
    "@pinia/nuxt",
    "pinia-plugin-persistedstate/nuxt",
    "vue3-carousel-nuxt",
    "v-wave/nuxt",
    "nuxt-nodemailer",
  ],

  tailwindcss: { exposeConfig: true },
  colorMode: { classSuffix: "light" },
  typescript: { shim: false },

  imports: {
    imports: [
      { from: "tailwind-variants", name: "tv" },
      { from: "tailwind-variants", name: "VariantProps", type: true },
      { from: "vue-sonner", name: "toast", as: "useSonner" },
    ],
  },

  vuefire: {
    auth: {
      enabled: true,
      persistence: ["browserLocal"],
    },

    config: {
      apiKey: process.env.NUXT_PUBLIC_API_KEY,
      authDomain: process.env.NUXT_PUBLIC_AUTH_DOMAIN,
      projectId: process.env.NUXT_PUBLIC_PROJECT_ID,
      storageBucket: process.env.NUXT_PUBLIC_STORAGE_BUCKET,
      messagingSenderId: process.env.NUXT_PUBLIC_MESSAGING_SENDER_ID,
      appId: process.env.NUXT_PUBLIC_APP_ID,
      measurementId: process.env.NUXT_PUBLIC_MEASUREMENT_ID,
    },
  },

  pinia: {
    storesDirs: ["./stores/**", "./custom-folder/stores/**"],
  },

  nodemailer: {
    service: "gmail",
    from: "VSU E-Commerce <verchcsofficial@gmail.com>",
    auth: {
      user: process.env.NUXT_SMTP_USER,
      pass: process.env.NUXT_SMTP_PASS,
    },
  },

  build: {
    transpile: ["vue-sonner", "xlsx"],
  },

  vite: {
    optimizeDeps: {
      include: ["xlsx"],
    },
  },

  app: {
    head: {
      script: [
        {
          src: "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.12/pdfmake.min.js",
          defer: true,
        },
        {
          src: "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.12/vfs_fonts.min.js",
          defer: true,
        },
      ],
    },
  },
  runtimeConfig: {
    firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY,
    apiSecretKey: process.env.API_SECRET_KEY,
    public: {
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      adminEmails: process.env.NUXT_PUBLIC_ADMIN_EMAILS || "",
    },
  },
});
