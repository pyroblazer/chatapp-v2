import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <Router>
    <App />
  </Router>
);
