const electron = require('electron');
const fs = require('fs');

const { ipcRenderer } = electron;

function sendDeepScanResult(payload) {
  ipcRenderer.send('worker-deep-scan-directory', {
    payload,
  });
}
function sendShallowScanResult(payload) {
  ipcRenderer.send('worker-shallow-scan-directory', {
    payload,
  });
}

/**
 * Checks whether a path starts with or contains a hidden file or a folder.
 * @param {string} source - The path of the file that needs to be validated.
 * returns {boolean} - `true` if the source is blacklisted and otherwise `false`.
 */
function isUnixHiddenPath(pathToTest) {
  // eslint-disable-next-line prettier/prettier, no-useless-escape
  return (/(^|\/)\.[^\/\.]/g).test(pathToTest);
}

function describeFile(statsObj, name, dirPath, directorySize) {
  return {
    name,
    size: statsObj.size,
    lastModified: statsObj.mtime,
    type: 'file',
  };
}

function describeDirectory(statsObj, name, dirPath, nestedSize = null) {
  const res = {
    name,
    lastModified: statsObj.mtime,
    type: 'dir',
  };
  if (nestedSize && nestedSize !== -1) {
    res.size = nestedSize;
  }
  return res;
}

async function scanDirectory(
  dirPath,
  multiLevelScan = false,
  justCountSize = false
) {
  const contents = await fs.promises.readdir(dirPath);
  const files = [];
  const directories = [];
  let totalSize = 0;
  let numOfFiles = 0;
  for (let i = 0; i < contents.length; i += 1) {
    const el = contents[i];
    const elPath = `${dirPath}/${el}`;
    const statsObj = fs.statSync(elPath);
    if (statsObj.isFile()) {
      totalSize += statsObj.size;
      if (!isUnixHiddenPath(el)) {
        if (!justCountSize) {
          files.push(describeFile(statsObj, el, dirPath));
        }
        numOfFiles += 1;
      }
    } else if (statsObj.isDirectory()) {
      let directorySize = -1;
      if (multiLevelScan) {
        const directoryScan = await scanDirectory(elPath, true, true);
        directorySize = directoryScan.size;
        totalSize += directorySize;
        numOfFiles += directoryScan.numOfFiles;
      }
      if (!justCountSize) {
        directories.push(
          describeDirectory(statsObj, el, dirPath, directorySize)
        );
      }
    }
  }
  if (justCountSize)
    return {
      size: totalSize,
      numOfFiles,
    };

  const dirStatsObj = fs.statSync(dirPath);
  return {
    name: dirPath,
    files: files.sort((a, b) => b.size - a.size),
    directories: directories.sort((a, b) => (b.size || 0) - (a.size || 0)),
    totalSize,
    numOfFiles,
    lastModified: dirStatsObj.mtime,
  };
}

ipcRenderer.on('worker-deep-scan-directory', (event, args) => {
  const path = args;
  scanDirectory(path, true, false)
    .then((data) => {
      sendDeepScanResult({ path, data });
      return data;
    })
    .catch((err) => {
      // TODO
    });
});

ipcRenderer.on('worker-shallow-scan-directory', (event, args) => {
  const path = args;
  scanDirectory(path, false, false)
    .then((data) => {
      sendShallowScanResult({ path, data });
      return data;
    })
    .catch((err) => {
      // TODO
    });
});
