# Legal & compliance checklist (Serbia + EU)

This is operational guidance, not legal advice. Before charging any user, have a
Serbian lawyer review the software-fee / payment-services and fiscalization
questions specifically.

## Done in the app

- Privacy Policy at `/privacy` - bilingual (sr/en), GDPR + ZZPL, lawful basis,
  processors, retention, rights.
- Terms of Service at `/terms` - bilingual, marketplace non-party clause,
  software-fee disclosure, dispute handling, P2B ranking transparency,
  complaint email, Serbian governing law.
- Point-of-collection notice on the registration form linking to both.
- Right-to-deletion: account-deletion button in settings (service-role).

## Founder to-dos before public launch

1. Replace the `[Naziv pravnog lica ...]` placeholders in `/privacy` and
   `/terms` with your registered entity (name, PIB, address).
2. Confirm contact addresses: `privatnost@procure-link.com` (privacy) and
   `podrska@procure-link.com` (complaints / P2B). Create the mailboxes.
3. Sign the **Supabase DPA** (Article 28). Repeat for Vercel, Resend, Sentry,
   and Paddle when billing launches.
4. Set `SUPABASE_SERVICE_ROLE_KEY` so the deletion endpoint works (see
   `006_account_deletion.sql` for the cascade that backs it).
5. Confirm cookie posture: the app is cookieless apart from auth/session
   cookies (strictly necessary, no consent banner required). Re-check before
   adding any third-party analytics; prefer a cookieless analytics tool.
6. Lawyer review of the fee model and Serbian fiscalization obligations.

## Data processors

| Processor | Purpose | Region |
|-----------|---------|--------|
| Supabase | Database + auth | EU |
| Vercel | App hosting | EU/Global |
| Resend | Transactional email | EU/US |
| Sentry | Error monitoring | EU/US |
| Paddle | Billing (when enabled) | Global (merchant of record) |
