import * as fs from 'fs'
import * as path from 'path'
import { github, core } from './core'
import { str2arr, isGlob, glob } from './util'
import { Octokit } from '@octokit/rest'
import { ReleaseInfo } from './release'
import { getType } from 'mime'

const exists: { [key: string]: number } = Object.create(null)

interface Asset {
  headers: {
    'content-type': string
    'content-length': number
  }
  name: string
  path: string
}

async function getFileList (assets: string): Promise<Asset[]> {
  if (assets == null || assets === '') {
    return []
  }

  const cwd = /* (process.env.GITHUB_WORKSPACE as string) ||  */process.cwd()

  const pathList = str2arr(assets)

  let fileList: string[] = []
  for (let i = 0; i < pathList.length; i++) {
    const str = pathList[i]
    if (str !== '') {
      if (isGlob(str)) {
        fileList = [...fileList, ...(await glob(path.posix.join(cwd, str)))]
      } else {
        fileList.push(path.isAbsolute(str) ? str : path.join(cwd, str))
      }
    }
  }

  fileList = [...new Set(fileList)]

  fileList = fileList.filter(p => (fs.existsSync(p) && fs.statSync(p).isFile()))

  return fileList.map(p => {
    const assetContentType = getType(path.extname(p)) ?? 'application/octet-stream'
    const assetContentLength = fs.statSync(p).size

    const headers = { 'content-type': assetContentType, 'content-length': assetContentLength }
    const assetName = path.basename(p)

    return {
      headers,
      name: assetName,
      path: p
    }
  })
}

async function uploadAsset (options: Asset, url: string): ReturnType<typeof github.repos.uploadReleaseAsset> {
  let uploadAssetResponse: Octokit.Response<Octokit.ReposUploadReleaseAssetResponse>
  const data = fs.createReadStream(options.path, { autoClose: true, emitClose: true })
  try {
    uploadAssetResponse = await github.repos.uploadReleaseAsset({
      data,
      headers: options.headers,
      name: options.name,
      url
    })
  } catch (err) {
    try {
      data.destroy()
    } catch (_) {}
    if (Array.isArray(err.errors) && err.errors.length === 1 &&
        err.errors[0].resource === 'ReleaseAsset' &&
        err.errors[0].code === 'already_exists' &&
        err.errors[0].field === 'name'
    ) {
      if (exists[options.path] === undefined) {
        exists[options.path] = 0
      }
      exists[options.path]++
      options.name = `${path.parse(options.path).name}_${exists[options.path]}${path.extname(options.path)}`
      uploadAssetResponse = await uploadAsset(options, url)
    } else {
      throw err
    }
  }

  return uploadAssetResponse
}

export async function upload (releaseInfo: ReleaseInfo, assets: string): Promise<string[]> {
  const list = await getFileList(assets)

  if (list.length === 0) return []

  const browserDownloadUrl = []

  for (let i = 0; i < list.length; i++) {
    const uploadAssetResponse = await uploadAsset(list[i], releaseInfo.upload_url)
    const data: Octokit.ReposUploadReleaseAssetResponseValue = uploadAssetResponse.data as any
    core.info(`${list[i].name}: ${data.browser_download_url}`)

    const url = data.browser_download_url
    if (url != null && url !== '') {
      browserDownloadUrl.push(url)
    }
  }

  return [...new Set(browserDownloadUrl)]
}
