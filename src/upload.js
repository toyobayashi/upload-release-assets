import { github } from './core.js';
import * as path from 'path';
import * as fs from 'fs';
import { getFileList } from './util.js';

// import fetch from 'node-fetch';

// import * as requestError from '@octokit/request-error';

// /**
//  * @param {{ url: string; name: string; headers: { 'Content-Type': string; 'Content-Length': string; [h: string]: string }; data: Buffer | NodeJS.ReadStream; label?: string }} options
//  * @returns {Promise<any>}
//  */
// function requestUploadReleaseAsset (options) {
//   let u = options.url.replace(/\{.+\}$/, `?name=${options.name}`);
//   if (typeof options.label === 'string' && options.label !== '') {
//     u += `&label=${options.label}`;
//   }

//   let headers = {};
//   let status;
//   let url;
//   const requestOptions = {
//     method: 'POST',
//     url: u,
//     body: options.data,
//     headers: {
//       ...(options.headers),
//       'authorization': `token ${process.env['GITHUB_TOKEN']}`,
//       'user-agent': 'GitHub Actions upload-release-assets',
//     }
//   };
//   return fetch(u, requestOptions).then(response => {
//     url = response.url;
//     status = response.status;

//     for (const keyAndValue of response.headers) {
//       headers[keyAndValue[0]] = keyAndValue[1];
//     }

//     if (status === 204 || status === 205) {
//       return;
//     } // GitHub API returns 200 for HEAD requests

//     if (status === 304) {
//       throw new requestError.RequestError("Not modified", status, {
//         headers,
//         request: requestOptions
//       });
//     }

//     if (status >= 400) {
//       return response.text().then(message => {
//         const error = new requestError.RequestError(message, status, {
//           headers,
//           request: requestOptions
//         });

//         try {
//           let responseBody = JSON.parse(error.message);
//           Object.assign(error, responseBody);
//           let errors = responseBody.errors; // Assumption `errors` would always be in Array format

//           error.message = error.message + ": " + errors.map(JSON.stringify).join(", ");
//         } catch (e) {// ignore, see octokit/rest.js#684
//         }

//         throw error;
//       });
//     }

//     const contentType = response.headers.get("content-type");

//     if (/application\/json/.test(contentType)) {
//       return response.json();
//     }

//     if (!contentType || /^text\/|charset=utf-8$/.test(contentType)) {
//       return response.text();
//     }

//     return response.arrayBuffer();
//   }).then(data => {
//     return {
//       status,
//       url,
//       headers,
//       data
//     };
//   }).catch(error => {
//     if (error instanceof requestError.RequestError) {
//       throw error;
//     }

//     throw new requestError.RequestError(error.message, 500, {
//       headers,
//       request: requestOptions
//     });
//   });
// }

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
    if (Array.isArray(err.errors) && err.errors.length === 1
        && err.errors[0].resource === 'ReleaseAsset'
        && err.errors[0].code === 'already_exists'
        && err.errors[0].field === 'name'
    ) {
      if (exists[options.path] === undefined) {
        exists[options.path] = 0;
      }
      exists[options.path]++;
      options.name = `${path.parse(options.path).name}_${exists[options.path]}${path.extname(options.path)}`
      console.log(`rename: ${options.name}`);
      try {
        options.data.destroy();
      } catch (_) {}
      options.data = fs.createReadStream(options.path, { autoClose: true, emitClose: true });
      uploadAssetResponse = await uploadAsset(options);
    } else {
      console.log(err);
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
    console.log(`uploaded: ${uploadAssetResponse.data.browser_download_url}`);

    const url = (uploadAssetResponse && uploadAssetResponse.data && uploadAssetResponse.data.browser_download_url) || '';
    if (url) {
      browserDownloadUrl.push(url);
    }
  }

  return Array.from(new Set(browserDownloadUrl));
}
