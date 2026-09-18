-- The store's tables are not an API.
--
-- Supabase publishes every table in `public` over PostgREST (/rest/v1/) to
-- whoever holds the anon key — the key every browser is given — unless row
-- level security says otherwise. None of these tables had it, and Supabase's
-- default privileges had granted anon and authenticated full read and write
-- on each one as Prisma created it. Checked from outside with the anon key
-- on 2026-09-18: GET /rest/v1/customers answered 200 with names, roles and
-- emails, and the privilege table said the same key could have written
-- prices, zeroed coupon counts or made a customer an admin.
--
-- The app never speaks to these tables through the API: it goes to Postgres
-- through Prisma as `postgres`, the tables' owner, which bypasses row level
-- security — so enabling it, with no policies, shuts the API out and changes
-- nothing for the app. The privileges are revoked as well, so the API
-- answers "permission denied" rather than an empty list and a policy added
-- by mistake later would have nothing to open; and the default privileges
-- are changed so a table a later migration creates starts closed too. A new
-- table still has to enable row level security itself — the inventory
-- (npm run db:inventory) names any that has not.
--
-- The one function, arabic_key, was callable as an RPC by anyone; it is
-- harmless, but nothing outside the database needs it.

-- Row level security, no policies: anon and authenticated see no rows.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "addresses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "authors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "books" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cart_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contact_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "coupons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "handout_cart_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "handout_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "handout_order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "handout_reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "handout_wishlist_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "handouts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "newsletter_subscribers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "publishers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "store_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "wishlist_items" ENABLE ROW LEVEL SECURITY;

-- No privileges for the API roles on what exists today.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated, PUBLIC;

-- Nor on what later migrations create.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated, PUBLIC;
