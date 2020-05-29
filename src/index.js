import * as core from '@actions/core';
import { GitHub } from '@actions/github';
import * as fs from 'fs';
import * as path from 'path';
import * as G from 'glob';
import { promisify } from 'util';
import { getType } from 'mime';

const glob = promisify(G);

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

async function getFileList (assets, url) {
  if (!assets) {
    return [];
  }

  const cwd = process.env['GITHUB_WORKSPACE'] || process.cwd();

  const pathList = assets.split(';').map(s => s.trim());

  let fileList = [];
  for (let i = 0; i < pathList.length; i++) {
    const str = pathList[i];
    if (str) {
      if (isGlob(str)) {
        fileList = [...fileList, ...(await glob(path.posix.join(cwd, str)))];
      } else {
        fileList.push(str);
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
    const data = fs.readFileSync(p);

    return {
      data,
      headers,
      name: assetName,
      path: p,
      url 
    };
  });
}

export async function run() {
  try {
    // Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
    const github = new GitHub(process.env['GITHUB_TOKEN']);

    const exists = Object.create(null);

    async function uploadAsset (options) {
      let uploadAssetResponse;
      try {
        uploadAssetResponse = await github.repos.uploadReleaseAsset({
          data: options.data,
          headers: options.headers,
          name: options.name,
          url: options.url
        });
      } catch (err) {
        if (err.errors.length === 1 && err.errors[0].resource === 'ReleaseAsset' && err.errors[0].code === 'already_exists' && err.errors[0].field === 'name') {
          if (exists[options.path] === undefined) {
            exists[options.path] = 0;
          }
          exists[options.path]++;
          options.name = `${options.name} (${exists[options.path]})`
          uploadAssetResponse = await uploadAsset(options);
        } else {
          throw err;
        }
      }

      return uploadAssetResponse;
    }

    // Get the inputs from the workflow file: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
    const uploadUrl = core.getInput('upload_url', { required: true });
    const assetPath = core.getInput('assets', { required: true });

    const list = await getFileList(assetPath, uploadUrl);

    if (list.length === 0) return;

    const browserDownloadUrl = [];

    for (let i = 0; i < list.length; i++) {
      const uploadAssetResponse = await uploadAsset(list[i]);

      const url = (uploadAssetResponse && uploadAssetResponse.data && uploadAssetResponse.data.browser_download_url) || '';
      if (url) {
        browserDownloadUrl.push(url);
      }
    }

    // Set the output variable for use by other actions: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
    core.setOutput('browser_download_urls', Array.from(new Set(browserDownloadUrl)).join(';'));
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
