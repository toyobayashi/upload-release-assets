import { core } from './core.js';
import { getReleaseInfo } from './release.js';
import { upload } from './upload.js';

export async function run() {
  try {
    const releaseInfo = await getReleaseInfo({
      tag_name: core.getInput('tag_name', { required: true }),
      target_commitish: core.getInput('target_commitish', { required: false }),
      release_name: core.getInput('release_name', { required: true }),
      body: core.getInput('body', { required: false }),
      draft: core.getInput('draft', { required: false }) === 'true',
      prerelease: core.getInput('prerelease', { required: false }) === 'true'
    });

    const browserDownloadUrls = await upload(releaseInfo, core.getInput('assets', { required: false }));

    const outputs = {
      id: releaseInfo.id,
      html_url: releaseInfo.html_url,
      upload_url: releaseInfo.upload_url,
      browser_download_urls: browserDownloadUrls.join(';')
    };

    Object.keys(outputs).forEach(k => {
      core.setOutput(k, outputs[k]);
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
