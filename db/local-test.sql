-- 0) Obter city_id (São Paulo)
SET @city_id = (
  SELECT `id` FROM `city`
  WHERE `slug` = 'sao-paulo'
  LIMIT 1
);

-- 1) USER (só insere se não existir)
INSERT INTO `user` (`id`, `email`, `password`, `first_name`, `active`, `created_at`, `updated_at`)
SELECT
  1,
  'gabriel@ahocultural.com',
  '$2b$12$7p8A4uCzVpfdB6LrmSQAcO94tGwRpkPKUGicaWhexCROA1Okl0kQq',
  'Gabriel',
  TRUE,
  '2025-09-28 15:04:01',
  '2025-09-28 15:04:01'
WHERE NOT EXISTS (
  SELECT 1 FROM `user` WHERE `email` = 'gabriel@ahocultural.com'
);

-- 2) LOCATION (só insere se não existir para a cidade)
INSERT INTO `location` (`city_id`, `description`, `active`, `created_at`, `updated_at`)
SELECT
  @city_id, '', TRUE, '2025-10-12 21:58:29', '2025-10-31 00:03:04'
WHERE NOT EXISTS (
  SELECT 1 FROM `location` WHERE `city_id` = @city_id
);

-- Recupera sempre o id do location (novo ou existente)
SET @location_id = (
  SELECT `id` FROM `location`
  WHERE `city_id` = @city_id
  LIMIT 1
);

-- 3) DISTRICTS (só insere se ainda não existir)
INSERT INTO `location_district` (`location_id`, `district`, `slug`)
SELECT @location_id, 'Vila Madalena', 'vila-madalena'
WHERE NOT EXISTS (
  SELECT 1 FROM `location_district`
  WHERE `location_id` = @location_id AND `slug` = 'vila-madalena'
);

INSERT INTO `location_district` (`location_id`, `district`, `slug`)
SELECT @location_id, 'Itaim', 'itaim'
WHERE NOT EXISTS (
  SELECT 1 FROM `location_district`
  WHERE `location_id` = @location_id AND `slug` = 'itaim'
);

INSERT INTO `location_district` (`location_id`, `district`, `slug`)
SELECT @location_id, 'Brooklin', 'brooklin'
WHERE NOT EXISTS (
  SELECT 1 FROM `location_district`
  WHERE `location_id` = @location_id AND `slug` = 'brooklin'
);

INSERT INTO `location_district` (`location_id`, `district`, `slug`)
SELECT @location_id, 'Jardins', 'jardins'
WHERE NOT EXISTS (
  SELECT 1 FROM `location_district`
  WHERE `location_id` = @location_id AND `slug` = 'jardins'
);

INSERT INTO address (street, number, complement, district, postal_code, location_id, location_district_id, latitude, longitude)
SELECT 'Alameda Fernão Cardim', '39', '', 'Jardim Paulista', '01403-020', 1, NULL, 0, 0
WHERE NOT EXISTS (
  SELECT 1 FROM address
  WHERE street = 'Alameda Fernão Cardim'
    AND number = '39'
    AND postal_code = '01403-020'
);

-- Garante a company
INSERT INTO company (name, slug, address_id, active)
SELECT 'Restaurante Aizomê', 'restaurante-aizome', a.id, TRUE
FROM address a
WHERE a.street = 'Alameda Fernão Cardim'
  AND a.number = '39'
  AND a.postal_code = '01403-020'
  AND NOT EXISTS (SELECT 1 FROM company c WHERE c.slug = 'restaurante-aizome');

-- =========================
-- Ráscal Shopping JK
-- =========================
INSERT INTO address (street, number, complement, district, postal_code, location_id, location_district_id, latitude, longitude)
SELECT 'Av. Pres. Juscelino Kubitschek', '2041', 'loja 418, 3º piso', 'Vila Olímpia', '04543-011', 1, NULL, 0, 0
WHERE NOT EXISTS (
  SELECT 1 FROM address
  WHERE street = 'Av. Pres. Juscelino Kubitschek'
    AND number = '2041'
    AND postal_code = '04543-011'
);

INSERT INTO company (name, slug, address_id, active)
SELECT 'Ráscal Shopping JK', 'rascal-shopping-jk', a.id, TRUE
FROM address a
WHERE a.street = 'Av. Pres. Juscelino Kubitschek'
  AND a.number = '2041'
  AND a.postal_code = '04543-011'
  AND NOT EXISTS (SELECT 1 FROM company c WHERE c.slug = 'rascal-shopping-jk');

-- =========================
-- Restaurante Fasano Itaim
-- =========================
INSERT INTO address (street, number, complement, district, postal_code, location_id, location_district_id, latitude, longitude)
SELECT 'R. Vitório Fasano', '88', '', 'Itaim', '01414-020', 1, NULL, 0, 0
WHERE NOT EXISTS (
  SELECT 1 FROM address
  WHERE street = 'R. Vitório Fasano'
    AND number = '88'
    AND postal_code = '01414-020'
);

INSERT INTO company (name, slug, address_id, active)
SELECT 'Restaurante Fasano Itaim', 'restaurante-fasano-itaim', a.id, TRUE
FROM address a
WHERE a.street = 'R. Vitório Fasano'
  AND a.number = '88'
  AND a.postal_code = '01414-020'
  AND NOT EXISTS (SELECT 1 FROM company c WHERE c.slug = 'restaurante-fasano-itaim');

-- =========================
-- Gero Jardins
-- =========================
INSERT INTO address (street, number, complement, district, postal_code, location_id, location_district_id, latitude, longitude)
SELECT 'Rua Haddock Lobo', '1629', '', 'Jardins', '01414-003', 1, NULL, 0, 0
WHERE NOT EXISTS (
  SELECT 1 FROM address
  WHERE street = 'Rua Haddock Lobo'
    AND number = '1629'
    AND postal_code = '01414-003'
);

INSERT INTO company (name, slug, address_id, active)
SELECT 'Gero Jardins', 'gero-jardins', a.id, TRUE
FROM address a
WHERE a.street = 'Rua Haddock Lobo'
  AND a.number = '1629'
  AND a.postal_code = '01414-003'
  AND NOT EXISTS (SELECT 1 FROM company c WHERE c.slug = 'gero-jardins');

-- =========================
-- Maní
-- =========================
INSERT INTO address (street, number, complement, district, postal_code, location_id, location_district_id, latitude, longitude)
SELECT 'R. Joaquim Antunes', '210', '', 'Jardim Paulistano', '05415-010', 1, NULL, -7.5, -7.5
WHERE NOT EXISTS (
  SELECT 1 FROM address
  WHERE street = 'R. Joaquim Antunes'
    AND number = '210'
    AND postal_code = '05415-010'
);

