import { AppProviders } from './app/providers.js';
import { AppRouter } from './app/router.js';

export default function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}
