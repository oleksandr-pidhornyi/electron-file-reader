import { render } from '@testing-library/react';
import React, { MouseEventHandler } from 'react';
import './App.css';

const SIZE_LABELS = ['B', 'KB', 'MB', 'GB', 'TB'];

class MainScreen extends React.Component {
  constructor() {
    super();
    this.state = {
      currentDirectory: '/Users/oleksandrpidhornyi/Desktop/test1',
      contents: {},
      loading: false,
      extraLoading: false,
    };

    this.handleClick = this.handleClick.bind(this);
    this.resolveSizeLabel = this.resolveSizeLabel.bind(this);
  }

  componentDidMount(): void {
    window.electron.ipcRenderer.on('get-directory', (arg) => {
      const filePath = arg?.filePaths[0];
      this.setState({
        currentDirectory: filePath,
        contents: {},
        loading: true,
        extraLoading: true,
      });
      window.electron.ipcRenderer.sendMessage('deep-scan-directory', [filePath]);
      window.electron.ipcRenderer.sendMessage('shallow-scan-directory', [filePath]);
    });
    window.electron.ipcRenderer.on('deep-scan-directory', (arg) => {
      const { currentDirectory, extraLoading } = this.state;
      if (extraLoading && currentDirectory === arg.path) {
        this.setState({
          contents: arg.data,
          loading: false,
          extraLoading: false,
        });
      }
    });
    window.electron.ipcRenderer.on('shallow-scan-directory', (arg) => {
      const { currentDirectory, loading } = this.state;
      if (loading && currentDirectory === arg.path) {
        this.setState({
          contents: arg.data,
          loading: false,
        });
      }
    });

    const filePath = '/Users/oleksandrpidhornyi/Downloads';
    this.setState({
      currentDirectory: filePath,
      contents: {},
      loading: true,
      extraLoading: true,
    });
    window.electron.ipcRenderer.sendMessage('deep-scan-directory', [filePath]);
    window.electron.ipcRenderer.sendMessage('shallow-scan-directory', [filePath]);
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
              <td>{item.type}</td>
              <td>{item.name}</td>
              <td>{this.resolveSizeLabel(item.size)}</td>
              <td>{item.lastModified?.toLocaleDateString()}</td>
            </tr>
          );
        })}
      </tbody>
    );
  }

  resolveSizeLabel(size) {
    if (!size) return '...';
    let sizeLabel = 0;
    let newSize = size;
    const denominator = 1024;
    while (newSize > denominator) {
      sizeLabel += 1;
      newSize /= denominator;
    }
    const res = `${Math.floor(newSize)} ${SIZE_LABELS[sizeLabel]}`;
    return res;
  }

  render() {
    const { currentDirectory, contents, extraLoading } = this.state;
    const lastModified = contents.lastModified?.toLocaleDateString();
    const totalSizeLabel = extraLoading
      ? 'loading...'
      : this.resolveSizeLabel(contents.totalSize);
    const totalFilesLabel = extraLoading ? 'loading...' : contents.numOfFiles;
    let data = [];
    if (contents.directories && contents.files) {
      data = [...contents.directories, ...contents.files];
    }
    const table = this.getTableBodyAsReactElement(data);
    return (
      <div className="main-container">
        <div className="folder-info-container">
          <div className="bar top-bar">
            <div>{currentDirectory}</div>
            <div>Total files: {totalFilesLabel}</div>
          </div>
          <div className="table-content">
            <div className="nested-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Size</th>
                    <th>Last modified</th>
                  </tr>
                </thead>
                {table}
              </table>
            </div>
          </div>
          <div className="bar bottom-bar">
            <div>Total size: {totalSizeLabel}</div>
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
