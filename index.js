import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

export const name = 'dsh-paper-review-revision';
export const PACKAGE_NAME = 'dsh-paper-review-revision';

/**
 * Resolve the packaged skill root from the DSH profile base URL.
 *
 * The profile's `node_modules` is the only place a profile-installed bundle
 * lives, so the package manifest is located through Node resolution anchored at
 * `baseUrl` instead of a path built by hand.
 *
 * @param {string} profileBaseUrl - the DSH profile directory (Loader `baseUrl`).
 * @returns {string} absolute path of the directory that holds `SKILL.md`.
 */
export function resolveSkillRoot(profileBaseUrl) {
  if (!profileBaseUrl) {
    throw new Error('dsh-paper-review-revision: missing DSH profile baseUrl for package resolution');
  }
  let manifestPath;
  try {
    manifestPath = createRequire(profileBaseUrl).resolve(`${PACKAGE_NAME}/package.json`);
  } catch (error) {
    throw new Error(
      `dsh-paper-review-revision: cannot resolve ${PACKAGE_NAME}/package.json from the DSH profile`,
      { cause: error },
    );
  }
  return join(dirname(manifestPath), 'skills');
}
