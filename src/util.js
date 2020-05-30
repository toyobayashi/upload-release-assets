import * as fs from 'fs';
import * as path from 'path';
import * as G from 'glob';
import { promisify } from 'util';
import { getType } from 'mime';

const glob = promisify(G);

export async function getFileList (assets, url) {
  if (!assets) {
    return [];
  }

  const cwd = /* process.env['GITHUB_WORKSPACE'] ||  */process.cwd();

  const pathList = assets.split(';').map(s => s.trim());

  let fileList = [];
  for (let i = 0; i < pathList.length; i++) {
    const str = pathList[i];
    if (str) {
      if (isGlob(str)) {
        fileList = [...fileList, ...(await glob(path.posix.join(cwd, str)))];
      } else {
        fileList.push(path.isAbsolute(str) ? str : path.join(cwd, str));
      }
    }
  }

  fileList = Array.from(new Set(fileList));

  fileList = fileList.filter(p => (fs.existsSync(p) && fs.statSync(p).isFile()));

  return fileList.map(p => {
    const assetContentType = getType(path.extname(p)) || 'application/octet-stream';
    const assetContentLength = fs.statSync(p).size;

    const headers = { 'content-type': assetContentType, 'content-length': assetContentLength };
    const assetName = path.basename(p);
    // const data = fs.readFileSync(p);
    const data = fs.createReadStream(p);

    return {
      data,
      headers,
      name: assetName,
      path: p,
      url 
    };
  });
}

function isGlob (str) {
  const chars = { "{": "}", "(": ")", "[": "]" };
  /* eslint-disable-next-line max-len */
  const regex = /\\(.)|(^!|\*|[\].+)]\?|\[[^\\\]]+\]|\{[^\\}]+\}|\(\?[:!=][^\\)]+\)|\([^|]+\|[^\\)]+\))/;

  if (str === "") {
    return false;
  }

  let match;

  while ((match = regex.exec(str))) {
    if (match[2]) return true;
    let idx = match.index + match[0].length;

    // if an open bracket/brace/paren is escaped,
    // set the index to the next closing character
    const open = match[1];
    const close = open ? chars[open] : null;
    if (open && close) {
      const n = str.indexOf(close, idx);
      if (n !== -1) {
        idx = n + 1;
      }
    }

    str = str.slice(idx);
  }

  return false;
}
