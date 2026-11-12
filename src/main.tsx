import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import '@fontsource/rubik/600.css';
import '@fontsource/rubik/800.css';
import './styles/app.css';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
