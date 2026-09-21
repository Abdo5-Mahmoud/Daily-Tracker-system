# Continuous Auto Git Push Rule

> **Scope**: All tasks, sessions, and workflows in this workspace.

## Directive
- **Automatic Sync**: Any completed code change, test passage, challenge completion, or documentation update MUST be automatically staged, committed with a clean semantic commit message, and pushed to GitHub (`origin/main`).
- Do NOT wait for the user to explicitly ask "push to github". Proactively execute `git add`, `git commit`, and `git push` as part of concluding any task.
- Ensure PowerShell command syntax is used (`git add ...; git commit -m "..."; git push origin main`).
