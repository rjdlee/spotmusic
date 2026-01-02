### Phase 1: Ingestion & Strategy (The "PM Agent")

*Before a single line of code is written.*

* [ ] **Validation:** Is the issue/idea clearly defined in docs/tasks? If not, the agent must comment asking for clarification.
* [ ] **Categorization:** Label as `bug`, `feature`, `refactor`, or `security`.
* [ ] **Context Gathering:** Scan the repository for existing patterns. (e.g., "How did we implement the last API endpoint?")
* [ ] **Spec Generation:** Create a **Technical Design Doc** in `docs/specs/` outlining the plan.

### Phase 2: Implementation (The "Coder Agent")

*Writing the logic within a sandboxed environment.*

* [ ] **Environment Setup:** Create a clean `git worktree`.
* [ ] **TDD (Test Driven Development):** Write a failing test that represents the bug or the new feature.
* [ ] **Core Logic:** Implement the fix or feature.
* [ ] **Complexity Check:** Ensure the solution doesn't introduce unnecessary  complexity where  or  is possible.
* [ ] **Instrumentation:** Add logs. If it’s a new feature, add a "Success Metric" log (e.g., `logger.info("payment_processed", {amount: x})`).

### Phase 3: The "After-Code" (The "SRE & Doc Agent")

*This is where most autonomous systems fail. We won't.*

* [ ] **Documentation:** * Update the `README.md` and docs.
* Generate/Update OpenAPI/Swagger specs.
* Update the `CHANGELOG.md`.

* [ ] **Pre-mortem:** Proactively identify issues that could occur after deploying this code.
* [ ] **Migration Scripts:** If the database schema changes, generate a versioned migration file (e.g., `20260101_add_user_id.sql`).
* [ ] **Security Audit:** Run a static analysis tool (SAST) to ensure no secrets or vulnerabilities were leaked.
* [ ] **Dependency Check:** Did this new code require a new package? Verify the license and bundle size impact.

### Phase 4: Verification & Delivery (The "QA Agent")

*The final gatekeeper.*

* [ ] **Integration Tests:** Run the full suite, not just the new tests.
* [ ] **Performance Benchmarking:** Compare the execution time of the new code against the `main` branch.
* [ ] **Self-Review:** The agent must "read" its own code and provide a summary of *why* this was the best approach.
* [ ] **Merge & Cleanup:** Merge the PR, delete the temporary branch/worktree, and close the ticket with a summary of the changes.
