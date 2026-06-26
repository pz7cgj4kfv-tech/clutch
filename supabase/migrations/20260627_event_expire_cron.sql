-- ============================================================================
-- EVENTS — expiration serveur des demandes non répondues (backstop du balayage client)
-- Modèle events-engine (prouvé) : une demande 'requested'/'waitlisted' non traitée à temps → 'expired'
-- (dignité/anti-sonde : JAMAIS 'declined'). Délai : spontané (event ≤18h) = min(1h, début−30min) ; planifié = 6h.
--
-- ⚠️ À APPLIQUER AVEC DAVID (SQL Editor). Le client balaie déjà à l'ouverture ; ce cron est le filet de
-- sécurité quand personne n'ouvre l'app. Nécessite l'extension pg_cron (déjà active : cron `expire-clutches`).
-- ============================================================================

create or replace function public.expire_event_requests()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.event_participants ep
     set state = 'expired', responded_at = now()
    from public.events e
   where ep.event_id = e.id
     and ep.state in ('requested','waitlisted')
     and now() >= ep.requested_at + (
       case
         -- spontané (event dans ≤18h) : min(1h, début−30min) à partir de la demande
         when e.starts_at is not null and e.starts_at <= now() + interval '18 hours'
           then least(interval '60 minutes', greatest(interval '0', (e.starts_at - interval '30 minutes') - ep.requested_at))
         -- planifié / sans date : 6h
         else interval '360 minutes'
       end
     );
end; $$;

-- Toutes les 10 min (aligné avec expire-clutches). Si le job existe déjà, on le remplace.
select cron.unschedule('expire-event-requests') where exists (select 1 from cron.job where jobname='expire-event-requests');
select cron.schedule('expire-event-requests', '*/10 * * * *', $$ select public.expire_event_requests() $$);
