# Checkout account details and employee workspace

The checkout preview submits service fulfillment requests to SQLite through `POST /api/checkout`. Payment remains a local mock: this endpoint does not charge customers or verify payment. Account purchases and standalone coaching retain their existing checkout flow. Boost requests require a signed-in customer. Solo services collect a Riot ID, login username and password below the billing fields. Duo/coaching services do not collect login credentials. League of Legends orders also allow a Flash slot preference, and all fulfillment requests allow private customer notes.

Credentials and fulfillment specifications are encrypted together with AES-256-GCM. The request ID is authenticated as additional data. Neither the chat transcript nor the local orders/cart stores contain credentials or private customer notes. Submission IDs make retries from the same checkout instance idempotent; the server order number also appears in the local mock receipt. Confirmation links directly to the order conversation.

Customers receive their own conversations without the private order payload. The employee workspace presents the order panel beside chat on desktop and above it on smaller screens. Only the employee who accepts the request can retrieve its private specifications and credentials. Other employees can inspect the queue and shared conversation, but receive no order details. Passwords start masked and reset when switching requests. Existing support conversations have no order details and continue to work normally.

## Encryption configuration

In production, set `ORDER_CREDENTIALS_KEY` to a server-only 64-character hexadecimal key (32 random bytes). For example, generate a key locally using `node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"`, then place it in the deployment's secret configuration. Never use a `NEXT_PUBLIC_` variable or commit the value. Production submissions fail closed with `credentials-unavailable` if the key is missing or invalid; no request or mock payment is completed.

Development without that variable creates `order-credentials.key` beside `AUTH_DATABASE_PATH`, or in the ignored `.data` directory by default. Protect and retain that file with the database. Production backups need the database and the corresponding configured key. Changing or losing the key makes existing private order details unreadable; key rotation requires migrating existing encrypted rows. Serve production traffic through HTTPS.

`request_order_details` is created automatically alongside the existing chat tables. There is no plaintext credentials column. This remains a single-host SQLite implementation, matching the existing authentication and chat backend.

## Verification

Run `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test:auth-riot`. The backend suite covers validation, session/role/origin checks, encrypted persistence, idempotent retries, assigned-employee access, customer response redaction, chat continuity, and missing production encryption configuration.
