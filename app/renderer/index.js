// import 'reset-css';
import { shell } from 'electron';
import React from 'react';
import { render } from 'react-dom';
import { addLocaleData } from 'react-intl';
import en from 'react-intl/locale-data/en';
import ja from 'react-intl/locale-data/ja';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faArrowLeft,
  faChartPie,
  faCogs,
  faCopy,
  faDownload,
  faExclamationCircle,
  faExclamationTriangle,
  faPlus,
  faQuestionCircle,
  faWallet,
  faExternalLinkAlt,
  faLock,
  faEdit,
  faTimes,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { faArrowAltCircleRight } from '@fortawesome/free-regular-svg-icons';
import { faDev } from '@fortawesome/free-brands-svg-icons';
import { AppContainer } from 'react-hot-loader';
import 'electron-cookies';
import { getStorage, storageKeys } from 'renderer/api/utils/storage';
import { Logger } from 'renderer/utils/logging';
import { enableGoogleAnalytics, disableGoogleAnalytics } from 'renderer/analytics';
import types from './types';
import store from './store';
import App from './App';
import './scss/styles.scss';
import { setupApi } from './api/index';

// store.dispatch({ type: types.resetLocalStorage.triggered });
store.dispatch({ type: types.init.triggered });

getStorage(storageKeys.ENABLE_ANALYTICS).then(isEnabled => {
  if (isEnabled !== false) {
    enableGoogleAnalytics();
  } else {
    disableGoogleAnalytics();
  }
});

// https://github.com/yahoo/react-intl/wiki#loading-locale-data
addLocaleData([...en, ...ja]);

library.add(
  faArrowLeft,
  faChartPie,
  faCogs,
  faCopy,
  faDev,
  faDownload,
  faExclamationCircle,
  faExclamationTriangle,
  faPlus,
  faQuestionCircle,
  faWallet,
  faArrowAltCircleRight,
  faExternalLinkAlt,
  faLock,
  faEdit,
  faCheck,
  faTimes
);
console.log('App', APP_BRAND);

const initializeApp = async () => {
  const api = setupApi();
  await api.cennz.initApi();

  window[APP_BRAND] = {
    api,
    store,
  };

  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('No #root element found.');
  render(
    <AppContainer>
      <App />
    </AppContainer>,
    rootElement
  );
};

window.addEventListener('load', initializeApp);
window.addEventListener('dragover', event => event.preventDefault());
window.addEventListener('drop', event => event.preventDefault());

// Open all links in external browser
document.addEventListener('click', event => {
  if (event.target.tagName === 'A' && event.target.href.startsWith('http')) {
    Logger.info(`open external link: ${event.target.href}`);
    event.preventDefault();
    shell.openExternal(event.target.href);
  }
});

if (module.hot) {
  module.hot.accept('./App', () => {
    // eslint-disable-next-line global-require
    const NextApp = require('./App').default;
    render(
      <AppContainer>
        <NextApp />
      </AppContainer>,
      document.getElementById('root')
    );
  });
}
