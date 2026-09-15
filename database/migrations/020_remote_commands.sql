-- =============================================================================
-- Migration 020: Infraestrutura de Comandos Remotos — Produção
-- =============================================================================
-- Cosmo Business AI — Sprint 021
--
-- Propósito:
--   Fila persistente de comandos remotos para orquestração entre Desktop Agent,
--   Mobile App, Automações, IA e integrações API em ambiente multi-tenant SaaS.
--
-- Fluxo:
--   Mobile / IA / Automação / API  →  remote_commands  →  Desktop Agent
--                                              ↕
--                                    Supabase Realtime
--
-- Componentes:
--   • public.desktop_agents   — registro de agentes desktop por organização
--   • public.remote_commands  — fila de comandos com prioridade e expiração
--   • public.cash_sessions    — sessões de caixa (compatibilidade PDV/remoto)
--
-- Funções:
--   • set_remote_command_defaults()
--   • set_remote_commands_updated_at()
--   • sync_remote_command_legacy_columns()
--   • acknowledge_remote_command(uuid, uuid)
--   • finalize_remote_command(uuid, text, jsonb, text)
--   • get_pending_remote_commands(integer)
--   • get_pending_commands_for_agent(uuid, integer)
--   • claim_pending_commands_for_agent(uuid, integer)
--   • cleanup_expired_remote_commands(integer)
--
-- Segurança:
--   RLS via public.get_my_organization_id() para role authenticated.
--
-- Realtime:
--   Tabelas publicadas em supabase_realtime: remote_commands, desktop_agents.
--
-- Idempotência:
--   CREATE IF NOT EXISTS, DROP IF EXISTS em policies/triggers, CREATE OR REPLACE
--   em funções, ALTER ADD COLUMN IF NOT EXISTS para upgrades incrementais.
-- =============================================================================

-- =============================================================================
-- EXTENSÕES
-- =============================================================================

create extension if not exists pgcrypto;

-- =============================================================================
-- TABELA: desktop_agents
-- =============================================================================

create table if not exists public.desktop_agents (
    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null
        references public.organizations(id) on delete cascade,

    device_name text not null default 'Cosmo Desktop',

    machine_id text not null,

    hostname text,

    platform text,

    app_version text,

    status text not null default 'offline'
        constraint desktop_agents_status_check
        check (status in ('online', 'offline', 'busy', 'maintenance')),

    last_seen_at timestamptz not null default now(),

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint desktop_agents_org_machine_unique
        unique (organization_id, machine_id)
);

comment on table public.desktop_agents is
    'Agentes Cosmo Desktop registrados por organização. Suporta múltiplos computadores por tenant.';

comment on column public.desktop_agents.id is
    'Identificador único do agente desktop.';

comment on column public.desktop_agents.organization_id is
    'Organização (tenant) proprietária do agente.';

comment on column public.desktop_agents.device_name is
    'Nome amigável exibido no painel (ex: Caixa 1, Cozinha).';

comment on column public.desktop_agents.machine_id is
    'Identificador estável da máquina (UUID local persistido pelo Desktop).';

comment on column public.desktop_agents.hostname is
    'Hostname do sistema operacional no momento do registro.';

comment on column public.desktop_agents.platform is
    'Plataforma do agente: win32, darwin, linux.';

comment on column public.desktop_agents.app_version is
    'Versão do Cosmo Desktop em execução.';

comment on column public.desktop_agents.status is
    'Estado do agente: online, offline, busy, maintenance.';

comment on column public.desktop_agents.last_seen_at is
    'Timestamp do último heartbeat recebido.';

comment on column public.desktop_agents.metadata is
    'Metadados extensíveis: impressora, IP, capacidades, etc.';

comment on column public.desktop_agents.created_at is
    'Data de criação do registro do agente.';

comment on column public.desktop_agents.updated_at is
    'Data da última atualização do registro do agente.';

-- =============================================================================
-- TABELA: remote_commands
-- =============================================================================

