import { Redirect } from 'expo-router';
import { STUDY_PILOT_MODULE_ID } from '@/constants/study';

/** /study → chapter list for the admission pilot module */
export default function StudyIndex() {
  return (
    <Redirect
      href={{
        pathname: '/study/chapters',
        params: { moduleId: STUDY_PILOT_MODULE_ID },
      }}
    />
  );
}
