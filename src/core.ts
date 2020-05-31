import * as core from '@actions/core'
import { GitHub, context } from '@actions/github'

let github: GitHub
try {
  github = new GitHub(process.env.GITHUB_TOKEN as string)
} catch (err) {
  core.setFailed(err.message)
  process.exit(1)
}

export { core, github, context }
