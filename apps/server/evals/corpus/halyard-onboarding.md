Halyard project: onboarding notes for new engineers

Halyard is the internal service that schedules and tracks warehouse pick routes. It is a Go monolith with a Postgres database and a small React admin UI. These notes collect what new people ask about in their first week.

Access. Ask your lead to add you to the halyard-dev group in the identity portal. That one group grants read access to the repository, the staging database and the logs. Production database access is never granted by default; request it per incident through the break-glass form, and it expires after four hours.

Running locally. Clone the repository and run make dev. It starts Postgres and a fake warehouse feed in containers and seeds the database with a small warehouse called TEST-01 that has 40 aisles. The admin UI comes up on port 8083. If the seed fails with a migration lock error, a previous run died halfway; run make reset-db and try again.

Tests. make test runs the unit tests in under a minute. The route optimiser has a separate, slow suite, make test-routes, which replays a week of real pick data and takes about twenty minutes. CI runs it only on the main branch and nightly, so run it yourself before merging anything that touches the optimiser package.

Deploys. Merges to main deploy to staging automatically. Production deploys happen twice a week, Tuesday and Thursday mornings, from a release branch cut the evening before. Never deploy on Friday; warehouse volume peaks at the weekend, and a broken optimiser means pickers walking twice as far.

People. Ines owns the optimiser and is the person to ask about route quality. Kwame owns the warehouse feed integration. For anything about the admin UI, ask in the halyard-frontend channel.

First task. Every new engineer starts with a ticket labelled good-first-route, which is a small, well-understood change to the optimiser's scoring. It is chosen so that you touch the slow test suite and the release process in your first two weeks.
