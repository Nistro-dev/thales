-- This migration adds:
-- 1. caption field to MovementPhoto
-- 2. relation between Reservation and ProductMovement
-- 3. relation between ProductMovement and User (performedByUser)

-- Add caption field to MovementPhoto (already exists from previous work, but adding for safety)
-- Note: This column may already exist, so we use IF NOT EXISTS logic via DO block

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'MovementPhoto' AND column_name = 'caption') THEN
        ALTER TABLE "MovementPhoto" ADD COLUMN "caption" TEXT;
    END IF;
END $$;

-- The relations are added at the schema level and don't require SQL changes
-- since the foreign keys already exist (reservationId on ProductMovement,
-- and performedBy on ProductMovement which references User.id)
