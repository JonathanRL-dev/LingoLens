import { APP_NAME } from '@lingolens/shared';
import { CvSpike } from './routes/dev/CvSpike';
import { CvLab } from './routes/dev/CvLab';

export default function App() {
  if (window.location.pathname === '/dev/cv-spike') return <CvSpike />;
  if (window.location.pathname === '/dev/cv-lab') return <CvLab />;

  return <h1>{APP_NAME}</h1>;
}
