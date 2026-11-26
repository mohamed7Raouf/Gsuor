import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ErrorBoundary} from './components/ErrorBoundary.tsx';
import {LocalStorageProvider} from './components/LocalStorageProvider.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <LocalStorageProvider>
      <App />
    </LocalStorageProvider>
  </ErrorBoundary>,
);
