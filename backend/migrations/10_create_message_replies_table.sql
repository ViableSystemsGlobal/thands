-- Message replies table
-- Stores admin replies to contact messages, sent via SMTP

CREATE TABLE IF NOT EXISTS message_replies (
    id          SERIAL PRIMARY KEY,
    message_id  INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    reply_body  TEXT NOT NULL,
    sent_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    sent_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_replies_message_id ON message_replies(message_id);
CREATE INDEX IF NOT EXISTS idx_message_replies_sent_at    ON message_replies(sent_at);
