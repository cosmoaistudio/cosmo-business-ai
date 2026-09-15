-- =============================================================================
-- Migration 030: Company onboarding fields on organizations
-- =============================================================================
-- Cosmo Business AI
--
-- STATUS: PROPOSTA — aplicar manualmente no Supabase após revisão.
--
-- Reaproveita public.organizations + public.profiles (009).
-- Não cria tabela companies/memberships duplicada.
--
-- Propósito:
--   • Campos de negócio para o wizard de onboarding (3 etapas)
--   • Flag onboarding_completed para gate pós-login
--   • RPC complete_company_onboarding (security definer) — clientes não têm
--     policy UPDATE em organizations hoje
--
-- Compatibilidade:
--   • Orgs existentes com nome <> 'Minha Empresa' → onboarding_completed = true
--   • Novas orgs (trigger handle_new_user) → onboarding_completed = false (default)
-- =============================================================================


-- =============================================================================
-- 1. Colunas na organização
-- =============================================================================

alter table public.organizations
    add column if not exists business_type text;

alter table public.organizations
    add column if not exists segment text;

alter table public.organizations
    add column if not exists city text;

alter table public.organizations
    add column if not exists whatsapp text;

alter table public.organizations
    add column if not exists logo_url text;

alter table public.organizations
    add column if not exists onboarding_completed boolean not null default false;

-- Operações já em produção não devem ser forçadas ao wizard
update public.organizations
set onboarding_completed = true
where onboarding_completed = false
  and coalesce(nullif(trim(name), ''), '') <> ''
  and name is distinct from 'Minha Empresa';


-- =============================================================================
-- 2. RPC — completar onboarding da empresa do usuário autenticado
-- =============================================================================

create or replace function public.complete_company_onboarding(
    p_name text,
    p_business_type text,
    p_segment text,
    p_city text default null,
    p_whatsapp text default null,
    p_logo_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_org_id uuid;
    v_role text;
    v_name text;
    v_type text;
    v_segment text;
begin
    v_org_id := public.get_my_organization_id();
    if v_org_id is null then
        raise exception 'Usuário sem organização vinculada';
    end if;

    v_role := public.get_my_role();
    if v_role is null or v_role not in ('admin', 'manager') then
        raise exception 'Permissão insuficiente para configurar a empresa';
    end if;

    v_name := nullif(trim(coalesce(p_name, '')), '');
    v_type := nullif(trim(coalesce(p_business_type, '')), '');
    v_segment := nullif(trim(coalesce(p_segment, '')), '');

    if v_name is null then
        raise exception 'Nome da empresa é obrigatório';
    end if;
    if v_type is null then
        raise exception 'Tipo de negócio é obrigatório';
    end if;
    if v_segment is null then
        raise exception 'Segmento é obrigatório';
    end if;

    update public.organizations
    set
        name = v_name,
        business_type = v_type,
        segment = v_segment,
        city = nullif(trim(coalesce(p_city, '')), ''),
        whatsapp = nullif(trim(coalesce(p_whatsapp, '')), ''),
        logo_url = nullif(trim(coalesce(p_logo_url, '')), ''),
        onboarding_completed = true,
        updated_at = now()
    where id = v_org_id;

    perform public.log_audit(
        'organization.onboarding_completed',
        'organization',
        v_org_id,
        jsonb_build_object(
            'name', v_name,
            'business_type', v_type,
            'segment', v_segment
        )
    );

    return jsonb_build_object(
        'ok', true,
        'organization_id', v_org_id,
        'onboarding_completed', true
    );
end;
$$;

revoke all on function public.complete_company_onboarding(text, text, text, text, text, text) from public;
grant execute on function public.complete_company_onboarding(text, text, text, text, text, text) to authenticated;


-- =============================================================================
-- FIM 030
-- =============================================================================