create table if not exists public.remote_commands (
    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null
        references public.organizations(id) on delete cascade,

    created_by uuid
        references auth.users(id) on delete set null,

    requested_by uuid
        references auth.users(id) on delete set null,

    target text not null default 'desktop',

    command text not null,

    payload jsonb not null default '{}'::jsonb,

    status text not null default 'pending',

    source text not null default 'mobile',

    priority integer not null default 0,

    agent_id uuid,

    desktop_agent_id uuid,

    result jsonb,

    error_message text,

    execution_time_ms integer,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    started_at timestamptz,

    completed_at timestamptz,

    processed_at timestamptz,

    acknowledged_at timestamptz,

    expires_at timestamptz
);

alter table public.remote_commands
    drop constraint if exists remote_commands_command_check;

alter table public.remote_commands
    add constraint remote_commands_command_check
    check (command in (
        'PRINT_ORDER',
        'REPRINT_ORDER',
        'OPEN_DRAWER',
        'CLOSE_CASH_REGISTER',
        'OPEN_CASH_REGISTER',
        'PAUSE_PRODUCT',
        'ACTIVATE_PRODUCT',
        'PAUSE_OPTION',
        'ACTIVATE_OPTION',
        'UPDATE_STOCK',
        'RUN_BACKUP',
        'RESTART_PRINTER'
    ));

alter table public.remote_commands
    drop constraint if exists remote_commands_status_check;

alter table public.remote_commands
    add constraint remote_commands_status_check
    check (status in (
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelled'
    ));

alter table public.remote_commands
    drop constraint if exists remote_commands_source_check;

alter table public.remote_commands
    add constraint remote_commands_source_check
    check (source in (
        'desktop',
        'mobile',
        'automation',
        'ai',
        'api',
        'admin',
        'system'
    ));

alter table public.remote_commands
    drop constraint if exists remote_commands_priority_check;

alter table public.remote_commands
    add constraint remote_commands_priority_check
    check (priority >= 0 and priority <= 100);

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'remote_commands_agent_id_fkey'
          and conrelid = 'public.remote_commands'::regclass
    ) then
        alter table public.remote_commands
            add constraint remote_commands_agent_id_fkey
            foreign key (agent_id)
            references public.desktop_agents(id)
            on delete set null;
    end if;
end $$;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'remote_commands_desktop_agent_id_fkey'
          and conrelid = 'public.remote_commands'::regclass
    ) then
        alter table public.remote_commands
            add constraint remote_commands_desktop_agent_id_fkey
            foreign key (desktop_agent_id)
            references public.desktop_agents(id)
            on delete set null;
    end if;
end $$;

comment on table public.remote_commands is
    'Fila persistente de comandos remotos. Mobile, IA, Automações e API enfileiram; Desktop Agent executa.';

comment on column public.remote_commands.id is
    'Identificador único do comando remoto.';

comment on column public.remote_commands.organization_id is
    'Organização (tenant) isolada via RLS.';

comment on column public.remote_commands.created_by is
    'Usuário autenticado que criou o comando.';

comment on column public.remote_commands.requested_by is
    'Campo legado de compatibilidade. Espelha created_by.';

comment on column public.remote_commands.target is
    'Destino do comando: desktop, agent:{uuid}, kitchen, pdv, etc.';

comment on column public.remote_commands.command is
    'Tipo de comando a executar pelo Desktop Agent.';

comment on column public.remote_commands.payload is
    'Dados JSON do comando (IDs, parâmetros, contexto).';

comment on column public.remote_commands.status is
    'Estado: pending, processing, completed, failed, cancelled.';

comment on column public.remote_commands.source is
    'Origem: desktop, mobile, automation, ai, api, admin, system.';

comment on column public.remote_commands.priority is
    'Prioridade 0-100. Maior valor = processado primeiro.';

comment on column public.remote_commands.agent_id is
    'Agente desktop designado. NULL = qualquer agente online da organização.';

comment on column public.remote_commands.desktop_agent_id is
    'Campo legado de compatibilidade. Espelha agent_id.';

