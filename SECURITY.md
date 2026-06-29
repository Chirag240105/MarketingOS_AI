# Security

The local `.env` file contains deployment credentials and must never be committed,
zipped, pasted into tickets, or shared in chat. Treat any credential that has been
present in a local `.env` as secret material and rotate it outside this repository
if it may have been exposed.

When sharing this project, use GitHub or another source-control remote. Do not
share archives that include `.env`, `node_modules`, `.next`, or `.git`.

Before deploying cron routes, set `CRON_SECRET` to a long random value. The literal
placeholder `replace-with-a-long-random-secret` is rejected at runtime.
