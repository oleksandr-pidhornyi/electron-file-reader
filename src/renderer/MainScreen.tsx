import { render } from '@testing-library/react';
import React, { MouseEventHandler } from 'react';
import './App.css';

const SIZE_LABELS = ['B', 'KB', 'MB', 'GB', 'TB'];

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps {}

interface IState {
  currentDirectory?: string;
  contents: ScanDirectoryData;
  loading: boolean;
  extraLoading: boolean;
}

type GetDirectoryResult = {
  canceled: boolean;
  filePaths: string[];
};

type ScanDirectoryData = {
  directories: any[];
  files: any[];
  lastModified: Date | null;
  name: string;
  numOfFiles?: number;
  totalSize?: number;
};

type ScanDirectoryResult = {
  err: string;
  path: string;
  data: ScanDirectoryData;
};

class MainScreen extends React.Component<IProps, IState> {
  static resolveSizeLabel(size: number | undefined) {
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

  constructor(props: IProps) {
    super(props);
    this.state = {
      currentDirectory: '/Users/oleksandrpidhornyi/Desktop/test1',
      contents: {
        directories: [],
        files: [],
        lastModified: null,
        name: '',
      },
      loading: false,
      extraLoading: false,
    };
  }

  componentDidMount(): void {
    window.electron.ipcRenderer.on(
      'get-directory',
      (arg: GetDirectoryResult) => {
        const filePath = arg?.filePaths[0];
        this.setState({
          currentDirectory: filePath,
          contents: {
            directories: [],
            files: [],
            lastModified: null,
            name: '',
          },
          loading: true,
          extraLoading: true,
        });
        window.electron.ipcRenderer.sendMessage('deep-scan-directory', [filePath]);
        window.electron.ipcRenderer.sendMessage('shallow-scan-directory', [filePath]);
      }
    );
    window.electron.ipcRenderer.on(
      'deep-scan-directory',
      (arg: ScanDirectoryResult) => {
        if (arg.err) {
          console.error(arg.err);
          return;
        }
        const { currentDirectory, extraLoading } = this.state;
        if (extraLoading && currentDirectory === arg.path) {
          this.setState({
            contents: arg.data,
            loading: false,
            extraLoading: false,
          });
        }
      }
    );
    window.electron.ipcRenderer.on(
      'shallow-scan-directory',
      (arg: ScanDirectoryResult) => {
        if (arg.err) {
          console.error(arg.err);
          return;
        }
        const { currentDirectory, loading } = this.state;
        if (loading && currentDirectory === arg.path) {
          this.setState({
            contents: arg.data,
            loading: false,
          });
        }
      }
    );
    // ***************** REMOVE THIS
    const filePath = '/Users/oleksandrpidhornyi/Downloads';
    this.setState({
      currentDirectory: filePath,
      contents: {
        directories: [],
        files: [],
        lastModified: null,
        name: '',
      },
      loading: true,
      extraLoading: true,
    });
    window.electron.ipcRenderer.sendMessage('deep-scan-directory', [filePath]);
    window.electron.ipcRenderer.sendMessage('shallow-scan-directory', [filePath]);
  }

  static handleClick() {
    window.electron.ipcRenderer.sendMessage('get-directory', []);
  }

  static getTableBodyAsReactElement(data: any[]) {
    return !data ? null : (
      <tbody>
        {data.map((item) => {
          return (
            <tr>
              <td>{item.type}</td>
              <td>{item.name}</td>
              <td>{MainScreen.resolveSizeLabel(item.size)}</td>
              <td>{item.lastModified?.toLocaleDateString()}</td>
            </tr>
          );
        })}
      </tbody>
    );
  }

  render() {
    const { currentDirectory, contents, extraLoading } = this.state;
    const lastModified = contents.lastModified?.toLocaleDateString();
    const totalSizeLabel = extraLoading
      ? 'loading...'
      : MainScreen.resolveSizeLabel(contents.totalSize);
    const totalFilesLabel = extraLoading ? 'loading...' : contents.numOfFiles;
    let data: any[] = [];
    if (contents.directories && contents.files) {
      data = [...contents.directories, ...contents.files];
    }
    const table = MainScreen.getTableBodyAsReactElement(data);
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
        <button type="button" onClick={() => MainScreen.handleClick()}>
          Click to select the directory
        </button>
      </div>
    );
  }
}

export default MainScreen;
