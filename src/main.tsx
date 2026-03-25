import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Polyfill for matchMedia which is often missing or incomplete in some environments
if (typeof window !== 'undefined') {
  window.matchMedia = window.matchMedia || function(query) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: function() {}, // Deprecated
      removeListener: function() {}, // Deprecated
      addEventListener: function() {},
      removeEventListener: function() {},
      dispatchEvent: function() { return false; },
    };
  };

  // Ensure addListener/removeListener exist even if matchMedia exists
  const originalMatchMedia = window.matchMedia;
  window.matchMedia = function(query) {
    const mql = originalMatchMedia.call(window, query);
    if (mql && !mql.addListener) {
      mql.addListener = function(callback) {
        this.addEventListener('change', callback);
      };
    }
    if (mql && !mql.removeListener) {
      mql.removeListener = function(callback) {
        this.removeEventListener('change', callback);
      };
    }
    return mql;
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
