import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
      </div>
    );
  }

  componentDidMount() {
    fetch("/api/facets",
    // Viewing localhost:<port> always work without credentials.
    // On some corporate networks, viewing <hostname>:<port> triggers a
    // redirect. Including credentials prevents a CORS error.
    {
        credentials: 'include'
    })
        .then(response => response.json())
        .then(jsondata => console.log(jsondata))
  }
}

export default App;
