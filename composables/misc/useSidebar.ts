interface SidebarState {
  isSidebarHidden: Ref<boolean>;
  toggleSidebar: () => void;
}

const SIDEBAR_KEY = Symbol("sidebar");

export const useSidebar = () => {
  const isSidebarHidden = ref(false);
  const toggleSidebar = () => {
    console.log("Toggling sidebar");
    isSidebarHidden.value = !isSidebarHidden.value;
  };

  provide<SidebarState>(SIDEBAR_KEY, { isSidebarHidden, toggleSidebar });

  return { isSidebarHidden, toggleSidebar };
};

export const useSidebarState = (): SidebarState => {
  const sidebarState = inject<SidebarState>(SIDEBAR_KEY);
  if (!sidebarState) {
    throw new Error("useSidebarState must be used within a provider");
  }
  return sidebarState;
};