INSERT INTO company (name, slug, address_id, active)
SELECT 'Maní', 'mani', a.id, TRUE
FROM address a
WHERE a.street = 'R. Joaquim Antunes'
  AND a.number = '210'
  AND a.postal_code = '05415-010'
  AND NOT EXISTS (SELECT 1 FROM company c WHERE c.slug = 'mani');
  
INSERT IGNORE INTO `category` (
  `name_pt`, `name_en`, `name_es`,
  `slug_pt`, `slug_en`, `slug_es`,
  `description_pt`, `description_en`, `description_es`,
  `active`
)
VALUES
-- 1) Cinema & Teatro
(
  'Cinema & Teatro',
  'Cinema & Theater',
  'Cine y Teatro',
  'cinema-e-teatro',
  'cinema-and-theater',
  'cine-y-teatro',
  'Espetáculos, peças e exibições de filmes em geral',
  'Shows, plays and general movie screenings',
  'Espectáculos, obras y proyecciones de películas en general',
  TRUE
),

-- 2) Arte & Design
(
  'Arte & Design',
  'Art & Design',
  'Arte y Diseño',
  'arte-e-design',
  'art-and-design',
  'arte-y-diseno',
  'Categorias relacionadas a arte, design e criatividade',
  'Categories related to art, design and creativity',
  'Categorías relacionadas con arte, diseño y creatividad',
  TRUE
),

-- 3) Restaurante Japonês
(
  'Restaurante Japonês',
  'Japanese Restaurant',
  'Restaurante Japonés',
  'restaurante-japones',
  'japanese-restaurant',
  'restaurante-japones',
  'Culinária japonesa e restaurantes especializados em sushi e sashimi',
  'Japanese cuisine and restaurants specialized in sushi and sashimi',
  'Cocina japonesa y restaurantes especializados en sushi y sashimi',
  TRUE
),

-- 4) Restaurante Árabe
(
  'Restaurante Árabe',
  'Arabic Restaurant',
  'Restaurante Árabe',
  'restaurante-arabe',
  'arabic-restaurant',
  'restaurante-arabe',
  'Culinária árabe e restaurantes especializados em comida do Oriente Médio',
  'Arabic cuisine and restaurants specialized in Middle Eastern food',
  'Cocina árabe y restaurantes especializados en comida del Medio Oriente',
  TRUE
),

-- 5) Restaurante Italiano
(
  'Restaurante Italiano',
  'Italian Restaurant',
  'Restaurante Italiano',
  'restaurante-italiano',
  'italian-restaurant',
  'restaurante-italiano',
  'Culinária italiana e restaurantes especializados em massas e pizzas',
  'Italian cuisine and restaurants specialized in pasta and pizza',
  'Cocina italiana y restaurantes especializados en pastas y pizzas',
  TRUE
),

-- 6) Comida & Bebida
(
  'Comida & Bebida',
  'Food & Drinks',
  'Comida y Bebida',
  'comida-e-bebida',
  'food-and-drinks',
  'comida-y-bebida',
  'Restaurantes em geral',
  'Restaurants in general',
  'Restaurantes en general',
  TRUE
),

-- 7) Restaurante Brasileiro
(
  'Restaurante Brasileiro',
  'Brazilian Restaurant',
  'Restaurante Brasileño',
  'restaurante-brasileiro',
  'brazilian-restaurant',
  'restaurante-brasileno',
  'Culinária brasileira e restaurantes típicos regionais',
  'Brazilian cuisine and traditional regional restaurants',
  'Cocina brasileña y restaurantes típicos regionales',
  TRUE
);