comment on column public.remote_commands.result is
    'Resultado JSON retornado pelo Desktop Agent após execução.';

comment on column public.remote_commands.error_message is
    'Mensagem de erro quando status = failed ou cancelled.';

comment on column public.remote_commands.execution_time_ms is
    'Tempo de execução em milissegundos (started_at → completed_at).';

comment on column public.remote_commands.created_at is
    'Timestamp de criação do comando.';

comment on column public.remote_commands.updated_at is
    'Timestamp da última modificação do registro.';

comment on column public.remote_commands.started_at is
    'Timestamp de início da execução (status → processing).';

comment on column public.remote_commands.completed_at is
    'Timestamp de conclusão (completed, failed ou cancelled).';

comment on column public.remote_commands.processed_at is
    'Campo legado de compatibilidade. Espelha completed_at.';

comment on column public.remote_commands.acknowledged_at is
    'Timestamp em que o Desktop Agent confirmou recebimento do comando.';

comment on column public.remote_commands.expires_at is
    'Comandos pendentes após este horário são cancelados automaticamente.';

-- =============================================================================
-- TABELA: cash_sessions (compatibilidade PDV / comandos remotos de caixa)
-- =============================================================================

create table if not exists public.cash_sessions (
    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null
        references public.organizations(id) on delete cascade,

    agent_id uuid
        references public.desktop_agents(id) on delete set null,

    opened_by uuid
        references auth.users(id) on delete set null,

    closed_by uuid
        references auth.users(id) on delete set null,

    opening_balance numeric(12, 2) not null default 0,

    closing_balance numeric(12, 2),

    status text not null default 'open'
        constraint cash_sessions_status_check
        check (status in ('open', 'closed')),

    opened_at timestamptz not null default now(),

    closed_at timestamptz,

    notes text,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);

comment on table public.cash_sessions is
    'Sessões de caixa abertas/fechadas via PDV ou comandos remotos.';

comment on column public.cash_sessions.agent_id is
    'Agente desktop responsável pela sessão de caixa.';

-- =============================================================================
-- ÍNDICES: desktop_agents
-- =============================================================================

create index if not exists idx_desktop_agents_organization_id
    on public.desktop_agents(organization_id);

create index if not exists idx_desktop_agents_status
    on public.desktop_agents(status);

create index if not exists idx_desktop_agents_last_seen_at
    on public.desktop_agents(last_seen_at desc);

create index if not exists idx_desktop_agents_org_status
    on public.desktop_agents(organization_id, status);

-- =============================================================================
-- ÍNDICES: remote_commands
-- =============================================================================

create index if not exists idx_remote_commands_organization_id
    on public.remote_commands(organization_id);

create index if not exists idx_remote_commands_status
    on public.remote_commands(status);

create index if not exists idx_remote_commands_priority
    on public.remote_commands(priority desc);

create index if not exists idx_remote_commands_agent_id
    on public.remote_commands(agent_id);

create index if not exists idx_remote_commands_created_at
    on public.remote_commands(created_at desc);

create index if not exists idx_remote_commands_expires_at
    on public.remote_commands(expires_at)
    where expires_at is not null;

create index if not exists idx_remote_commands_org_status_priority_created
    on public.remote_commands(organization_id, status, priority desc, created_at asc);

create index if not exists idx_remote_commands_pending_dispatch
    on public.remote_commands(organization_id, agent_id, priority desc, created_at asc)
    where status = 'pending';

create index if not exists idx_remote_commands_source
    on public.remote_commands(organization_id, source, created_at desc);

create index if not exists idx_remote_commands_target
    on public.remote_commands(organization_id, target, status);

create index if not exists idx_remote_commands_created_by
    on public.remote_commands(created_by, created_at desc);

-- =============================================================================
-- ÍNDICES: cash_sessions
-- =============================================================================

create index if not exists idx_cash_sessions_organization_id
    on public.cash_sessions(organization_id);

create index if not exists idx_cash_sessions_org_status
    on public.cash_sessions(organization_id, status);

-- =============================================================================
-- FUNÇÕES AUXILIARES
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

