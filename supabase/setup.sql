create extension if not exists pgcrypto;

create table if not exists public.cardapio (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  emoji text not null default '🌽',
  descricao text not null default '',
  categoria text not null default 'salgado',
  preco numeric(10, 2) not null,
  ordem integer not null default 0,
  badge_texto text,
  ativo boolean not null default true,
  destaque boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint cardapio_categoria_check check (categoria in ('salgado', 'doce', 'especial')),
  constraint cardapio_preco_check check (preco >= 0)
);

create table if not exists public.venda_dia (
  id uuid primary key default gen_random_uuid(),
  data date not null unique,
  nome text not null,
  emoji text not null default '🌽',
  descricao text not null default '',
  preco numeric(10, 2),
  unidades_total integer not null default 40,
  unidades_vendidas integer not null default 0,
  ativo boolean not null default true,
  ingredientes text[] not null default '{}',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint venda_dia_preco_check check (preco is null or preco >= 0),
  constraint venda_dia_total_check check (unidades_total > 0),
  constraint venda_dia_vendidas_check check (unidades_vendidas >= 0),
  constraint venda_dia_estoque_check check (unidades_vendidas <= unidades_total)
);

create index if not exists cardapio_public_idx
  on public.cardapio (ativo, ordem, criado_em);

create index if not exists venda_dia_public_idx
  on public.venda_dia (data, ativo, criado_em desc);

create or replace function public.set_atualizado_em()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists set_cardapio_atualizado_em on public.cardapio;
create trigger set_cardapio_atualizado_em
  before update on public.cardapio
  for each row
  execute function public.set_atualizado_em();

drop trigger if exists set_venda_dia_atualizado_em on public.venda_dia;
create trigger set_venda_dia_atualizado_em
  before update on public.venda_dia
  for each row
  execute function public.set_atualizado_em();

alter table public.cardapio enable row level security;
alter table public.venda_dia enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select on table public.cardapio to anon, authenticated;
grant select on table public.venda_dia to anon, authenticated;
grant all on table public.cardapio to service_role;
grant all on table public.venda_dia to service_role;

drop policy if exists "Public read active cardapio" on public.cardapio;
create policy "Public read active cardapio"
  on public.cardapio
  for select
  to anon, authenticated
  using (ativo = true);

drop policy if exists "Public read active venda_dia" on public.venda_dia;
create policy "Public read active venda_dia"
  on public.venda_dia
  for select
  to anon, authenticated
  using (ativo = true and data = current_date);

insert into public.cardapio (
  nome,
  emoji,
  descricao,
  categoria,
  preco,
  ordem,
  badge_texto,
  ativo,
  destaque
)
select
  seed.nome,
  seed.emoji,
  seed.descricao,
  seed.categoria,
  seed.preco,
  seed.ordem,
  seed.badge_texto,
  seed.ativo,
  seed.destaque
from (
  values
    ('Pamonha Tradicional'::text, '🫕'::text, 'A classica de sempre. Milho fresco, textura cremosa e aquele sabor que te leva pra casa da vo.'::text, 'salgado'::text, 8.00::numeric, 1::integer, null::text, true, false),
    ('Pamonha de Queijo Meia Cura', '🧀', 'Queijo meia cura artesanal no centro. Derrete, puxa, abraca.', 'especial', 12.00::numeric, 2, '⭐ mais pedida', true, true),
    ('Pamonha de Coco Cremoso', '🥥', 'Leite de coco fresco na massa. Doce, delicada, cremosa.', 'doce', 10.00::numeric, 3, null, true, false),
    ('Romeu e Julieta', '💜', 'Goiabada cascao com queijo branco cremoso.', 'doce', 13.00::numeric, 4, null, true, false),
    ('Pamonha de Doce de Leite', '🍯', 'Doce de leite artesanal no recheio. Derrete na boca, abraca o coracao.', 'doce', 11.00::numeric, 5, null, true, false),
    ('Pamonha Assada', '🔥', 'Casquinha caramelizada na brasa, por dentro cremosa.', 'especial', 14.00::numeric, 6, '🔥 exclusiva', true, true)
) as seed(nome, emoji, descricao, categoria, preco, ordem, badge_texto, ativo, destaque)
where not exists (select 1 from public.cardapio);

insert into public.venda_dia (
  data,
  nome,
  emoji,
  descricao,
  preco,
  unidades_total,
  unidades_vendidas,
  ativo,
  ingredientes
)
select
  current_date,
  'Pamonha de Queijo Meia Cura',
  '🧀',
  'Edicao especial do dia com milho fresco e queijo meia cura artesanal.',
  12.00,
  40,
  0,
  true,
  array['Milho fresco', 'Queijo meia cura', 'Receita da vo']::text[]
where not exists (select 1 from public.venda_dia where data = current_date);
