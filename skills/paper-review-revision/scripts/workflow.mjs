import { createHash } from 'node:crypto';
import {
  cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync,
  realpathSync, renameSync, writeFileSync,
} from 'node:fs';
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { parseArgs } from 'node:util';

const stateName = 'workflow.json';
const workflowVersion = 2;
const stages = ['academic-review', 'math-review', 'english-editing', 'final-review'];

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function inside(parent, child) {
  const path = relative(parent, child);
  return path === '' || (!isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`));
}

function fileHash(path) {
  const stats = lstatSync(path);
  requireCondition(stats.isFile() && stats.size > 0, `Expected a nonempty file: ${path}`);
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function manuscriptResource(path) {
  return basename(path).toLowerCase() !== '.git';
}

function draftHash(directory, include = () => true) {
  const hash = createHash('sha256');
  function visit(path, name) {
    const stats = lstatSync(path);
    if (stats.isDirectory()) {
      hash.update(JSON.stringify(['directory', name]));
      for (const child of readdirSync(path).sort()) {
        const childPath = join(path, child);
        if (include(childPath)) visit(childPath, name ? `${name}/${child}` : child);
      }
      return;
    }
    requireCondition(stats.isFile(), `Unsupported manuscript resource: ${path}`);
    const contentHash = createHash('sha256').update(readFileSync(path)).digest('hex');
    hash.update(JSON.stringify(['file', name, contentHash]));
  }
  visit(directory, '');
  return hash.digest('hex');
}

function numbered(parent, number) {
  return join(parent, String(number).padStart(2, '0'));
}

function save(run, state) {
  const temporary = join(run, `.workflow-${process.pid}.tmp`);
  writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  renameSync(temporary, join(run, stateName));
  return state;
}

function start(run, input, options) {
  requireCondition(input, 'Provide the manuscript file or source directory.');
  const source = resolve(input);
  const stats = lstatSync(source);
  requireCondition(stats.isFile() || stats.isDirectory(), 'Provide a regular file or directory.');
  const target = join(realpathSync(dirname(run)), basename(run));
  requireCondition(!inside(realpathSync(source), target), 'Choose a run directory outside the manuscript source.');
  const entry = stats.isFile() ? basename(source) : options.entry;
  requireCondition(entry && !isAbsolute(entry) && (stats.isDirectory() || !options.entry),
    'Provide --entry with a relative path only when the source is a directory.');
  if (stats.isDirectory()) {
    const entryPath = resolve(source, entry);
    requireCondition(inside(source, entryPath) && relative(source, entryPath).split(sep).every(manuscriptResource),
      'The entry must be a manuscript file inside the source directory.');
    draftHash(source, manuscriptResource);
    fileHash(entryPath);
  } else {
    fileHash(source);
  }
  mkdirSync(run);
  const drafts = join(run, 'drafts');
  const baseline = numbered(drafts, 0);
  mkdirSync(drafts);
  if (stats.isDirectory()) {
    cpSync(source, baseline, { recursive: true, filter: manuscriptResource });
  } else {
    mkdirSync(baseline);
    cpSync(source, join(baseline, entry));
  }
  const roundDirectory = numbered(join(run, 'rounds'), 1);
  mkdirSync(roundDirectory, { recursive: true });
  return save(run, {
    workflowVersion, phase: 'review', round: 1,
    sourceIsPdf: extname(entry).toLowerCase() === '.pdf',
    entry: relative(baseline, resolve(baseline, entry)),
    current: { directory: baseline, sha256: draftHash(baseline) },
    history: [],
  });
}

function advanceRound(run, state) {
  state.round += 1;
  state.phase = 'review';
  mkdirSync(numbered(join(run, 'rounds'), state.round), { recursive: true });
}

function acceptReview(run, state, decision) {
  const isFinal = state.round === stages.length;
  const decisions = ['pass', 'revise', 'needs-author'];
  if (state.round === 2 || state.round === 3) decisions.push('not-applicable');
  requireCondition(decisions.includes(decision), 'Invalid decision for this review stage.');
  const directory = numbered(join(run, 'rounds'), state.round);
  const report = join(directory, 'review.md');
  const review = {
    round: state.round, stage: stages[state.round - 1], draft: state.current,
    decision, report, reportSha256: fileHash(report),
  };
  state.history.push(review);
  if (isFinal) {
    state.phase = 'finished';
    state.reason = { pass: 'passed', revise: 'open-issues', 'needs-author': 'needs-author' }[decision];
    return;
  }
  if (decision === 'revise' && state.sourceIsPdf) review.revision = { outcome: 'needs-editable-source' };
  if (decision !== 'revise' || state.sourceIsPdf) return advanceRound(run, state);

  const candidate = numbered(join(run, 'drafts'), state.round);
  if (existsSync(candidate)) {
    requireCondition(draftHash(candidate) === state.current.sha256, `Candidate already contains edits: ${candidate}`);
  } else {
    const staging = mkdtempSync(join(run, 'drafts', '.copy-'));
    cpSync(state.current.directory, staging, { recursive: true });
    renameSync(staging, candidate);
  }
  state.candidate = candidate;
  state.phase = 'revision';
}

function acceptRevision(run, state, outcome) {
  requireCondition(['revised', 'no-progress', 'needs-author'].includes(outcome), 'Invalid revision outcome.');
  const review = state.history.at(-1);
  requireCondition(fileHash(review.report) === review.reportSha256, 'The accepted review report changed during revision.');
  const log = join(numbered(join(run, 'rounds'), state.round), 'changes.md');
  review.revision = { outcome, log, logSha256: fileHash(log) };
  if (outcome === 'revised') {
    const sha256 = draftHash(state.candidate);
    fileHash(join(state.candidate, state.entry));
    requireCondition(sha256 !== state.current.sha256, 'Use no-progress when the manuscript has no changes.');
    state.current = { directory: state.candidate, sha256 };
  }
  delete state.candidate;
  advanceRound(run, state);
}

function present(run, state) {
  const directory = numbered(join(run, 'rounds'), state.round);
  const lastReviewed = state.history.at(-1)?.draft;
  return {
    ...state,
    stage: state.workflowVersion === workflowVersion ? stages[state.round - 1] : undefined,
    manuscript: join(state.current.directory, state.entry),
    lastReviewedManuscript: lastReviewed && join(lastReviewed.directory, state.entry),
    report: join(directory, 'review.md'),
    revisionLog: join(directory, 'changes.md'),
    candidateManuscript: state.candidate && join(state.candidate, state.entry),
  };
}

try {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      entry: { type: 'string' },
    },
  });
  const [command, path, roundOrInput, outcome] = positionals;
  requireCondition(path && ['start', 'status', 'review', 'revision'].includes(command),
    'Usage: workflow.mjs start RUN SOURCE [--entry FILE] | status RUN | review RUN ROUND DECISION | revision RUN ROUND OUTCOME');
  const expectedLength = { start: 3, status: 2, review: 4, revision: 4 };
  requireCondition(positionals.length === expectedLength[command], `Unexpected arguments for ${command}.`);
  requireCondition(command === 'start' || Object.keys(values).length === 0,
    'Options are only supported by start.');
  const run = resolve(path);
  const state = command === 'start' ? start(run, roundOrInput, values) : JSON.parse(readFileSync(join(run, stateName), 'utf8'));
  if (command === 'review' || command === 'revision') {
    requireCondition(state.workflowVersion === workflowVersion, 'Start a new run for the fixed four-stage workflow.');
    requireCondition(state.phase === command && Number(roundOrInput) === state.round,
      `Expected ${state.phase} for round ${state.round}.`);
    requireCondition(draftHash(state.current.directory) === state.current.sha256, 'The current manuscript was changed outside its revision copy.');
    if (command === 'review') acceptReview(run, state, outcome);
    else acceptRevision(run, state, outcome);
    save(run, state);
  }
  console.log(JSON.stringify(present(run, state), null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
