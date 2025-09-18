-- Promo audit table (idempotent)
CREATE TABLE IF NOT EXISTS public.promo_activations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL,
  code text NOT NULL,
  activated_at timestamptz DEFAULT now()
);