INSERT INTO `about` (
  `body_pt`, `body_en`, `body_es`
)
SELECT
  '<p>A <strong>AHÔ CULTURAL</strong> é uma plataforma digital para encontrar, em segundos, o que há de melhor em <em>Arte, Design, Arquitetura, Fotografia e Apresentações Artísticas</em> — além de Bares Imperdíveis, Baladas, Shows, Cinemas Alternativos, Feiras, Festas e muito mais. Tudo em um só lugar, do jeito que você gosta: gratuito, rápido e sem enrolação.</p><ul><li><p><span style=\"color: rgb(233, 30, 99);\"><strong>•</strong></span><span style=\"color: rgb(0, 0, 0);\"><strong> </strong></span><span style=\"color: rgb(245, 0, 87);\"><strong>Curadoria</strong></span><strong>:</strong> as melhores galerias, espaços e eventos em destaque.</p></li><li><p><span style=\"color: rgb(233, 30, 99);\"><strong>• </strong></span><span style=\"color: rgb(245, 0, 87);\"><strong>Guia Urbano Segmentado</strong></span><strong>:</strong> do vernissage à pista, do Indie ao clássico.</p></li><li><p><span style=\"color: rgb(233, 30, 99);\"><strong>• </strong></span><span style=\"color: rgb(0, 145, 234);\"><strong>Imediatismo</strong></span><strong>:</strong> sem cadastro, sem baixar app, sem perder tempo.</p></li><li><p><span style=\"color: rgb(233, 30, 99);\"><strong>• </strong></span><strong>Respeito à sua privacidade:</strong> não pedimos seu e-mail, nem seu telefone.</p></li><li><p><span style=\"color: rgb(233, 30, 99);\"><strong>• </strong></span><strong>Navegação intuitiva:</strong> entre, explore e ache o rolê com a sua cara.</p></li></ul><p><strong>Como utilizar:</strong></p><ol><li><p>Acesse a plataforma. (marque como favorita em seu navegador)</p></li><li><p>Filtre por categoria, local, data.</p></li><li><p>Descubra, Escolha, e Viva SP ao máximo.</p></li></ol><p><strong>Bem-vindo à AHÔ CULTURAL</strong><br>Onde a cultura encontra você.</p><p><strong>SIGNIFICADO</strong></p><p style=\"text-align: center;\"><strong>AHÔ</strong> é uma expressão indígena usada para significar “assim seja”, “obrigado”, representando respeito, gratidão e união com todos os seres. É utilizada em práticas xamânicas como uma saudação e afirmação da conexão universal.</p><p style=\"text-align: center;\">Ao ser pronunciada, <strong>AHÔ</strong> expressamos o desejo de que algo seja realizado, concordando com a força do universo ou agradecendo pelas dádivas.</p><p style=\"text-align: center;\">A palavra enfatiza a união de todos os seres e a interligação entre os elementos do universo, funcionando como um mantra ou um lembrete dessa conexão.</p>',
  '<p>The <strong>AHÔ CULTURAL</strong> is a digital platform to quickly find the best in <em>Art, Design, Architecture, Photography, and Artistic Performances</em> — as well as Unmissable Bars, Parties, Shows, Alternative Cinemas, Fairs, Festivals, and much more. All in one place, just the way you like it: free, fast, and hassle-free.</p><ul><li><p><span style=\"color: rgb(233, 30, 99);\"><strong>• </strong></span><strong>Curation:</strong> the best galleries, spaces, and featured events.</p></li><li><p><span style=\"color: rgb(233, 30, 99);\"><strong>• </strong></span><strong>Segmented Urban Guide:</strong> from vernissages to dance floors, from indie to classic.</p></li><li><p><span style=\"color: rgb(233, 30, 99);\"><strong>• </strong></span><strong>Immediacy:</strong> no registration, no app download, no wasted time.</p></li><li><p><span style=\"color: rgb(233, 30, 99);\"><strong>• </strong></span><strong>Respect for your privacy:</strong> we don’t ask for your email or phone number.</p></li><li><p><span style=\"color: rgb(233, 30, 99);\"><strong>• </strong></span><strong>Intuitive navigation:</strong> browse, explore, and find the perfect event for you.</p></li></ul><p><strong>How to use:</strong></p><ol><li><p>Access the platform (add it to your browser favorites).</p></li><li><p>Filter by category, location, or date.</p></li><li><p>Discover, choose, and enjoy São Paulo to the fullest.</p></li></ol><p><strong>Welcome to AHÔ CULTURAL</strong><br>Where culture meets you.</p><p><strong>MEANING</strong></p><p><strong>AHÔ</strong> is an indigenous expression meaning “so be it” or “thank you,” representing respect, gratitude, and unity among all beings. It is used in shamanic practices as a greeting and affirmation of universal connection.</p><p>When spoken, <strong>AHÔ</strong> expresses the desire for something to come true, aligning with the power of the universe or giving thanks for blessings.</p><p>The word emphasizes the unity of all beings and the interconnection of all elements in the universe, functioning as a mantra or a reminder of this connection.</p>',
  '<p>La <strong>AHÔ CULTURAL</strong> es una plataforma digital para encontrar, en segundos, lo mejor de <em>Arte, Diseño, Arquitectura, Fotografía y Presentaciones Artísticas</em> — además de Bares Imperdibles, Fiestas, Conciertos, Cines Alternativos, Ferias, Festivales y mucho más. Todo en un solo lugar, como te gusta: gratuito, rápido y sin complicaciones.</p><ul><li><p><span style=\"color: rgb(233, 30, 99);\"><strong>• </strong></span><strong>Curaduría:</strong> las mejores galerías, espacios y eventos destacados.</p></li><li><p><span style=\"color: rgb(233, 30, 99);\"><strong>• </strong></span><strong>Guía Urbana Segmentada:</strong> del vernissage a la pista, del indie al clásico.</p></li><li><p><span style=\"color: rgb(233, 30, 99);\"><strong>• </strong></span><strong>Inmediatez:</strong> sin registro, sin descargar aplicaciones, sin perder tiempo.</p></li><li><p><span style=\"color: rgb(233, 30, 99);\"><strong>• </strong></span><strong>Respeto a tu privacidad:</strong> no pedimos tu correo electrónico ni tu número de teléfono.</p></li><li><p><span style=\"color: rgb(233, 30, 99);\"><strong>• </strong></span><strong>Navegación intuitiva:</strong> entra, explora y encuentra el plan perfecto para ti.</p></li></ul><p><strong>Cómo utilizar:</strong></p><ol><li><p>Accede a la plataforma (márcala como favorita en tu navegador).</p></li><li><p>Filtra por categoría, lugar y fecha.</p></li><li><p>Descubre, elige y vive São Paulo al máximo.</p></li></ol><p><strong>Bienvenido a AHÔ CULTURAL</strong><br>Donde la cultura te encuentra.</p><p><strong>SIGNIFICADO</strong></p><p><strong>AHÔ</strong> es una expresión indígena que significa “así sea” o “gracias”, y representa respeto, gratitud y unión con todos los seres. Se utiliza en prácticas chamánicas como un saludo y una afirmación de la conexión universal.</p><p>Al pronunciarla, <strong>AHÔ</strong> expresa el deseo de que algo se realice, en sintonía con la fuerza del universo o en agradecimiento por las bendiciones.</p><p>La palabra enfatiza la unión de todos los seres y la interconexión entre los elementos del universo, funcionando como un mantra o un recordatorio de esta conexión.</p>'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `about`);

