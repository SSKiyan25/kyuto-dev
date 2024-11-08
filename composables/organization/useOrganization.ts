export async function fetchOrganization() {
  const db = useFirestore();
  const user = useCurrentUser();

  console.log("User in composable: ", user.value);
}
