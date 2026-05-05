CREATE TABLE t_p73453428_betting_site_dev_1.push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p73453428_betting_site_dev_1.users(id),
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_push_subs_user_id ON t_p73453428_betting_site_dev_1.push_subscriptions(user_id);
