create table if not exists public.site_content (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists site_content_public_idx
  on public.site_content (id, ativo);

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

drop trigger if exists set_site_content_atualizado_em on public.site_content;
create trigger set_site_content_atualizado_em
  before update on public.site_content
  for each row
  execute function public.set_atualizado_em();

alter table public.site_content enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select on table public.site_content to anon, authenticated;
grant all on table public.site_content to service_role;

drop policy if exists "Public read active site_content" on public.site_content;
create policy "Public read active site_content"
  on public.site_content
  for select
  to anon, authenticated
  using (ativo = true);

insert into public.site_content (id, data, ativo)
select
  'homepage',
  '{
    "links": {
      "ifood": "https://www.ifood.com.br",
      "whatsapp": "https://wa.me/5500000000000?text=Ol%C3%A1!%20Quero%20encomendar%20pamonhas%20da%20Milhar%C3%AA%20%F0%9F%8C%BD",
      "instagram": "https://instagram.com/milhare",
      "instagramHandle": "@milhare"
    },
    "seo": {
      "title": "Milharê — Pamonhas da Vó",
      "description": "Pamonhas artesanais feitas com milho fresco e receita de família. Peça pelo iFood."
    },
    "hero": {
      "pre": "fa-pen-nib feito com as mãos da vó",
      "title": "Pamonha que<br /><em>abraça</em> de<br />verdade.",
      "handwritten": "Receita de família desde sempre.",
      "description": "Milho colhido fresco, ralado na hora, cozido no ponto certo. Do jeito que a vó fazia — só que agora chega na sua porta pelo iFood."
    },
    "sobre": {
      "kicker": "fa-pen-nib Nossa história",
      "title": "Do milho fresco<br /><em>à sua mesa.</em>",
      "paragraphs": [
        "A Milharê nasceu de uma memória afetiva. Os meus avós começaram a vender pamonha como forma de renda — e com isso plantaram algo muito maior do que um negócio.",
        "Plantaram amor. Plantaram tradição. Plantaram o gostinho da roça que hoje a gente cuida com orgulho."
      ],
      "quote": "Cada pamonha é feita com milho fresco, selecionado no dia. Sem pressa, sem conservante, sem abrir mão do capricho.",
      "tags": ["fa-wheat-awn milho fresco", "fa-hand feito à mão", "fa-heart receita da vó", "fa-leaf sem conservantes"]
    },
    "cardapio": {
      "kicker": "fa-wheat-awn o que tem hoje",
      "title": "Nossos sabores",
      "subtitle": "Tudo feito na hora, na medida certa, do jeito de sempre."
    },
    "limitada": {
      "kicker": "fa-calendar-day todo dia muda",
      "title": "Só <em>40 unidades</em><br />por dia.",
      "text": "Quando acaba, acabou. Cada dia tem um sabor especial, feito com calma, do jeito que se fazia antigamente. Sem pressa, sem mágica industrial — só milho, mão e carinho."
    },
    "pedir": {
      "kicker": "fa-truck-fast chega quentinho",
      "title": "Receba em casa.<br /><em>Ainda quentinha.</em>",
      "subtitle": "Disponível no iFood. Também aceitamos encomendas e kits de presente pelo WhatsApp — perfeito pra presentear com afeto.",
      "ifoodTitle": "Peça pelo iFood",
      "ifoodText": "Entrega rápida, rastreada e direto na sua porta.<br />Avaliação 4.9 estrelas com mais de 200 entregas.",
      "whatsappText": "Quer encomenda especial ou kit de presente?",
      "features": ["fa-wheat-awn milho fresco diário", "fa-bolt entrega em até 45min", "fa-box-open embalagem artesanal", "fa-heart feito com carinho"]
    },
    "depoimentos": [
      {
        "nome": "Ana Paula S.",
        "via": "via iFood ⭐",
        "avatar": "fa-user",
        "texto": "Melhor pamonha que já comi na vida. Dá pra sentir que foi feita com carinho. A de queijo meia cura é simplesmente absurda."
      },
      {
        "nome": "Carlos M.",
        "via": "via iFood ⭐",
        "avatar": "fa-user",
        "texto": "Pedi a edição limitada de doce de leite e me arrependi de não ter pedido mais. Embalagem linda. Virei cliente fiel da Milharê."
      },
      {
        "nome": "Fernanda O.",
        "via": "via WhatsApp ⭐",
        "avatar": "fa-user",
        "texto": "A pamonha assada é outro nível. Casquinha crocante, por dentro cremosa. Parece que você tá na roça. Parabéns pela qualidade!"
      }
    ],
    "instagram": {
      "title": "Segue a gente fa-camera-retro",
      "subtitle": "processo, bastidores e sabores do dia",
      "items": ["fa-wheat-awn", "fa-bowl-food", "fa-cheese", "fa-fire", "fa-jar", "fa-heart"]
    },
    "footer": {
      "description": "Pamonhas artesanais feitas com milho fresco e receita de família. Tradição que abraça.",
      "copyright": "© 2026 Milharê Pamonhas Artesanais fa-wheat-awn — feito com amor e milho fresco.",
      "quote": "\"Do milho à memória.\""
    }
  }'::jsonb,
  true
where not exists (select 1 from public.site_content where id = 'homepage');