comment on function public.set_updated_at() is
    'Trigger genérico: atualiza updated_at automaticamente em UPDATE.';

create or replace function public.set_remote_command_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if new.organization_id is null then
        new.organization_id := public.get_my_organization_id();
    end if;

    if new.created_by is null then
        new.created_by := auth.uid();
    end if;

    if new.requested_by is null then
        new.requested_by := new.created_by;
    end if;

    if new.target is null or btrim(new.target) = '' then
        new.target := 'desktop';
    end if;

    if new.source is null or btrim(new.source) = '' then
        new.source := 'mobile';
    end if;

    if new.priority is null then
        new.priority := 0;
    end if;

    if new.agent_id is not null and new.desktop_agent_id is null then
        new.desktop_agent_id := new.agent_id;
    elsif new.desktop_agent_id is not null and new.agent_id is null then
        new.agent_id := new.desktop_agent_id;
    end if;

    return new;
end;
$$;

comment on function public.set_remote_command_defaults() is
    'Preenche defaults e sincroniza colunas legadas no INSERT de remote_commands.';

create or replace function public.sync_remote_command_legacy_columns()
returns trigger
language plpgsql
as $$
begin
    if new.agent_id is distinct from old.agent_id
       or new.desktop_agent_id is distinct from old.desktop_agent_id then
        if new.agent_id is not null then
            new.desktop_agent_id := new.agent_id;
        elsif new.desktop_agent_id is not null then
            new.agent_id := new.desktop_agent_id;
        end if;
    end if;

    if new.completed_at is not null then
        new.processed_at := new.completed_at;
    end if;

    if new.created_by is not null and new.requested_by is null then
        new.requested_by := new.created_by;
    end if;

    return new;
end;
$$;

comment on function public.sync_remote_command_legacy_columns() is
    'Mantém compatibilidade entre agent_id/desktop_agent_id e completed_at/processed_at.';

-- =============================================================================
-- TRIGGERS
-- =============================================================================

drop trigger if exists trg_desktop_agents_set_org on public.desktop_agents;
create trigger trg_desktop_agents_set_org
    before insert on public.desktop_agents
    for each row
    execute function public.set_row_organization_id();

drop trigger if exists trg_desktop_agents_updated_at on public.desktop_agents;
create trigger trg_desktop_agents_updated_at
    before update on public.desktop_agents
    for each row
    execute function public.set_updated_at();

drop trigger if exists trg_remote_commands_defaults on public.remote_commands;
create trigger trg_remote_commands_defaults
    before insert on public.remote_commands
    for each row
    execute function public.set_remote_command_defaults();

drop trigger if exists trg_remote_commands_legacy_sync on public.remote_commands;
create trigger trg_remote_commands_legacy_sync
    before update on public.remote_commands
    for each row
    execute function public.sync_remote_command_legacy_columns();

drop trigger if exists trg_remote_commands_updated_at on public.remote_commands;
create trigger trg_remote_commands_updated_at
    before update on public.remote_commands
    for each row
    execute function public.set_updated_at();

drop trigger if exists trg_cash_sessions_set_org on public.cash_sessions;
create trigger trg_cash_sessions_set_org
    before insert on public.cash_sessions
    for each row
    execute function public.set_row_organization_id();

drop trigger if exists trg_cash_sessions_updated_at on public.cash_sessions;
create trigger trg_cash_sessions_updated_at
    before update on public.cash_sessions
    for each row
    execute function public.set_updated_at();

-- =============================================================================
-- FUNÇÕES DE NEGÓCIO: remote_commands
-- =============================================================================

create or replace function public.acknowledge_remote_command(
    p_command_id uuid,
    p_agent_id uuid
)
returns public.remote_commands
language plpgsql
security definer
set search_path = public
as $$
declare
    v_row public.remote_commands;
    v_org_id uuid;
