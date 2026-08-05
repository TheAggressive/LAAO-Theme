# Repository rulesets

Branch protection lives in GitHub's database, not in this repository, so every
gate the pipeline builds is only as strong as a setting somebody can change
without review or audit trail. These files are the committed, reviewable intent.

They are **not** applied automatically. GitHub has no mechanism to sync rulesets
from a repository, and a workflow that tried would need an admin-scoped token
with permission to rewrite its own protections — a worse trade than running a
command deliberately.

## Apply

```bash
# Create (first time)
gh api --method POST /repos/TheAggressive/LAAO-Theme/rulesets \
  --input .github/rulesets/release-branches.json

# Update (subsequent changes) — find the id with the list command below
gh api --method PUT /repos/TheAggressive/LAAO-Theme/rulesets/<id> \
  --input .github/rulesets/release-branches.json
```

## Verify (drift check)

```bash
gh api /repos/TheAggressive/LAAO-Theme/rulesets --jq '.[] | "\(.id) \(.name) \(.enforcement)"'

gh api /repos/TheAggressive/LAAO-Theme/rulesets/<id> --jq '{name, enforcement, conditions, rules}'
```

Run the verify command whenever a release behaves unexpectedly, and after any
change to repository settings.

## What `release-branches.json` enforces

| Rule               | Effect                                                                            |
| ------------------ | --------------------------------------------------------------------------------- |
| `deletion`         | `main`/`master` cannot be deleted                                                 |
| `non_fast_forward` | No force-pushes — protects the tag history semantic-release derives versions from |

Both are safe to apply immediately: neither interferes with the release job.

Applied as ruleset id **20430755**.

### There is deliberately no bypass actor

`bypass_actors` is empty. An earlier version granted `RepositoryRole` 5 (admin)
an `always` bypass so maintenance would never be blocked — which also meant the
rule did **not** protect the repository owner from themselves.

That is not hypothetical. While verifying this ruleset, a
`git push --force-with-lease origin master` printed
`remote: - Cannot force-push to this branch` and **succeeded anyway**, because
the pushing identity held the bypass. It rewound `master` past a
`chore(release)` commit, which re-triggered the pipeline, produced a second
release run, and left the `v1.10.0` tag pointing at a commit no longer reachable
from `master`. semantic-release resolves the last release from tags reachable
from HEAD, so the next release would have recomputed the same version and failed
on a tag collision — repeatedly.

It was recoverable only because both release commits had identical trees, so the
tag could be moved onto the one on `master`.

The bypass was removed as a direct result. It bought very little: an admin can
already disable a ruleset deliberately when emergency maintenance genuinely
requires it, and that is a separate, visible, logged act rather than a side
effect of a routine command. A guard rail that exempts the only person able to
trip it is not a guard rail.

Verified after removal — a force-push to `master` is now refused outright:

```
remote: - Cannot force-push to this branch
 ! [remote rejected] master -> master (push declined due to repository rule violations)
```

Normal pushes are unaffected, which is what matters for the release job:
semantic-release fast-forwards `master` with a new commit and never force-pushes
or deletes, so no bypass is needed for it to work.

The other lesson: verify a force-push rule against a throwaway branch, never
against `master`.

## Why required status checks are NOT enforced

This is the significant gap, and it is a platform limitation rather than a
choice.

semantic-release pushes the `chore(release): x.y.z [skip ci]` commit **directly**
to the release branch as `github-actions[bot]`, using `GITHUB_TOKEN`. That
identity is not covered by the repository-admin bypass above. Rulesets enforce
`required_status_checks` on direct pushes, not only on merges — and that commit
is brand new with no checks against it, because `[skip ci]` deliberately prevents
a run.

Adding the rule would therefore stop every release at its final step, **after**
the tag and GitHub Release already exist. That is the hardest state to recover
from.

Both documented ways around it are unavailable on this repository:

| Workaround                             | Status                                                                                                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Add GitHub Actions as a `bypass_actor` | **Rejected by the API.** "Actor GitHub Actions integration must be part of the ruleset source or owner organization" — `TheAggressive` is a User account, not an Organization. |
| Apply with `"enforcement": "evaluate"` | **Rejected by the API.** "Enforcement evaluate option is not supported on this plan. Please upgrade to Enterprise."                                                            |

`required-checks.evaluate.json` records the intended rule so it is reviewable,
but it **cannot currently be applied**.

### Making it possible

Transferring the repository to a GitHub **Organization** resolves both: the
Actions integration becomes a valid bypass actor, so required checks can be
enforced on pull requests while the release push is exempt. That is the real
fix, and until it happens CI is advisory on direct pushes to `master`.

In the meantime the practical mitigation is process, not platform: work on
branches and merge through pull requests, where the checks do run and are
visible before merging.

## CODEOWNERS

`.github/CODEOWNERS` is committed and takes effect for review _suggestions_
immediately. It only becomes enforcing when a `pull_request` rule with
`require_code_owner_review: true` is added — which has the same direct-push
problem described above.
