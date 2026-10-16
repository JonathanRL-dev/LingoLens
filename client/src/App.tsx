import { APP_NAME } from '@lingolens/shared';
import { CvSpike } from './routes/dev/CvSpike';

export default function App() {
  if (window.location.pathname === '/dev/cv-spike') return <CvSpike />;

  return <h1>{APP_NAME}</h1>;
}
