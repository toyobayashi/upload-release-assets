import { github } from './core.js';
import * as path from 'path';
import { getFileList } from './util.js';

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
      options.name = `${path.parse(options.path).name}_${exists[options.path]}${path.extname(options.path)}`
      uploadAssetResponse = await uploadAsset(options);
    } else {
      throw err;
    }
  }

  return uploadAssetResponse;
}

export async function upload (releaseInfo, assets) {
  const list = await getFileList(assets, releaseInfo.upload_url);

  if (list.length === 0) return [];

  const browserDownloadUrl = [];

  for (let i = 0; i < list.length; i++) {
    const uploadAssetResponse = await uploadAsset(list[i]);

    const url = (uploadAssetResponse && uploadAssetResponse.data && uploadAssetResponse.data.browser_download_url) || '';
    if (url) {
      browserDownloadUrl.push(url);
    }
  }

  return Array.from(new Set(browserDownloadUrl));
}