INSERT INTO `advertisement` (
  `body_pt`, `body_en`, `body_es`
)
SELECT
  '<p><strong>Eleve seu evento</strong>, sua exposição, espaço cultural, restaurante, bar ou balada ao centro das atenções.</p><p><strong>AHÔ CULTURAL</strong> conecta, em tempo real, quem quer sair de casa com as melhores experiências da cidade. Ao impulsionar seu link/evento, você ganha destaque garantido nos pontos de maior circulação da plataforma — simples, rápido e com resultados visíveis.</p><h3 style=\"text-align:center; margin-top:24px;\">POR QUE INVESTIR NA AHÔ CULTURAL?</h3><ul style=\"list-style:none; padding-left:0; margin:12px 0; line-height:1.6;\"><li><span style=\"color:#e91e63; font-weight:700;\">•</span> <strong style=\"color:#e91e63;\">Alcance qualificado:</strong> audiência com intenção de sair agora.</li><li><span style=\"color:#e91e63; font-weight:700;\">•</span> <strong style=\"color:#e91e63;\">Imediatismo:</strong> usuários acessam sem cadastro e sem app — mais cliques, menos barreira.</li><li><span style=\"color:#e91e63; font-weight:700;\">•</span> <strong style=\"color:#e91e63;\">Curadoria Segmentada:</strong> sua marca ao lado do que há de melhor em arte, design, arquitetura, dança, moda, fotografia e entretenimento cultural.</li><li><span style=\"color:#e91e63; font-weight:700;\">•</span> <strong style=\"color:#e91e63;\">Privacidade em primeiro lugar:</strong> segmentação por contexto, sem dados sensíveis.</li></ul><p><strong>Formatos de destaque e mídia:</strong></p><ul style=\"list-style:none; padding-left:0; margin:8px 0; line-height:1.6;\"><li><span style=\"color:#0091ea; font-weight:700;\">•</span> <strong style=\"color:#0091ea;\">Destaque na Agenda:</strong> seu evento nas primeiras posições, com selo “Patrocinado”.</li><li><span style=\"color:#0091ea; font-weight:700;\">•</span> <strong style=\"color:#0091ea;\">Card Patrocinado no feed:</strong> visibilidade durante a navegação por interesses.</li><li><span style=\"color:#0091ea; font-weight:700;\">•</span> <strong style=\"color:#0091ea;\">Banner no Guia Urbano:</strong> presença em páginas de arte, design, arquitetura e fotografia.</li><li><span style=\"color:#0091ea; font-weight:700;\">•</span> <strong style=\"color:#0091ea;\">Posição Premium na Busca:</strong> pin em evidência nas buscas por categoria/local.</li></ul><p><strong style=\"color:#e91e63;\">VITRINE “DESTAQUES”:</strong> espaço nobre na home para urgências e lotação.<br><strong style=\"color:#e91e63;\">ALERTA DE ÚLTIMA HORA (OPT-IN):</strong> ativa quem está por perto e pronto para decidir.</p><h3 style=\"text-align:center; margin-top:24px;\">NÃO TEM ANÚNCIO? TEM URGÊNCIA?</h3><p>Calma! Entre em contato com <a href=\"mailto:estudio@ahocultural.com\" style=\"color:#e91e63; text-decoration:none;\">estudio@ahocultural.com</a>.<br>Nosso estúdio de designers e redatores fará seu anúncio com orçamento viável e estética integrada à segmentação.<br>Pedimos atenção aos <em>briefings</em> e prazos. Sempre com bom senso.</p><p>Quando há incentivo financeiro (impulsionamento), sua divulgação recebe prioridade e evidência editorial dentro dos espaços patrocináveis da plataforma.</p><h3 style=\"text-align:center; margin-top:24px;\">SEGMENTAÇÃO INTELIGENTE:</h3><ul style=\"list-style:none; padding-left:0; margin:8px 0; line-height:1.6;\"><li><span style=\"color:#000; font-weight:700;\">•</span> Por bairro/região e raio de alcance.</li><li><span style=\"color:#000; font-weight:700;\">•</span> Por categoria (galeria, bar, night club, show, teatro, cinema, feira, festa).</li><li><span style=\"color:#000; font-weight:700;\">•</span> Por data, dia da semana e faixa de horário.</li><li><span style=\"color:#000; font-weight:700;\">•</span> Por dispositivo (mobile/desktop) e contexto de navegação.</li></ul><h3 style=\"text-align:center; margin-top:24px;\">PLANOS DE INVESTIMENTO:</h3><ul style=\"list-style:none; padding-left:0; margin:8px 0; line-height:1.6;\"><li><span style=\"color:#000; font-weight:700;\">•</span> <strong>IMPULSO POR EVENTO:</strong> perfeito para vernissages, shows, festas e lançamentos.</li><li><span style=\"color:#000; font-weight:700;\">•</span> <strong>SEMANA EM DESTAQUE:</strong> mantenha a casa cheia com presença contínua.</li><li><span style=\"color:#000; font-weight:700;\">•</span> <strong>SEMPRE ON PARA ESPAÇOS:</strong> ideal para bares, clubes e galerias com agenda recorrente.</li><li><span style=\"color:#000; font-weight:700;\">•</span> <strong>PACOTES SAZONAIS:</strong> festivais, férias, feriados e grandes datas.</li></ul><p>Orçamento flexível: diário, por evento ou mensal, com faturamento simplificado e sem fidelidade.<br>Tabelas sob consulta em <a href=\"mailto:comercial@ahocultural.com\" style=\"color:#0091ea; text-decoration:none;\">comercial@ahocultural.com</a>.</p><h3 style=\"text-align:center; margin-top:24px;\">COMO FUNCIONA: <span style=\"font-weight:400;\">(simples e rápido)</span></h3><ol style=\"padding-left:1.5rem; margin-top:8px; line-height:1.6; list-style:decimal;\"><li>Envie o link do seu evento ou perfil do espaço.</li><li>Escolha o plano, período e áreas de atuação.</li><li>Defina a segmentação e o orçamento junto ao comercial AHÔ.</li><li>Suba criativos (imagem, título, call-to-action) — ajustamos o formato para cada posição.</li><li>Publicação rápida após validação de qualidade.</li><li>Acompanhe resultados em painel com métricas e relatórios.</li></ol><p><strong>Pronto para colocar seu evento em evidência?</strong> Vamos impulsionar seu link e lotar sua agenda. Fale com nosso time comercial e solicite o kit de mídia.</p>',
  '<p><strong>Elevate your event</strong>, exhibition, cultural space, restaurant, bar, or party to the spotlight.</p><p><strong>AHÔ CULTURAL</strong> connects, in real time, those looking for the best experiences in the city. By promoting your link or event, you gain guaranteed visibility in the platform’s top circulation areas — simple, fast, and effective.</p><h3 style=\"text-align:center; margin-top:24px;\">WHY INVEST IN AHÔ CULTURAL?</h3><ul style=\"list-style:none; padding-left:0; margin:12px 0; line-height:1.6;\"><li><span style=\"color:#e91e63; font-weight:700;\">•</span> <strong style=\"color:#e91e63;\">Qualified reach:</strong> audience with real intent to go out now.</li><li><span style=\"color:#e91e63; font-weight:700;\">•</span> <strong style=\"color:#e91e63;\">Immediacy:</strong> users access without registration or app — more clicks, fewer barriers.</li><li><span style=\"color:#e91e63; font-weight:700;\">•</span> <strong style=\"color:#e91e63;\">Segmented curation:</strong> your brand alongside the best in art, design, architecture, dance, fashion, photography, and cultural entertainment.</li><li><span style=\"color:#e91e63; font-weight:700;\">•</span> <strong style=\"color:#e91e63;\">Privacy first:</strong> context-based segmentation without sensitive data.</li></ul><p><strong>Highlight and media formats:</strong></p><ul style=\"list-style:none; padding-left:0; margin:8px 0; line-height:1.6;\"><li><span style=\"color:#0091ea; font-weight:700;\">•</span> <strong style=\"color:#0091ea;\">Agenda highlight:</strong> your event in top positions with the “Sponsored” tag.</li><li><span style=\"color:#0091ea; font-weight:700;\">•</span> <strong style=\"color:#0091ea;\">Sponsored card in feed:</strong> visible during organic browsing by interests.</li><li><span style=\"color:#0091ea; font-weight:700;\">•</span> <strong style=\"color:#0091ea;\">Urban guide banner:</strong> appear in art, design, architecture, and photography pages.</li><li><span style=\"color:#0091ea; font-weight:700;\">•</span> <strong style=\"color:#0091ea;\">Premium search position:</strong> highlighted in searches by category or location.</li></ul><p><strong style=\"color:#e91e63;\">“HIGHLIGHTS” SHOWCASE:</strong> premium space on the homepage for urgent or popular events.<br><strong style=\"color:#e91e63;\">LAST-MINUTE ALERT (OPT-IN):</strong> activates users nearby and ready to decide.</p><h3 style=\"text-align:center; margin-top:24px;\">NO AD YET? NEED URGENT PROMOTION?</h3><p>Relax! Contact <a href=\"mailto:estudio@ahocultural.com\" style=\"color:#e91e63; text-decoration:none;\">estudio@ahocultural.com</a>.<br>Our design and copywriting studio will create your ad with viable budget and aesthetics aligned to the platform’s style.<br>Please pay attention to <em>briefings</em> and deadlines — always with good sense.</p><p>When there’s financial promotion (boost), your ad gains priority and editorial visibility across the platform’s sponsored areas.</p><h3 style=\"text-align:center; margin-top:24px;\">SMART SEGMENTATION:</h3><ul style=\"list-style:none; padding-left:0; margin:8px 0; line-height:1.6;\"><li><span style=\"color:#000; font-weight:700;\">•</span> By neighborhood/region and reach radius.</li><li><span style=\"color:#000; font-weight:700;\">•</span> By category (gallery, bar, night club, concert, theater, cinema, fair, festival).</li><li><span style=\"color:#000; font-weight:700;\">•</span> By date, weekday, and time range.</li><li><span style=\"color:#000; font-weight:700;\">•</span> By device (mobile/desktop) and navigation context.</li></ul><h3 style=\"text-align:center; margin-top:24px;\">INVESTMENT PLANS:</h3><ul style=\"list-style:none; padding-left:0; margin:8px 0; line-height:1.6;\"><li><span style=\"color:#000; font-weight:700;\">•</span> <strong>BOOST PER EVENT:</strong> perfect for vernissages, shows, parties, and launches.</li><li><span style=\"color:#000; font-weight:700;\">•</span> <strong>WEEKLY HIGHLIGHT:</strong> keep your venue visible with a constant sponsored tag.</li><li><span style=\"color:#000; font-weight:700;\">•</span> <strong>ALWAYS ON FOR VENUES:</strong> ideal for bars, clubs, and galleries with recurring schedules.</li><li><span style=\"color:#000; font-weight:700;\">•</span> <strong>SEASONAL PACKAGES:</strong> festivals, holidays, and major events.</li></ul><p>Flexible budget: daily, per event, or monthly, with simplified billing and no commitment.<br>Contact us at <a href=\"mailto:comercial@ahocultural.com\" style=\"color:#0091ea; text-decoration:none;\">comercial@ahocultural.com</a>.</p><h3 style=\"text-align:center; margin-top:24px;\">HOW IT WORKS: <span style=\"font-weight:400;\">(simple and fast)</span></h3><ol style=\"padding-left:1.5rem; margin-top:8px; line-height:1.6; list-style:decimal;\"><li>Send the link to your event or venue profile.</li><li>Select the plan, duration, and areas of promotion.</li><li>Define segmentation and budget with AHÔ’s sales team.</li><li>Upload creatives (image, title, call-to-action) — we adapt formats for each spot.</li><li>Quick publishing after quality validation.</li><li>Track performance through analytics and reports.</li></ol><p><strong>Ready to spotlight your event?</strong> Let’s boost your link and fill your agenda. Talk to our sales team and request the media kit.</p>',
  '<p><strong>Eleva tu evento</strong>, exposición, espacio cultural, restaurante, bar o fiesta al centro de la atención.</p><p><strong>AHÔ CULTURAL</strong> conecta, en tiempo real, a quienes buscan las mejores experiencias de la ciudad. Al promocionar tu enlace o evento, obtienes visibilidad garantizada en los puntos de mayor circulación de la plataforma — simple, rápido y con resultados visibles.</p><h3 style=\"text-align:center; margin-top:24px;\">¿POR QUÉ INVERTIR EN AHÔ CULTURAL?</h3><ul style=\"list-style:none; padding-left:0; margin:12px 0; line-height:1.6;\"><li><span style=\"color:#e91e63; font-weight:700;\">•</span> <strong style=\"color:#e91e63;\">Alcance calificado:</strong> audiencia con intención real de salir ahora.</li><li><span style=\"color:#e91e63; font-weight:700;\">•</span> <strong style=\"color:#e91e63;\">Inmediatez:</strong> usuarios acceden sin registro ni aplicación — más clics, menos barreras.</li><li><span style=\"color:#e91e63; font-weight:700;\">•</span> <strong style=\"color:#e91e63;\">Curaduría segmentada:</strong> tu marca junto a lo mejor en arte, diseño, arquitectura, danza, moda, fotografía y entretenimiento cultural.</li><li><span style=\"color:#e91e63; font-weight:700;\">•</span> <strong style=\"color:#e91e63;\">Privacidad ante todo:</strong> segmentación contextual sin datos sensibles.</li></ul><p><strong>Formatos de destaque y medios:</strong></p><ul style=\"list-style:none; padding-left:0; margin:8px 0; line-height:1.6;\"><li><span style=\"color:#0091ea; font-weight:700;\">•</span> <strong style=\"color:#0091ea;\">Destacado en la agenda:</strong> tu evento en las primeras posiciones, con sello “Patrocinado”.</li><li><span style=\"color:#0091ea; font-weight:700;\">•</span> <strong style=\"color:#0091ea;\">Tarjeta patrocinada en el feed:</strong> visibilidad durante la navegación por intereses.</li><li><span style=\"color:#0091ea; font-weight:700;\">•</span> <strong style=\"color:#0091ea;\">Banner en la guía urbana:</strong> presencia en páginas de arte, diseño, arquitectura y fotografía.</li><li><span style=\"color:#0091ea; font-weight:700;\">•</span> <strong style=\"color:#0091ea;\">Posición premium en la búsqueda:</strong> destacado en búsquedas por categoría o ubicación.</li></ul><p><strong style=\"color:#e91e63;\">VITRINA “DESTACADOS”:</strong> espacio principal en la página de inicio para urgencias o alta demanda.<br><strong style=\"color:#e91e63;\">ALERTA DE ÚLTIMA HORA (OPT-IN):</strong> activa a quienes están cerca y listos para decidir.</p><h3 style=\"text-align:center; margin-top:24px;\">¿NO TIENES ANUNCIO? ¿TIENES URGENCIA?</h3><p>¡Tranquilo! Contacta con <a href=\"mailto:estudio@ahocultural.com\" style=\"color:#e91e63; text-decoration:none;\">estudio@ahocultural.com</a>.<br>Nuestro estudio de diseño y redacción creará tu anuncio con presupuesto viable y estética coherente.<br>Prestamos atención a los <em>briefings</em> y plazos. Siempre con sentido común.</p><p>Cuando hay promoción financiera (impulso), tu publicación recibe prioridad y destaque editorial en los espacios patrocinables de la plataforma.</p><h3 style=\"text-align:center; margin-top:24px;\">SEGMENTACIÓN INTELIGENTE:</h3><ul style=\"list-style:none; padding-left:0; margin:8px 0; line-height:1.6;\"><li><span style=\"color:#000; font-weight:700;\">•</span> Por barrio/región y radio de alcance.</li><li><span style=\"color:#000; font-weight:700;\">•</span> Por categoría (galería, bar, night club, concierto, teatro, cine, feria, festival).</li><li><span style=\"color:#000; font-weight:700;\">•</span> Por fecha, día de la semana y franja horaria.</li><li><span style=\"color:#000; font-weight:700;\">•</span> Por dispositivo (móvil/escritorio) y contexto de navegación.</li></ul><h3 style=\"text-align:center; margin-top:24px;\">PLANES DE INVERSIÓN:</h3><ul style=\"list-style:none; padding-left:0; margin:8px 0; line-height:1.6;\"><li><span style=\"color:#000; font-weight:700;\">•</span> <strong>IMPULSO POR EVENTO:</strong> perfecto para inauguraciones, conciertos, fiestas y lanzamientos.</li><li><span style=\"color:#000; font-weight:700;\">•</span> <strong>SEMANA DESTACADA:</strong> mantiene tu espacio visible con presencia continua.</li><li><span style=\"color:#000; font-weight:700;\">•</span> <strong>SIEMPRE ACTIVO PARA ESPACIOS:</strong> ideal para bares, clubes y galerías con agenda recurrente.</li><li><span style=\"color:#000; font-weight:700;\">•</span> <strong>PAQUETES ESTACIONALES:</strong> festivales, vacaciones y grandes eventos.</li></ul><p>Presupuesto flexible: diario, por evento o mensual, con facturación simplificada y sin compromiso.<br>Consulta tarifas en <a href=\"mailto:comercial@ahocultural.com\" style=\"color:#0091ea; text-decoration:none;\">comercial@ahocultural.com</a>.</p><h3 style=\"text-align:center; margin-top:24px;\">¿CÓMO FUNCIONA? <span style=\"font-weight:400;\">(simple y rápido)</span></h3><ol style=\"padding-left:1.5rem; margin-top:8px; line-height:1.6; list-style:decimal;\"><li>Envía el enlace de tu evento o perfil del espacio.</li><li>Elige el plan, período y áreas de promoción.</li><li>Define la segmentación y el presupuesto junto al equipo comercial de AHÔ.</li><li>Sube los creativos (imagen, título, llamado a la acción) — ajustamos el formato para cada posición.</li><li>Publicación rápida tras la validación de calidad.</li><li>Sigue los resultados en el panel con métricas e informes.</li></ol><p><strong>¿Listo para destacar tu evento?</strong> Impulsemos tu enlace y llenemos tu agenda. Habla con nuestro equipo comercial y solicita el kit de medios.</p>'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `advertisement`);

