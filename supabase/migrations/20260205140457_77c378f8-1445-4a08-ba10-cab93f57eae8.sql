-- Remove is_core restriction from all modules - make all modules available
UPDATE modulos SET is_core = false WHERE is_core = true;

-- Update empresa_modulos to remove obrigatorio restriction
UPDATE empresa_modulos SET obrigatorio = false WHERE obrigatorio = true;