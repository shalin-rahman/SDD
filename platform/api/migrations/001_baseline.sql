-- Baseline schema marker for migrate.py tracking.
-- Fresh environments may still use init_db() create_all at startup;
-- stamp 001 after first deploy to align migration history.

SELECT 1;
