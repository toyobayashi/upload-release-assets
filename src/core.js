import * as core from '@actions/core';
import { GitHub, context } from '@actions/github';

/** @type {GitHub} */
let github;
try {
  github = new GitHub(process.env['GITHUB_TOKEN']);
} catch (err) {
  core.setFailed(err.message);
  process.exit(1);
}

export { core, github, context };
