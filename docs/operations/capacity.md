# Capacity & free-tier ceilings

Where the free tiers hit a wall, and the upgrade trigger.

| Service | Free-tier ceiling | First bottleneck | Mitigation |
|---------|-------------------|------------------|------------|
| Supabase | 2 GB egress/mo, 500 MB DB | `browse` query egress | Indexes (002); paginate browse; upgrade to Pro ($25/mo) on first paying supplier |
| Vercel | 100K function invocations/day | per-request auth lookups | `app_metadata` cache (003) removes the extra lookup |
| Resend | 100 emails/day, 3K/mo | Monday order spikes | Only 3 email events (Workstream D); batch if needed |
| Sentry | 5K events/mo | bot-scan noise | Instrument server actions + error boundary only, never the proxy hot path |

## Upgrade trigger

Move Supabase to Pro the day the first paying supplier is activated. Everything
else stays on free tier until traffic justifies otherwise.

## Cookie / analytics posture

The app is cookieless apart from strictly-necessary auth/session cookies, so no
consent banner is required. If you add analytics, choose a cookieless tool
(e.g. Vercel Web Analytics or Plausible) to keep it that way.