INSERT INTO `contact` (
  `body_pt`, `body_en`, `body_es`
)
SELECT
  '<h2 style=\"text-align:center; margin-bottom:16px;\">FALE COM A AHÔ CULTURAL</h2><p>Tem alguma dúvida, ideia ou quer aproximar a sua experiência da nossa comunidade? Este é o canal direto com o time da AHÔ.</p><ul style=\"list-style:none; padding-left:0; line-height:1.6;\"><li><span style=\"color:#e91e63; font-weight:700;\">•</span> Parcerias, mídia e formatos de destaque na plataforma.</li><li><span style=\"color:#e91e63; font-weight:700;\">•</span> Divulgação de eventos, espaços culturais, bares, casas noturnas e projetos autorais.</li><li><span style=\"color:#e91e63; font-weight:700;\">•</span> Dúvidas sobre uso da plataforma e sugestões de melhorias.</li><li><span style=\"color:#e91e63; font-weight:700;\">•</span> Contato para imprensa e colaborações de conteúdo.</li></ul><p>Conte em poucas linhas quem você é, o que deseja divulgar ou perguntar, e como podemos ajudar.</p><p style=\"margin-top:16px;\">Basta clicar em <a href=\"mailto:pedro@ahocultural.com\" style=\"color:#0091ea; text-decoration:none;\">pedro@ahocultural.com</a> e enviar sua mensagem.</p><p style=\"margin-top:8px;\">Lemos tudo com cuidado e, sempre que possível, damos prioridade às propostas alinhadas ao nosso propósito: conectar pessoas à cultura da cidade.</p>',
  '<h2 style=\"text-align:center; margin-bottom:16px;\">CONTACT AHÔ CULTURAL</h2><p>Have a question, an idea, or want to bring your experience closer to our community? This is your direct channel to the AHÔ team.</p><ul style=\"list-style:none; padding-left:0; line-height:1.6;\"><li><span style=\"color:#e91e63; font-weight:700;\">•</span> Partnerships, media opportunities, and sponsored formats on the platform.</li><li><span style=\"color:#e91e63; font-weight:700;\">•</span> Promotion of events, cultural spaces, bars, clubs, and independent projects.</li><li><span style=\"color:#e91e63; font-weight:700;\">•</span> Questions about how to use the platform and suggestions for improvement.</li><li><span style=\"color:#e91e63; font-weight:700;\">•</span> Press contact and content collaboration.</li></ul><p>In a few lines, tell us who you are, what you want to promote or ask, and how we can help.</p><p style=\"margin-top:16px;\">Just click <a href=\"mailto:pedro@ahocultural.com\" style=\"color:#0091ea; text-decoration:none;\">pedro@ahocultural.com</a> and send your message.</p><p style=\"margin-top:8px;\">We read every email carefully and, whenever possible, give priority to proposals that align with our purpose: connecting people to the city’s culture.</p>',
  '<h2 style=\"text-align:center; margin-bottom:16px;\">CONTACTA CON AHÔ CULTURAL</h2><p>¿Tienes alguna duda, idea o quieres acercar tu experiencia a nuestra comunidad? Este es el canal directo con el equipo de AHÔ.</p><ul style=\"list-style:none; padding-left:0; line-height:1.6;\"><li><span style=\"color:#e91e63; font-weight:700;\">•</span> Alianzas, medios y formatos patrocinados en la plataforma.</li><li><span style=\"color:#e91e63; font-weight:700;\">•</span> Difusión de eventos, espacios culturales, bares, clubes y proyectos independientes.</li><li><span style=\"color:#e91e63; font-weight:700;\">•</span> Dudas sobre el uso de la plataforma y sugerencias de mejora.</li><li><span style=\"color:#e91e63; font-weight:700;\">•</span> Contacto para prensa y colaboraciones de contenido.</li></ul><p>Cuéntanos en pocas líneas quién eres, qué quieres divulgar o preguntar y cómo podemos ayudarte.</p><p style=\"margin-top:16px;\">Solo tienes que hacer clic en <a href=\"mailto:pedro@ahocultural.com\" style=\"color:#0091ea; text-decoration:none;\">pedro@ahocultural.com</a> y enviar tu mensaje.</p><p style=\"margin-top:8px;\">Leemos todo con atención y, siempre que sea posible, damos prioridad a las propuestas alineadas con nuestro propósito: conectar personas con la cultura de la ciudad.</p>'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `contact`);

