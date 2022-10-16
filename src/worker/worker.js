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
  for (let i = 0; i < contents.length; i += 1) {
    const el = contents[i];
    const elPath = `${dirPath}/${el}`;
    const statsObj = fs.statSync(elPath);
    if (statsObj.isFile()) {
      totalSize += statsObj.size;
      if (!justCountSize && !isUnixHiddenPath(el)) {
        files.push(describeFile(statsObj, el, dirPath));
      }
    } else if (statsObj.isDirectory()) {
      let directorySize = -1;
      if (multiLevelScan) {
        directorySize = await scanDirectory(elPath, true, true);
        totalSize += directorySize;
      }
      if (!justCountSize) {
        directories.push(
          describeDirectory(statsObj, el, dirPath, directorySize)
        );
      }
    }
  }
  if (justCountSize) return totalSize;

  const dirStatsObj = fs.statSync(dirPath);
  return {
    name: dirPath,
    files,
    directories,
    totalSize,
    lastModified: dirStatsObj.mtime,
  };
}

ipcRenderer.on('worker-deep-scan-directory', (event, args) => {
  const path = args;
  console.log('deep scan', path);
  scanDirectory(path, true, false)
    .then((data) => {
      console.log('deep scan done', data);
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
