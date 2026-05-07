CREATE TABLE IF NOT EXISTS t_p73453428_betting_site_dev_1.verification_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p73453428_betting_site_dev_1.users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    full_name VARCHAR(255),
    birth_date DATE,
    doc_type VARCHAR(50),
    doc_number VARCHAR(100),
    doc_photo_front TEXT,
    doc_photo_back TEXT,
    selfie_photo TEXT,
    reject_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_user ON t_p73453428_betting_site_dev_1.verification_requests(user_id);
