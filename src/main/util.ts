/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

export function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

/**
 * Checks whether a path starts with or contains a hidden file or a folder.
 * @param {string} source - The path of the file that needs to be validated.
 * returns {boolean} - `true` if the source is blacklisted and otherwise `false`.
 */
function isUnixHiddenPath(pathToTest: string) {
  // eslint-disable-next-line prettier/prettier, no-useless-escape
  return (/(^|\/)\.[^\/\.]/g).test(pathToTest);
}

async function describeFile(statsObj: fs.Stats, name: string, dirPath: string) {
  return {
    name,
    size: statsObj.size,
    lastModified: statsObj.mtime,
    type: 'file',
    // icon: app.getFileIcon(`${dirPath}/${name}`),
  };
}

async function describeDirectory(statsObj: fs.Stats, name: string, dirPath: string, nestedSize = null) {
  const res = {
    name,
    lastModified: statsObj.mtime,
    type: 'dir',
    // icon: app.getFileIcon(`${dirPath}/${name}`),
  };
  if (nestedSize) {
    res.size = nestedSize;
  }
  return res;
}

export function buildDirectoryScanResult(
  scanResultData: any[],
  dirPath: string,
  isPartial = true
) {
  console.log('dirPath', dirPath, scanResultData);
  const files = [];
  const directories = [];
  let totalSize = 0;
  // for (const entry in scanResultData) {
  //   console.log(entry);
  // }
  scanResultData.forEach(async (el) => {
    const statsObj = fs.statSync(`${dirPath}/${el}`);
    if (statsObj.isFile()) {
      totalSize += statsObj.size;
      if (!isUnixHiddenPath(el)) {
        files.push(await describeFile(statsObj, el, dirPath));
      }
    } else if (statsObj.isDirectory()) {
      directories.push(await describeDirectory(statsObj, el, dirPath));
    }
  });
  const dirStatsObj = fs.statSync(dirPath);
  return {
    name: dirPath,
    files,
    directories,
    totalSize,
    lastModified: dirStatsObj.mtime,
    isPartial,
  };
}

export async function scanDirectoryInitial(dirPath: string) {
  return buildDirectoryScanResult(await fs.promises.readdir(dirPath), dirPath);
}