INSERT INTO `studio` (
	`body_pt`, `body_en`, `body_es`
)
SELECT
  '<h2 style=\"text-align:center; margin-bottom:16px;\">STÚDIO AHÔ</h2><p>O <strong>Stúdio AHÔ</strong> é um estúdio de Design Gráfico e Industrial que oferece serviços de produção gráfica e consultoria geral em design. Nossa equipe, formada por designers e arquitetos, desenvolve e produz cenografias, sinalizações, ambientações, papelarias personalizadas, vitrines, expositores e materiais promocionais.</p><ul style=\"list-style:none; padding-left:0; line-height:1.6; margin:12px 0;\"><li><span style=\"color:#e91e63; font-weight:700;\">•</span> <strong>Sustentabilidade:</strong> projetos pensados para reduzir impacto ambiental.</li><li><span style=\"color:#e91e63; font-weight:700;\">•</span> <strong>Modularidade:</strong> soluções inteligentes, fáceis de montar, adaptar e reaproveitar.</li><li><span style=\"color:#e91e63; font-weight:700;\">•</span> <strong>Baixo desperdício:</strong> processos otimizados, foco em uso consciente de materiais.</li><li><span style=\"color:#e91e63; font-weight:700;\">•</span> <strong>Orçamento sob medida:</strong> ajustamos o projeto às necessidades e recursos de cada cliente.</li></ul><p>Do conceito à instalação, entregamos <strong>design que funciona no mundo real</strong>: bonito, eficiente e alinhado à experiência que você quer proporcionar.</p><p style=\"margin-top:12px; font-weight:700;\">Menos desperdício, mais resultado!</p><p style=\"margin-top:16px;\">Confira alguns de nossos trabalhos:</p>',
  '<h2 style=\"text-align:center; margin-bottom:16px;\">STÚDIO AHÔ</h2><p><strong>Stúdio AHÔ</strong> is a Graphic and Industrial Design studio offering graphic production services and comprehensive design consulting. Our team of designers and architects develops and produces scenography, signage, spatial environments, custom stationery, displays, shop windows, and promotional materials.</p><ul style=\"list-style:none; padding-left:0; line-height:1.6; margin:12px 0;\"><li><span style=\"color:#e91e63; font-weight:700;\">•</span> <strong>Sustainability:</strong> projects designed to minimize environmental impact.</li><li><span style=\"color:#e91e63; font-weight:700;\">•</span> <strong>Modularity:</strong> smart solutions that are easy to assemble, adapt, and reuse.</li><li><span style=\"color:#e91e63; font-weight:700;\">•</span> <strong>Low waste:</strong> optimized processes focused on conscious material use.</li><li><span style=\"color:#e91e63; font-weight:700;\">•</span> <strong>Budget-friendly:</strong> we adapt each project to your needs and resources.</li></ul><p>From concept to installation, we deliver <strong>design that works in the real world</strong>: beautiful, efficient, and aligned with the experience you want to create.</p><p style=\"margin-top:12px; font-weight:700;\">Less waste, more results!</p><p style=\"margin-top:16px;\">Check out some of our work:</p>',
  '<h2 style=\"text-align:center; margin-bottom:16px;\">STÚDIO AHÔ</h2><p><strong>Stúdio AHÔ</strong> es un estudio de Diseño Gráfico e Industrial que ofrece servicios de producción gráfica y consultoría general en diseño. Nuestro equipo, formado por diseñadores y arquitectos, desarrolla y produce escenografías, señalizaciones, ambientaciones, papelerías personalizadas, vitrinas, expositores y materiales promocionales.</p><ul style=\"list-style:none; padding-left:0; line-height:1.6; margin:12px 0;\"><li><span style=\"color:#e91e63; font-weight:700;\">•</span> <strong>Sostenibilidad:</strong> proyectos pensados para reducir el impacto ambiental.</li><li><span style=\"color:#e91e63; font-weight:700;\">•</span> <strong>Modularidad:</strong> soluciones inteligentes, fáciles de montar, adaptar y reutilizar.</li><li><span style=\"color:#e91e63; font-weight:700;\">•</span> <strong>Bajo desperdicio:</strong> procesos optimizados con enfoque en el uso consciente de materiales.</li><li><span style=\"color:#e91e63; font-weight:700;\">•</span> <strong>Presupuesto a medida:</strong> adaptamos el proyecto a las necesidades y recursos de cada cliente.</li></ul><p>Del concepto a la instalación, entregamos <strong>diseño que funciona en el mundo real</strong>: bonito, eficiente y alineado con la experiencia que deseas ofrecer.</p><p style=\"margin-top:12px; font-weight:700;\">¡Menos desperdicio, más resultado!</p><p style=\"margin-top:16px;\">Mira algunos de nuestros trabajos:</p>'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `studio`);

