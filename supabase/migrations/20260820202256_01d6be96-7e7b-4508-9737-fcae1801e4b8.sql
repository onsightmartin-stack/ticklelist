CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('daily-peakbagger-scrape') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-peakbagger-scrape');

SELECT cron.schedule(
  'daily-peakbagger-scrape',
  '20 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ticklelist.org/api/public/hooks/scrape-peakbagger?limit=12',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4andvdXN2aGh0cnNiamVvb2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTM1MTksImV4cCI6MjA5MDEyOTUxOX0.wwsnYQclpSbUdoDM_i6DkPlbpYyOjt0YQ5adcsE8L0E"}'::jsonb,
    body := '{"source": "cron"}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);