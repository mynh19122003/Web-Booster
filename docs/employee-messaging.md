# Employee messaging

> Historical implementation note: SQLite and employee-grant commands below describe the former backend. The current preview uses in-memory mock state and fixture employee accounts; see the README.

Customers sign in at `/login` and use `/messages`, `/support`, or the floating support chat to create a request. Each request contains a subject, game, and first message. Messages are saved in the same SQLite database as accounts; they are shared across browsers and survive restarts.

Employees can sign in at `/login` or `/employee/login`; their database role always sends them to `/employee`. User/customer accounts default to `/profile`, including when they use the employee form. Employees can filter requests, accept an unassigned request, reply to its customer, and mark it completed. Only the assigned employee can reply or complete that request. Customers can reopen a completed request, returning it to the unassigned queue. Conversations refresh every three seconds while open. The workspace also links to the [Riot data console](./employee-riot-data.md).

## Verification — 11/10/2026

Rechecked the production preview with separate customer and employee browser sessions and an isolated SQLite database. Employee replies appeared in the customer's `/messages` log without reloading; customer replies appeared in `/employee` without reloading. Sending with the button and Enter worked, messages survived page reloads, and the customer could send and receive on a 390px mobile viewport. Employee replies require accepting the request first. Completed conversations disable sending; customer reopening returns the request to the queue, and the employee can accept it and reply again. Both authenticated sessions reported no page errors.

`npm run test:auth-riot` passed all 33 tests, including two-way messaging, customer ownership and rejection of replies from a different employee. No real user conversations or account roles were changed. Review screenshots and scripts are stored under the ignored `output/playwright/messaging-*` paths. No application code fix was necessary.

## Grant employee access

Register an email/password account through the normal signup screen. Then run this command on the server hosting the application:

```powershell
npm run employee:grant -- --email staff@example.com
```

The command uses `AUTH_DATABASE_PATH` if configured, otherwise `.data/auth.sqlite`. It grants access to an existing account and invalidates its previous sessions. The employee then signs in at `/employee/login` using their own password. There are no default staff credentials or public employee registration endpoint.

To revoke access:

```powershell
npm run employee:grant -- --email staff@example.com --revoke
```

## Access and storage

The role is read from the database on every authenticated request. Signup and Google account creation always create customer accounts, regardless of submitted role fields. Customers can list and read only their own requests. Employee actions are checked on the server, and claim updates are atomic so two employees cannot accept the same request. Chat mutations require a matching same-origin header. GET responses are not cached.

Deploy with persistent storage for the SQLite database. Multiple application instances must share a suitable database service before scaling across hosts; this implementation uses one local SQLite database. Revoking an employee does not discard their conversations. Existing assigned requests remain recorded with that employee; restore their access to let them finish those requests.
