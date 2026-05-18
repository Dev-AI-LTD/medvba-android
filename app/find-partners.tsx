import { Redirect } from 'expo-router';

/** Legacy route — find partners lives in the social stack. */
export default function FindPartnersRedirect() {
  return <Redirect href="/(tabs)/social/find-partners" />;
}
