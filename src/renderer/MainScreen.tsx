import { render } from '@testing-library/react';
import React, { MouseEventHandler } from 'react';
import './App.css';

const SIZE_LABELS = ['B', 'KB', 'MB', 'GB', 'TB'];

class MainScreen extends React.Component {
  constructor() {
    super();
    this.state = {
      currentDirectory: '',
      contents: {},
    };

    this.handleClick = this.handleClick.bind(this);
    this.resolveSize = this.resolveSize.bind(this);
  }

  componentDidMount(): void {
    window.electron.ipcRenderer.on('get-directory', (arg) => {
      const filePath = arg?.filePaths[0];
      this.setState({ currentDirectory: filePath, contents: {} });
      window.electron.ipcRenderer.sendMessage('scan-directory', [filePath]);
    });
    window.electron.ipcRenderer.on('scan-directory', (arg) => {
      this.setState({ contents: arg });
    });
    window.electron.ipcRenderer.sendMessage('scan-directory', [
      '/Users/oleksandrpidhornyi/Desktop/test1',
    ]);
  }

  handleClick() {
    window.electron.ipcRenderer.sendMessage('get-directory', []);
  }

  getTableBodyAsReactElement(data) {
    return (!data) ? null : (
      <tbody>
        {data.map((item) => {
          return (
            <tr>
              <td>{item.name}</td>
              <td>{this.resolveSize(item.size)}</td>
              <td>{item.lastModified?.toLocaleDateString()}</td>
            </tr>
          );
        })}
      </tbody>
    );
  }

  resolveSize(size) {
    if (!size) return '';
    let sizeLabel = 0;
    let newSize = size;
    const denominator = 1024;
    while (newSize > denominator) {
      sizeLabel += 1;
      newSize /= denominator;
    }
    const res = `${Math.floor(newSize)} ${SIZE_LABELS[sizeLabel]}`;
    console.log(res);
    return res;
  }

  render() {
    const { currentDirectory, contents } = this.state;
    const lastModified = contents.lastModified?.toLocaleDateString();
    let data = [];
    if (contents.directories && contents.files) {
      data = [...contents.directories, ...contents.files];
    }
    const table = this.getTableBodyAsReactElement(data);
    return (
      <div className="main-container">
        <div className="folder-info-container">
          <div className="bar top-bar">{currentDirectory}</div>
          <div className="table-content">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Size</th>
                  <th>Last modified</th>
                </tr>
              </thead>
              {table}
            </table>
          </div>
          <div className="bar bottom-bar">
            <div>Total size: {contents.totalSize}</div>
            <div>Last Modified: {lastModified}</div>
          </div>
        </div>
        <button type="button" onClick={() => this.handleClick()}>
          Click to select the directory
        </button>
      </div>
    );
  }
}

export default MainScreen;
