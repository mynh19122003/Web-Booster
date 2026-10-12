# Coach accounts and availability

Employees enter `/employee/coaches` from their workspace. Each ordinary employee can create one private coach draft, edit their own information, connect their own Riot account, and publish/unpublish the profile. New profiles start offline with no reviews or MVP badge. Public profiles appear in `/coaches` and game coaching directories.

The Online/Offline switch means **accepting coaching sessions**, not browser connection presence. It saves immediately, disables while pending, and retains the last confirmed value on failure. Public directories and profiles refresh every 15 seconds while visible, and immediately on focus/visibility changes. Turning a draft online does not publish it.

SQLite stores ownership in `employee_coaches` (unique employee and unique slug), profile overrides in `coach_profiles`, and Riot links in `coach_riot_accounts`. Ownership, profile publication and employee role are checked on the server. Anonymous/public APIs exclude private or revoked employee profiles. Rating/review count/MVP and reset are unavailable to ordinary employees.

Capabilities are separate from the authentication role, in `coach_access`:

- `own` (default): manage only the account's profile.
- `demo`: manage only unassigned sample profiles from `data/coaches.ts`. Sample changes remain in the demo profiles; they cannot modify employee-owned profiles.
- `admin`: manage all active profiles and assign an unassigned sample coach to an employee without a profile. Assignment preserves existing overrides and Riot links. Reassignment is refused.

Grant capabilities explicitly from the project terminal:

```powershell
npm run employee:grant -- --email staff@example.com
npm run coach:access -- --email staff@example.com --scope own
npm run coach:access -- --email admin@example.com --scope admin
npm run coach:access -- --email employee@ascend.gg --scope demo
```

Demo privileges are not inferred from email/name or accepted from API request bodies. The local existing Demo Employee account has been explicitly granted `demo`. Admin assignment UI appears only for an account explicitly granted `admin`.

Public sample profiles, coaching statistics and reviews retain the site's existing demo designation. Availability does not imply live browser presence. Tests use an isolated temporary SQLite database, mocked Riot HTTP, and real API handlers.
