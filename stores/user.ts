import { defineStore } from "pinia";

export const useMyUserStore = defineStore({
  id: "myUserStore",
  state: () => ({}),
  actions: {},
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMyUserStore, import.meta.hot));
}
