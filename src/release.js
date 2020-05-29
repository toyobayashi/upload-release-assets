import { github, context } from './core.js';

/**
 * Get or create release
 * @param {{ tag_name: string; target_commitish?: string; release_name: string; body?: string; draft?: boolean; prerelease?: boolean }} options
 * @returns {{ id: number; html_url: string; upload_url: string }}
 */
export async function getReleaseInfo (options) {
  console.log('getReleaseInfo options:');
  console.log(options);

  const { owner, repo } = context.repo;
  const releases = await github.repos.listReleases({
    owner, repo
  });

  try {
    const testrelease = await github.repos.getReleaseByTag({
      owner, repo, tag: '3575'
    });
    console.log('testrelease:');
    console.log(testrelease);
  } catch (err) {
    console.log('getReleaseByTag err');
    console.log(err);
  }

  const tagName = options.tag_name;
  const tag = tagName.replace('refs/tags/', '');

  const targetRelease = releases.data.find(r => (r.tag_name === tag));
  if (targetRelease) {
    return {
      id: targetRelease.id,
      html_url: targetRelease.html_url,
      upload_url: targetRelease.upload_url
    };
  }

  const releaseName = options.release_name.replace('refs/tags/', '');
  const body = options.body;
  const draft = (options.draft === true);
  const prerelease = (options.prerelease === true);
  const target_commitish = options.target_commitish;

  const createReleaseOptions = {
    owner,
    repo,
    tag_name: tag,
    name: releaseName,
    draft,
    prerelease
  };

  if (body) {
    createReleaseOptions.body = body;
  }

  if (target_commitish) {
    createReleaseOptions.target_commitish = target_commitish;
  }

  const createReleaseResponse = await github.repos.createRelease(createReleaseOptions);

  return {
    id: createReleaseResponse.data.id,
    html_url: createReleaseResponse.data.html_url,
    upload_url: createReleaseResponse.data.upload_url
  };
}
