-- Fix search_path for update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix search_path for update_garden_availability function
CREATE OR REPLACE FUNCTION public.update_garden_availability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    UPDATE public.gardens
    SET available_plots = available_plots - 1
    WHERE id = NEW.garden_id AND available_plots > 0;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
      UPDATE public.gardens
      SET available_plots = available_plots - 1
      WHERE id = NEW.garden_id AND available_plots > 0;
    ELSIF OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
      UPDATE public.gardens
      SET available_plots = available_plots + 1
      WHERE id = NEW.garden_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' THEN
    UPDATE public.gardens
    SET available_plots = available_plots + 1
    WHERE id = OLD.garden_id;
  END IF;
  
  RETURN NEW;
END;
$$;