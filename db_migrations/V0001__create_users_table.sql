CREATE TABLE t_p73453428_betting_site_dev_1.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    balance NUMERIC(12,2) DEFAULT 0.00,
    bonus_balance NUMERIC(12,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'silver' CHECK (status IN ('silver', 'gold', 'platinum', 'diamond')),
    rating_points INTEGER DEFAULT 0,
    total_bets INTEGER DEFAULT 0,
    won_bets INTEGER DEFAULT 0,
    lost_bets INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON t_p73453428_betting_site_dev_1.users(email);
CREATE INDEX idx_users_username ON t_p73453428_betting_site_dev_1.users(username);