begin
    v_org_id := public.get_my_organization_id();

    if p_agent_id is null then
        raise exception 'agent_id é obrigatório';
    end if;

    if not exists (
        select 1
        from public.desktop_agents da
        where da.id = p_agent_id
          and da.organization_id = v_org_id
    ) then
        raise exception 'Agente não pertence à organização';
    end if;

    update public.remote_commands rc
    set
        acknowledged_at = coalesce(rc.acknowledged_at, now()),
        agent_id = coalesce(rc.agent_id, p_agent_id),
        desktop_agent_id = coalesce(rc.desktop_agent_id, p_agent_id),
        status = case
            when rc.status = 'pending' then 'processing'
            else rc.status
        end,
        started_at = case
            when rc.started_at is null and rc.status = 'pending' then now()
            else rc.started_at
        end
    where rc.id = p_command_id
      and rc.organization_id = v_org_id
      and rc.status in ('pending', 'processing')
    returning rc.*
    into v_row;

    if v_row.id is null then
        raise exception 'Comando não encontrado, expirado ou já finalizado';
    end if;

    return v_row;
end;
$$;

comment on function public.acknowledge_remote_command(uuid, uuid) is
    'Desktop Agent confirma recebimento. Define acknowledged_at e associa agent_id.';

create or replace function public.finalize_remote_command(
    p_command_id uuid,
    p_status text,
    p_result jsonb default null,
    p_error_message text default null
)
returns public.remote_commands
language plpgsql
security definer
set search_path = public
as $$
declare
    v_row public.remote_commands;
    v_now timestamptz := now();
    v_execution_ms integer;
begin
    if p_status not in ('pending', 'processing', 'completed', 'failed', 'cancelled') then
        raise exception 'Status inválido: %', p_status;
    end if;

    select rc.*
    into v_row
    from public.remote_commands rc
    where rc.id = p_command_id
      and rc.organization_id = public.get_my_organization_id()
    for update;

    if v_row.id is null then
        raise exception 'Comando remoto não encontrado ou sem permissão';
    end if;

    if v_row.started_at is null and p_status = 'processing' then
        v_row.started_at := v_now;
    end if;

    if p_status in ('completed', 'failed', 'cancelled') then
        v_row.completed_at := v_now;
        v_row.processed_at := v_now;

        if v_row.started_at is not null then
            v_execution_ms := floor(
                extract(epoch from (v_now - v_row.started_at)) * 1000
            )::integer;
        end if;
    end if;

    update public.remote_commands rc
    set
        status = p_status,
        result = coalesce(p_result, rc.result),
        error_message = p_error_message,
        started_at = coalesce(v_row.started_at, rc.started_at),
        completed_at = v_row.completed_at,
        processed_at = v_row.processed_at,
        execution_time_ms = coalesce(v_execution_ms, rc.execution_time_ms)
    where rc.id = p_command_id
      and rc.organization_id = public.get_my_organization_id()
    returning rc.*
    into v_row;

    return v_row;
end;
$$;

comment on function public.finalize_remote_command(uuid, text, jsonb, text) is
    'Finaliza comando remoto registrando started_at, completed_at, execution_time_ms, result e error.';

create or replace function public.get_pending_remote_commands(
    p_limit integer default 50
)
returns setof public.remote_commands
language sql
stable
security definer
set search_path = public
as $$
    select rc.*
    from public.remote_commands rc
    where rc.organization_id = public.get_my_organization_id()
      and rc.status = 'pending'
      and (rc.expires_at is null or rc.expires_at > now())
    order by rc.priority desc, rc.created_at asc
    limit greatest(coalesce(p_limit, 50), 1);
$$;

comment on function public.get_pending_remote_commands(integer) is
    'Lista comandos pendentes da organização (compatibilidade). Ordenado por prioridade.';

create or replace function public.get_pending_commands_for_agent(
    p_agent_id uuid,
    p_limit integer default 50
)
returns setof public.remote_commands
language sql
stable
security definer
set search_path = public
as $$
    select rc.*
    from public.remote_commands rc
    where rc.organization_id = public.get_my_organization_id()
      and rc.status = 'pending'
      and (rc.expires_at is null or rc.expires_at > now())
      and (
          rc.agent_id is null
          or rc.agent_id = p_agent_id
      )
      and (
          rc.target = 'desktop'
          or rc.target = p_agent_id::text
          or rc.target = concat('agent:', p_agent_id::text)
      )
    order by rc.priority desc, rc.created_at asc
    limit greatest(coalesce(p_limit, 50), 1);
