import { github, context } from './core'
import { Octokit } from '@octokit/rest'

export interface ReleaseInfo {
  id: number
  html_url: string
  upload_url: string
}

export interface GetReleaseInfoOptions {
  tag_name: string
  release_name: string
  target_commitish?: string
  body?: string
  draft?: boolean
  prerelease?: boolean
}

export async function getReleaseInfo (options: GetReleaseInfoOptions): Promise<ReleaseInfo> {
  const { owner, repo } = context.repo
  const releases = await github.repos.listReleases({
    owner, repo
  })

  const tagName = options.tag_name
  const tag = tagName.replace('refs/tags/', '')

  const targetRelease = releases.data.find(r => (r.tag_name === tag))
  if (targetRelease !== undefined) {
    return {
      id: targetRelease.id,
      html_url: targetRelease.html_url,
      upload_url: targetRelease.upload_url
    }
  }

  const releaseName = options.release_name.replace('refs/tags/', '')
  const body = options.body
  const draft = (options.draft === true)
  const prerelease = (options.prerelease === true)
  const targetCommitish = options.target_commitish

  const createReleaseOptions: (Octokit.RequestOptions & Octokit.ReposCreateReleaseParams) = {
    owner,
    repo,
    tag_name: tag,
    name: releaseName,
    draft,
    prerelease
  }

  if (body !== '') {
    createReleaseOptions.body = body
  }

  if (targetCommitish !== '') {
    createReleaseOptions.target_commitish = targetCommitish
  }

  const createReleaseResponse = await github.repos.createRelease(createReleaseOptions)

  return {
    id: createReleaseResponse.data.id,
    html_url: createReleaseResponse.data.html_url,
    upload_url: createReleaseResponse.data.upload_url
  }
}