SET @studio_id = (
  SELECT `id` FROM `studio` LIMIT 1
);
SELECT @studio_id;

INSERT IGNORE INTO `studio_category` (
	`studio_id`, `name_pt`, `name_en`, `name_es`
)
VALUES
(
	@studio_id, 
    'Cenografia e Ambientação', 
    'Scenography & Spatial Design', 
    'Escenografía y Ambientación'
),
(
	@studio_id, 
    'Sinalização e Wayfinding', 
    'Signage & Wayfinding', 
    'Señalización y Wayfinding'
),
(
	@studio_id, 
    'Vitrines e Expositores', 
    'Displays & Visual Merchandising', 
    'Vitrinas y Expositores'
),
(
	@studio_id, 
    'Papelaria e Materiais Gráficos', 
    'Stationery & Print Materials', 
    'Papelería y Material Gráfico'
);

INSERT IGNORE INTO `studio_category_media` (
	`studio_id`, `studio_category_id`, `file_path`
)
VALUES
(@studio_id, (SELECT id FROM `studio_category` WHERE studio_id = @studio_id AND name_pt = 'Cenografia e Ambientação' LIMIT 1), '1.jpeg'),
(@studio_id, (SELECT id FROM `studio_category` WHERE studio_id = @studio_id AND name_pt = 'Cenografia e Ambientação' LIMIT 1), '2.jpeg'),
(@studio_id, (SELECT id FROM `studio_category` WHERE studio_id = @studio_id AND name_pt = 'Cenografia e Ambientação' LIMIT 1), '3.jpeg'),
(@studio_id, (SELECT id FROM `studio_category` WHERE studio_id = @studio_id AND name_pt = 'Cenografia e Ambientação' LIMIT 1), '4.jpeg'),

