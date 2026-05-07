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
  array['Milho fresco', 'Queijo meia cura', 'Receita da vo']
where not exists (select 1 from public.venda_dia where data = current_date);
