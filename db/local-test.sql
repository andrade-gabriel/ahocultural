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