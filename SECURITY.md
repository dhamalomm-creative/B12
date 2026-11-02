# Security Policy

B12 Health Tracker handles personal health data, so we take security reports seriously.

## Supported versions

Only the latest code on `main` (and the version deployed from it) receives security fixes.

## Reporting a vulnerability

**Do not open a public GitHub issue for security problems.**

Report privately through GitHub: **Security → Advisories → Report a vulnerability** on this repository. Please include:

- What the issue is and where it is (endpoint, file, page)
- Steps to reproduce or a proof of concept
- The impact you think it has
- Any `correlationId` from an error response

Please do not access, change or delete other users' data, run denial-of-service tests, or use automated scanners against the production deployment.

## What to expect

| Step | Target |
|---|---|
| Acknowledgement | within 3 working days |
| Initial assessment | within 7 working days |
| Fix for high / critical issues | as soon as possible, normally within 30 days |

We will keep you updated and credit you in the changelog if you would like.

## Scope

In scope: the API (`B12-Project/backend/node-service`), the web app (`B12-Project/frontend-web`), the database schema and migrations, and the deployment configuration in this repository.

Out of scope: the Android app (report to its own repository), third-party platforms (Supabase, Vercel, Railway), and issues that need a compromised device or browser.

## How the app is protected

See [docs/SECURITY.md](docs/SECURITY.md) for the security controls and known limitations.
