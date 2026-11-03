# Git reconciliation

Recorded 2026-10-28. No commit, push, merge, rebase, or reset was performed.

## What is checked out

- Branch: `main`, tracking `origin/main`
- HEAD: `fcb254286709e2247021a613dae06d793ee996d2`
- Message: `ci: deploy frontend to S3 and CloudFront` (2026-09-20)
- Status against `origin/main`: ahead 1, behind 2
- The engineering upgrade, reliability fixes, and verification docs are uncommitted
- Nothing is staged

Local-only commit: `fcb2542`.

Commits on `origin/main` that are not in HEAD:

- `ac6d1d7` Trigger GitHub contribution reindex
- `b7b3fc8` chore: force sync

## Remotes

| Remote | Tip of `main` | Notes |
| --- | --- | --- |
| `origin` `https://github.com/rajatrsrivastav/Nexorithm.git` | `b7b3fc8` | This is the configured push destination |
| `https://github.com/anand24mishra/Nexorithm` | `7552d4966ae81311e507de9363b4e5c8453430b5` | Public. Not configured as a remote. Local `fcb2542` is not in this repository |

The portfolio tip has the same commit message as local HEAD and a different hash. Its parent is `9b0d6a0` `chore: finalize repository configuration`. These histories are not a fast-forward of each other.

## Local backups already created

These refs are local only. They were not pushed. `git stash create -u` does not include gitignored files. `.env` and `monitoring/metrics-token` are ignored.

- Branch `backup/main-fcb2542-2026-10-28` points at `fcb2542`
- `refs/backup/worktree-2026-10-28` is `c95cf6b8d87333f2a23537f08b90b88b246e4ff1`, taken before the reliability edits
- `refs/backup/worktree-reliability-2026-10-28` is `7ed5441662c9ae686d16bbeb2c771ec14210b1a7`, taken after the reliability docs

## Do not run

- `git reset --hard`
- `git push --force`
- `git push origin main`
- A push to `rajatrsrivastav/Nexorithm` unless that owner asked for this tree
- A push of local `main` onto `anand24mishra/Nexorithm` `main`

## Recommended publication, after you authorize a commit

1. Keep the backup refs above.
2. Create a new local branch from the current working tree. Do not check out a remote branch over these files.
3. Commit the engineering tree on that branch. Leave `.env` and `monitoring/metrics-token` untracked.
4. Add the portfolio repository as a separate remote only if you want that GitHub account to receive the branch. Adding a remote writes `.git/config`.
5. Push the new branch, not `main`, and do not use `--force`.
6. Open a pull request against the history you actually want. Replaying `b7b3fc8` or `7552d49` needs a merge or a cherry-pick that you review. It is not a fast-forward.

```bash
git switch -c reliability-verified
git add -A
git restore --staged .env monitoring/metrics-token
git commit -m "Record the verified judge, sandbox reaper, and reliability evidence"
git remote add portfolio https://github.com/anand24mishra/Nexorithm.git
git push -u portfolio reliability-verified
```

Run those only when you want the commit and the portfolio remote. Until then the work stays in this working tree and in the local backup refs.