$$;

comment on function public.get_pending_commands_for_agent(uuid, integer) is
    'Retorna comandos pendentes destinados a um agente desktop específico.';

create or replace function public.claim_pending_commands_for_agent(
    p_agent_id uuid,
    p_limit integer default 10
)
returns setof public.remote_commands
language plpgsql
security definer
set search_path = public
as $$
declare
    v_org_id uuid;
    v_limit integer;
begin
    v_org_id := public.get_my_organization_id();
    v_limit := greatest(coalesce(p_limit, 10), 1);

    if p_agent_id is null then
        raise exception 'agent_id é obrigatório';
    end if;

    if not exists (
        select 1
        from public.desktop_agents da
        where da.id = p_agent_id
          and da.organization_id = v_org_id
    ) then
        raise exception 'Agente não pertence à organização';
    end if;

    return query
    with candidates as (
        select rc.id
        from public.remote_commands rc
        where rc.organization_id = v_org_id
          and rc.status = 'pending'
          and (rc.expires_at is null or rc.expires_at > now())
          and (
              rc.agent_id is null
              or rc.agent_id = p_agent_id
          )
          and (
              rc.target = 'desktop'
              or rc.target = p_agent_id::text
              or rc.target = concat('agent:', p_agent_id::text)
          )
        order by rc.priority desc, rc.created_at asc
        limit v_limit
        for update skip locked
    )
    update public.remote_commands rc
    set
        status = 'processing',
        agent_id = coalesce(rc.agent_id, p_agent_id),
        desktop_agent_id = coalesce(rc.desktop_agent_id, p_agent_id),
        acknowledged_at = coalesce(rc.acknowledged_at, now()),
        started_at = coalesce(rc.started_at, now())
    from candidates c
    where rc.id = c.id
    returning rc.*;
end;
$$;

comment on function public.claim_pending_commands_for_agent(uuid, integer) is
    'Claim atômico com FOR UPDATE SKIP LOCKED. Evita execução duplicada entre agentes.';

create or replace function public.cleanup_expired_remote_commands(
    p_retention_days integer default 90
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_org_id uuid;
    v_cancelled integer := 0;
    v_purged integer := 0;
begin
    v_org_id := public.get_my_organization_id();

    update public.remote_commands rc
    set
        status = 'cancelled',
        completed_at = now(),
        processed_at = now(),
        error_message = coalesce(rc.error_message, 'Comando expirado')
    where rc.organization_id = v_org_id
      and rc.status = 'pending'
      and rc.expires_at is not null
      and rc.expires_at <= now();

    get diagnostics v_cancelled = row_count;

    delete from public.remote_commands rc
    where rc.organization_id = v_org_id
      and rc.status in ('completed', 'failed', 'cancelled')
      and rc.completed_at is not null
      and rc.completed_at < now() - make_interval(days => greatest(coalesce(p_retention_days, 90), 7));

    get diagnostics v_purged = row_count;

    return jsonb_build_object(
        'cancelled', v_cancelled,
        'purged', v_purged,
        'organization_id', v_org_id,
        'executed_at', now()
    );
end;
$$;

comment on function public.cleanup_expired_remote_commands(integer) is
    'Cancela comandos expirados pendentes e purga registros antigos finalizados.';

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

alter table public.desktop_agents enable row level security;
alter table public.remote_commands enable row level security;
alter table public.cash_sessions enable row level security;

drop policy if exists desktop_agents_select on public.desktop_agents;
create policy desktop_agents_select
    on public.desktop_agents
    for select
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
    );

drop policy if exists desktop_agents_insert on public.desktop_agents;
create policy desktop_agents_insert
    on public.desktop_agents
    for insert
    to authenticated
    with check (
        organization_id = public.get_my_organization_id()
    );

