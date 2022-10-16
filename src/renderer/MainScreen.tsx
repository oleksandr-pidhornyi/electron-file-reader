import { render } from '@testing-library/react';
import React, { MouseEventHandler } from 'react';
import './App.css';
import { Table, resolveSizeLabel } from './Table';

const SIZE_LABELS = ['B', 'KB', 'MB', 'GB', 'TB'];

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps {}

interface IState {
  currentDirectory?: string;
  contents?: ScanDirectoryData;
  loading: boolean;
  extraLoading: boolean;
}

export type GetDirectoryResult = {
  canceled?: boolean;
  filePaths?: string[];
};

type ScanDirectoryData = {
  directories: any[];
  files: any[];
  lastModified: Date | null;
  name: string;
  numOfFiles?: number;
  totalSize?: number;
};

export type ScanDirectoryResult = {
  err?: string;
  path?: string;
  data?: ScanDirectoryData;
};

class MainScreen extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      currentDirectory: '',
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
    window.electron?.ipcRenderer.on(
      'get-directory',
      (arg: GetDirectoryResult) => {
        const filePath = arg?.filePaths && arg?.filePaths[0];
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
        window.electron.ipcRenderer.sendMessage('deep-scan-directory', [
          filePath,
        ]);
        window.electron.ipcRenderer.sendMessage('shallow-scan-directory', [
          filePath,
        ]);
      }
    );
    window.electron?.ipcRenderer.on(
      'deep-scan-directory',
      (arg: ScanDirectoryResult) => {
        if (arg.err) {
          this.setState({
            extraLoading: false,
          });
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
    window.electron?.ipcRenderer.on(
      'shallow-scan-directory',
      (arg: ScanDirectoryResult) => {
        if (arg.err) {
          this.setState({
            contents: {
              directories: [],
              files: [],
              lastModified: null,
              name: '',
            },
            loading: false,
            extraLoading: false,
          });
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
  }

  static handleClick() {
    window.electron.ipcRenderer.sendMessage('get-directory', []);
  }

  render() {
    const { currentDirectory, contents, extraLoading } = this.state;
    const lastModified = contents?.lastModified?.toLocaleDateString();
    const totalSizeLabel = extraLoading
      ? 'loading...'
      : resolveSizeLabel(contents?.totalSize);
    const totalFilesLabel = extraLoading ? 'loading...' : contents?.numOfFiles;
    let data: any[] = [];
    if (contents?.directories && contents.files) {
      data = [...contents.directories, ...contents.files];
    }
    const table = <Table data={data} />;
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
