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
    ('Pamonha Tradicional'::text, 'fa-bowl-food'::text, 'A classica de sempre. Milho fresco, textura cremosa e aquele sabor que te leva pra casa da vo.'::text, 'salgado'::text, 8.00::numeric, 1::integer, null::text, true, false),
    ('Pamonha de Queijo Meia Cura', 'fa-cheese', 'Queijo meia cura artesanal no centro. Derrete, puxa, abraca.', 'especial', 12.00::numeric, 2, 'fa-star mais pedida', true, true),
    ('Pamonha de Coco Cremoso', 'fa-seedling', 'Leite de coco fresco na massa. Doce, delicada, cremosa.', 'doce', 10.00::numeric, 3, null, true, false),
    ('Romeu e Julieta', 'fa-heart', 'Goiabada cascao com queijo branco cremoso.', 'doce', 13.00::numeric, 4, null, true, false),
    ('Pamonha de Doce de Leite', 'fa-jar', 'Doce de leite artesanal no recheio. Derrete na boca, abraca o coracao.', 'doce', 11.00::numeric, 5, null, true, false),
    ('Pamonha Assada', 'fa-fire', 'Casquinha caramelizada na brasa, por dentro cremosa.', 'especial', 14.00::numeric, 6, 'fa-fire exclusiva', true, true)
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
  'fa-cheese',
  'Edicao especial do dia com milho fresco e queijo meia cura artesanal.',
  12.00,
  40,
  0,
  true,
  array['Milho fresco', 'Queijo meia cura', 'Receita da vo']
where not exists (select 1 from public.venda_dia where data = current_date);

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