drop policy if exists desktop_agents_update on public.desktop_agents;
create policy desktop_agents_update
    on public.desktop_agents
    for update
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
    )
    with check (
        organization_id = public.get_my_organization_id()
    );

drop policy if exists remote_commands_select on public.remote_commands;
create policy remote_commands_select
    on public.remote_commands
    for select
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
    );

drop policy if exists remote_commands_insert on public.remote_commands;
create policy remote_commands_insert
    on public.remote_commands
    for insert
    to authenticated
    with check (
        organization_id = public.get_my_organization_id()
    );

drop policy if exists remote_commands_update on public.remote_commands;
create policy remote_commands_update
    on public.remote_commands
    for update
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
    )
    with check (
        organization_id = public.get_my_organization_id()
    );

drop policy if exists cash_sessions_select on public.cash_sessions;
create policy cash_sessions_select
    on public.cash_sessions
    for select
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
    );

drop policy if exists cash_sessions_insert on public.cash_sessions;
create policy cash_sessions_insert
    on public.cash_sessions
    for insert
    to authenticated
    with check (
        organization_id = public.get_my_organization_id()
    );

drop policy if exists cash_sessions_update on public.cash_sessions;
create policy cash_sessions_update
    on public.cash_sessions
    for update
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
    )
    with check (
        organization_id = public.get_my_organization_id()
    );

-- =============================================================================
-- GRANTS
-- =============================================================================

revoke all on table public.desktop_agents from public;
revoke all on table public.desktop_agents from anon;
revoke all on table public.remote_commands from public;
revoke all on table public.remote_commands from anon;
revoke all on table public.cash_sessions from public;
revoke all on table public.cash_sessions from anon;

grant select, insert, update on table public.desktop_agents to authenticated;
grant select, insert, update on table public.remote_commands to authenticated;
grant select, insert, update on table public.cash_sessions to authenticated;

revoke all on function public.set_updated_at() from public;
revoke all on function public.set_remote_command_defaults() from public;
revoke all on function public.sync_remote_command_legacy_columns() from public;
revoke all on function public.acknowledge_remote_command(uuid, uuid) from public;
revoke all on function public.finalize_remote_command(uuid, text, jsonb, text) from public;
revoke all on function public.get_pending_remote_commands(integer) from public;
revoke all on function public.get_pending_commands_for_agent(uuid, integer) from public;
revoke all on function public.claim_pending_commands_for_agent(uuid, integer) from public;
revoke all on function public.cleanup_expired_remote_commands(integer) from public;

grant execute on function public.set_updated_at() to authenticated;
grant execute on function public.set_remote_command_defaults() to authenticated;
grant execute on function public.sync_remote_command_legacy_columns() to authenticated;
grant execute on function public.acknowledge_remote_command(uuid, uuid) to authenticated;
grant execute on function public.finalize_remote_command(uuid, text, jsonb, text) to authenticated;
grant execute on function public.get_pending_remote_commands(integer) to authenticated;
grant execute on function public.get_pending_commands_for_agent(uuid, integer) to authenticated;
grant execute on function public.claim_pending_commands_for_agent(uuid, integer) to authenticated;
grant execute on function public.cleanup_expired_remote_commands(integer) to authenticated;

-- =============================================================================
-- SUPABASE REALTIME
-- =============================================================================

do $$
begin
    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'remote_commands'
    ) then
        alter publication supabase_realtime add table public.remote_commands;
    end if;
exception
    when duplicate_object then null;
    when undefined_object then null;
end $$;

do $$
begin
    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'desktop_agents'
    ) then
        alter publication supabase_realtime add table public.desktop_agents;
    end if;
exception
    when duplicate_object then null;
    when undefined_object then null;
end $$;

do $$
begin
    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'cash_sessions'
    ) then
        alter publication supabase_realtime add table public.cash_sessions;
    end if;
exception
    when duplicate_object then null;
    when undefined_object then null;
end $$;
