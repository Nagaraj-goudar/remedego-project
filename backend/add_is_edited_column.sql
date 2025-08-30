-- Add is_edited column to messages table
ALTER TABLE messages ADD COLUMN is_edited BOOLEAN NOT NULL DEFAULT FALSE;

-- Update existing messages to have is_edited = false
UPDATE messages SET is_edited = FALSE WHERE is_edited IS NULL;
