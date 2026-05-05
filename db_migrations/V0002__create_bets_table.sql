CREATE TABLE t_p73453428_betting_site_dev_1.bets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p73453428_betting_site_dev_1.users(id),
    event_id INTEGER NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    league VARCHAR(100),
    sport VARCHAR(50),
    outcome_type VARCHAR(10) NOT NULL,
    outcome_label VARCHAR(20) NOT NULL,
    odds NUMERIC(6,2) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    potential_win NUMERIC(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'win', 'loss', 'cancelled')),
    placed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bets_user_id ON t_p73453428_betting_site_dev_1.bets(user_id);
CREATE INDEX idx_bets_status ON t_p73453428_betting_site_dev_1.bets(status);
