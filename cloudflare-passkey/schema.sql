CREATE TABLE IF NOT EXISTS passkey_credentials (credential_id TEXT PRIMARY KEY,member_id TEXT NOT NULL,public_key TEXT NOT NULL,counter INTEGER NOT NULL DEFAULT 0,transports TEXT,device_type TEXT,backed_up INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL DEFAULT (unixepoch()),last_used_at INTEGER);
CREATE INDEX IF NOT EXISTS idx_passkey_member ON passkey_credentials(member_id);
CREATE TABLE IF NOT EXISTS passkey_challenges (challenge_id TEXT PRIMARY KEY,member_id TEXT NOT NULL,challenge TEXT NOT NULL,purpose TEXT NOT NULL,expires_at INTEGER NOT NULL,created_at INTEGER NOT NULL DEFAULT (unixepoch()));
CREATE INDEX IF NOT EXISTS idx_passkey_challenge_expiry ON passkey_challenges(expires_at);
