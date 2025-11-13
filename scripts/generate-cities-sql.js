const fs = require('fs');

const UF_TO_STATE_ID = {
  "AC": 1, "AL": 2, "AP": 3, "AM": 4, "BA": 5, "CE": 6, "DF": 7,
  "ES": 8, "GO": 9, "MA": 10, "MT": 11, "MS": 12, "MG": 13, "PA": 14,
  "PB": 15, "PR": 16, "PE": 17, "PI": 18, "RJ": 19, "RN": 20, "RS": 21,
  "RO": 22, "RR": 23, "SC": 24, "SP": 25, "SE": 26, "TO": 27
};
const UF_ORDER = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

function slugify(s) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}
function q(s) {
  return String(s).replace(/'/g, "''");
}

async function main() {
  const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios', { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const municipios = await res.json();

  const byUf = Object.fromEntries(UF_ORDER.map(uf => [uf, []]));
  for (const m of municipios) {
    const uf = (m?.microrregiao?.mesorregiao?.UF?.sigla) || (m?.microrregiao?.UF?.sigla) || (m?.UF?.sigla);
    const name = m?.nome;
    const ibgeId = m?.id;
    if (!uf || !name || !ibgeId) continue;
    const UF = String(uf).trim().toUpperCase();
    const stateId = UF_TO_STATE_ID[UF];
    if (!stateId) continue;
    byUf[UF].push({ state_id: stateId, ibge_id: ibgeId, name, slug: slugify(name) });
  }

  for (const uf of UF_ORDER) byUf[uf].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  let out = "";
  const CHUNK = 500;
  for (const uf of UF_ORDER) {
    const list = byUf[uf];
    if (!list.length) continue;
    for (let i = 0; i < list.length; i += CHUNK) {
      const slice = list.slice(i, i + CHUNK);
      const values = slice.map(c => `(${c.state_id},'${q(c.name)}','${q(c.slug)}')`).join(",\n");
      out += "INSERT INTO `city` (`state_id`,`name`,`slug`) VALUES\n" + values + ";\n\n";
    }
  }

  fs.writeFileSync("../db/cities.sql", out, "utf8");
  process.stdout.write(out);
}

main().catch(err => { console.error(err.message || String(err)); process.exit(1); });