-- Categoria 2: Sinalização e Wayfinding
(@studio_id, (SELECT id FROM `studio_category` WHERE studio_id = @studio_id AND name_pt = 'Sinalização e Wayfinding' LIMIT 1), '5.jpeg'),
(@studio_id, (SELECT id FROM `studio_category` WHERE studio_id = @studio_id AND name_pt = 'Sinalização e Wayfinding' LIMIT 1), '6.jpeg'),
(@studio_id, (SELECT id FROM `studio_category` WHERE studio_id = @studio_id AND name_pt = 'Sinalização e Wayfinding' LIMIT 1), '7.jpeg'),
(@studio_id, (SELECT id FROM `studio_category` WHERE studio_id = @studio_id AND name_pt = 'Sinalização e Wayfinding' LIMIT 1), '8.jpeg'),

-- Categoria 3: Vitrines e Expositores
(@studio_id, (SELECT id FROM `studio_category` WHERE studio_id = @studio_id AND name_pt = 'Vitrines e Expositores' LIMIT 1), '9.jpeg'),
(@studio_id, (SELECT id FROM `studio_category` WHERE studio_id = @studio_id AND name_pt = 'Vitrines e Expositores' LIMIT 1), '10.jpeg'),
(@studio_id, (SELECT id FROM `studio_category` WHERE studio_id = @studio_id AND name_pt = 'Vitrines e Expositores' LIMIT 1), '11.jpeg'),
(@studio_id, (SELECT id FROM `studio_category` WHERE studio_id = @studio_id AND name_pt = 'Vitrines e Expositores' LIMIT 1), '12.jpeg'),

-- Categoria 4: Papelaria e Materiais Gráficos
(@studio_id, (SELECT id FROM `studio_category` WHERE studio_id = @studio_id AND name_pt = 'Papelaria e Materiais Gráficos' LIMIT 1), '13.jpeg'),
(@studio_id, (SELECT id FROM `studio_category` WHERE studio_id = @studio_id AND name_pt = 'Papelaria e Materiais Gráficos' LIMIT 1), '14.jpeg'),
(@studio_id, (SELECT id FROM `studio_category` WHERE studio_id = @studio_id AND name_pt = 'Papelaria e Materiais Gráficos' LIMIT 1), '15.jpeg'),
(@studio_id, (SELECT id FROM `studio_category` WHERE studio_id = @studio_id AND name_pt = 'Papelaria e Materiais Gráficos' LIMIT 1), '16.jpeg');

INSERT IGNORE INTO `article` (
  `title_pt`, `title_en`, `title_es`,
  `slug_pt`, `slug_en`, `slug_es`,
  `body_pt`, `body_en`, `body_es`,
  `hero_image`, `thumbnail`,
  `publication_date`,
  `active`,
  `created_at`,
  `updated_at`
) VALUES (
  'Hip Hop em São Paulo',
  'Hip Hop in São Paulo',
  'Hip Hop en São Paulo',
  'hip-hop-em-sao-paulo',
  'hip-hop-in-sao-paulo',
  'hip-hop-en-sao-paulo',
  '<p>O movimento Hip Hop em São Paulo é uma das expressões culturais mais vibrantes da cidade. Nascido nas periferias, ele une música, dança, arte e resistência social. Os encontros em praças e centros culturais reúnem MCs, DJs, grafiteiros e b-boys que mantêm viva a essência da cultura urbana. A cada final de semana, novos eventos e batalhas de rima acontecem em diferentes bairros, mostrando o poder transformador da arte e a força da juventude periférica.</p><p>Entre os destaques, estão espaços como a Casa do Hip Hop em Diadema e eventos como a Batalha da Aldeia, que revelam talentos e conectam gerações. O Hip Hop paulistano é mais que música — é identidade, é voz e é história contada pelos próprios protagonistas das ruas.</p>',
  '<p>The Hip Hop movement in São Paulo is one of the city’s most vibrant cultural expressions. Born in the outskirts, it brings together music, dance, art, and social resistance. Gatherings in public squares and cultural centers unite MCs, DJs, graffiti artists, and b-boys who keep the essence of urban culture alive. Every weekend, new events and freestyle battles take place in different neighborhoods, showing the transformative power of art and the strength of youth from the suburbs.</p><p>Highlights include places like Casa do Hip Hop in Diadema and events such as Batalha da Aldeia, which reveal new talents and connect generations. São Paulo’s Hip Hop is more than music — it is identity, it is voice, and it is history told by the very protagonists of the streets.</p>',
  '<p>El movimiento Hip Hop en São Paulo es una de las expresiones culturales más vibrantes de la ciudad. Nacido en las periferias, une música, danza, arte y resistencia social. Los encuentros en plazas y centros culturales reúnen a MCs, DJs, grafiteros y b-boys que mantienen viva la esencia de la cultura urbana. Cada fin de semana, nuevos eventos y batallas de freestyle tienen lugar en diferentes barrios, mostrando el poder transformador del arte y la fuerza de la juventud periférica.</p><p>Entre los principales espacios se destacan la Casa del Hip Hop en Diadema y eventos como la Batalha da Aldeia, que revelan talentos y conectan generaciones. El Hip Hop paulistano es más que música: es identidad, es voz y es historia contada por los propios protagonistas de las calles.</p>',
  'hip-hop-em-sao-paulo_hero.jpg',
  'hip-hop-em-sao-paulo_thumbnail.jpg',
  '2025-10-09 00:00:00',
  TRUE,
  '2025-10-09 03:13:32',
  '2025-10-31 01:05:23'
);
