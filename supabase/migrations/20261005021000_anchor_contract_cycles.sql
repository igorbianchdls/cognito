BEGIN;
CREATE FUNCTION erp.proximo_ciclo_contrato(inicio date, periodicidade text, referencia date) RETURNS date
LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog AS $$
DECLARE meses int; destino date; ultimo int;
BEGIN
 IF periodicidade='semanal' THEN RETURN inicio+7; END IF;
 IF periodicidade='quinzenal' THEN RETURN inicio+15; END IF;
 meses:=CASE periodicidade WHEN 'mensal' THEN 1 WHEN 'bimestral' THEN 2 WHEN 'trimestral' THEN 3 WHEN 'semestral' THEN 6 WHEN 'anual' THEN 12 END;
 IF meses IS NULL THEN RAISE EXCEPTION 'Periodicidade invalida' USING ERRCODE='23514'; END IF;
 destino:=(date_trunc('month',inicio)+make_interval(months=>meses))::date;
 ultimo:=extract(day from destino+interval '1 month'-interval '1 day');
 RETURN destino+least(extract(day from referencia)::int,ultimo)-1;
END $$;
DO $$ DECLARE definition text; anterior text;
BEGIN
 definition:=pg_get_functiondef('erp.validar_contrato_versionado()'::regprocedure);
 anterior:='(NEW.periodo_inicio+CASE v.periodicidade WHEN ''semanal'' THEN interval ''7 days'' WHEN ''quinzenal'' THEN interval ''15 days'' WHEN ''mensal'' THEN interval ''1 month'' WHEN ''bimestral'' THEN interval ''2 months'' WHEN ''trimestral'' THEN interval ''3 months'' WHEN ''semestral'' THEN interval ''6 months'' ELSE interval ''1 year'' END-interval ''1 day'')::date';
 IF position(anterior in definition)=0 THEN RAISE EXCEPTION 'Definicao de contrato inesperada'; END IF;
 EXECUTE replace(definition,anterior,'(erp.proximo_ciclo_contrato(NEW.periodo_inicio,v.periodicidade,v.vigencia_inicio)-1)');
END $$;
COMMIT;
