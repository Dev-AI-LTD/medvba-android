import { Redirect } from 'expo-router';

/** Ruta implicită `/` — evită ecran gol pe web când nu există index. */
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
