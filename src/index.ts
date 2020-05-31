import { core } from './core'
import { getReleaseInfo } from './release'
import { upload } from './upload'

export async function run (): Promise<void> {
  try {
    const releaseInfo = await getReleaseInfo({
      tag_name: core.getInput('tag_name', { required: true }),
      target_commitish: core.getInput('target_commitish', { required: false }),
      release_name: core.getInput('release_name', { required: true }),
      body: core.getInput('body', { required: false }),
      draft: core.getInput('draft', { required: false }) === 'true',
      prerelease: core.getInput('prerelease', { required: false }) === 'true'
    })

    const browserDownloadUrls = await upload(releaseInfo, core.getInput('assets', { required: false }))

    const outputs = {
      id: releaseInfo.id,
      html_url: releaseInfo.html_url,
      upload_url: releaseInfo.upload_url,
      browser_download_urls: browserDownloadUrls.join(';')
    }

    const realoutputs: { [k: string]: string } = Object.create(null)

    for (const k in outputs) {
      if (Object.prototype.hasOwnProperty.call(outputs, k)) {
        const key = k as keyof typeof outputs
        core.setOutput(key, outputs[key])
        realoutputs[key] = JSON.stringify(outputs[key])
      }
    }

    core.info(`outputs: ${JSON.stringify(realoutputs, null, 2)}`)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run().catch(err => {
  core.setFailed(err.message)
})
