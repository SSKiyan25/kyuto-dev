import percentageDirective from "~/utils/percentageDirective";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive("percentage", percentageDirective);
});
