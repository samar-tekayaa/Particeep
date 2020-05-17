import React from 'react';
import ReactDOM from 'react-dom';

import './assets/css/index.css';
import 'antd/dist/antd.css';

import App from './App';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
  <App />,
  document.getElementById('root')
);

serviceWorker.unregister();
