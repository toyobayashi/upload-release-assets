import { github, context } from './core.js';

/**
 * Get or create release
 * @param {{ tag_name: string; target_commitish?: string; release_name: string; body?: string; draft?: boolean; prerelease?: boolean }} options
 * @returns {{ id: number; html_url: string; upload_url: string }}
 */
export async function getReleaseInfo (options) {
  const { owner, repo } = context.repo;
  const releases = await github.repos.listReleases({
    owner, repo
  });

  console.log('releases:');
  console.log(releases);

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
  const body = options.body || '';
  const draft = (options.draft === true);
  const prerelease = (options.prerelease === true);

  const createReleaseResponse = await github.repos.createRelease({
    owner,
    repo,
    tag_name: tag,
    name: releaseName,
    body,
    draft,
    prerelease
  });

  return {
    id: createReleaseResponse.data.id,
    html_url: createReleaseResponse.data.html_url,
    upload_url: createReleaseResponse.data.upload_url
  };
}
