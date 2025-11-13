use aho;

-- COUNTRY
INSERT INTO `country` (`id`, `name`, `iso2`, `slug`)
VALUES (1, 'Brasil', 'BR', 'brasil');

-- STATES (27 UFs)
INSERT INTO `state` (`id`, `country_id`, `name`, `uf`, `slug`) VALUES
(1, 1,'Acre','AC','acre'),
(2, 1,'Alagoas','AL','alagoas'),
(3, 1,'Amapá','AP','amapa'),
(4, 1,'Amazonas','AM','amazonas'),
(5, 1,'Bahia','BA','bahia'),
(6, 1,'Ceará','CE','ceara'),
(7, 1,'Distrito Federal','DF','distrito-federal'),
(8, 1,'Espírito Santo','ES','espirito-santo'),
(9, 1,'Goiás','GO','goias'),
(10, 1,'Maranhão','MA','maranhao'),
(11, 1,'Mato Grosso','MT','mato-grosso'),
(12, 1,'Mato Grosso do Sul','MS','mato-grosso-do-sul'),
(13, 1,'Minas Gerais','MG','minas-gerais'),
(14, 1,'Pará','PA','para'),
(15, 1,'Paraíba','PB','paraiba'),
(16, 1,'Paraná','PR','parana'),
(17, 1,'Pernambuco','PE','pernambuco'),
(18, 1,'Piauí','PI','piaui'),
(19, 1,'Rio de Janeiro','RJ','rio-de-janeiro'),
(20, 1,'Rio Grande do Norte','RN','rio-grande-do-norte'),
(21, 1,'Rio Grande do Sul','RS','rio-grande-do-sul'),
(22, 1,'Rondônia','RO','rondonia'),
(23, 1,'Roraima','RR','roraima'),
(24, 1,'Santa Catarina','SC','santa-catarina'),
(25, 1,'São Paulo','SP','sao-paulo'),
(26, 1,'Sergipe','SE','sergipe'),
(27, 1,'Tocantins','TO','tocantins')
ON DUPLICATE KEY UPDATE `id` = `id`;

select * from `state`;