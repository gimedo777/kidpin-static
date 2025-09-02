import fs from "node:fs";
const src = "./overpass-berlin.json";
const dst = "./public/data/places.json";
const raw = JSON.parse(fs.readFileSync(src, "utf-8"));
const out = [];
const catFromTags = (t) => {
  if (!t) return null;
  if (t.leisure === "playground") return "playground";
  if (t.tourism === "zoo" || t.amenity === "zoo") return "zoo";
  if (t.tourism === "museum") return "museum";
  if (t.amenity === "cafe" && (t.kids === "yes" || t.child === "yes" || t.highchair === "yes" || (t.changing_table && t.changing_table !== "no") || t.family === "yes")) return "cafe";
  if (t.leisure === "trampoline") return "indoor";
  if (t.amenity === "sports_hall") return "indoor";
  if (t.leisure === "sports_centre" && t.sport && /(trampoline|gymnastics|multisport)/i.test(t.sport) && (t.indoor === "yes" || t.indoor === "1")) return "indoor";
  return null;
};
const subcatFromTags = (t) => {
  if (!t) return "";
  if (t.sport && /trampoline/i.test(t.sport)) return "trampoline";
  if (t.family === "yes" || t.kids === "yes" || t.highchair === "yes" || (t.changing_table && t.changing_table !== "no")) return "family";
  return "";
};
const buildAddress = (t) => {
  if (!t) return "";
  const parts = [];
  if (t["addr:street"]) {
    const hn = t["addr:housenumber"] ? ` ${t["addr:housenumber"]}` : "";
    parts.push(`${t["addr:street"]}${hn}`);
  }
  const city = t["addr:city"] || "Berlin";
  if (t["addr:postcode"]) parts.push(`${t["addr:postcode"]} ${city}`);
  else if (parts.length) parts.push(city);
  return parts.join(", ");
};
for (const el of raw.elements || []) {
  const t = el.tags || {};
  const category = catFromTags(t);
  if (!category) continue;
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (lat == null || lon == null) continue;
  const name = t.name || t["name:de"] || "(Ohne Namen)";
  const address = buildAddress(t);
  const subcategory = subcatFromTags(t);
  const price = t.fee === "yes" ? "€" : (t.fee === "no" ? "free" : "");
  const open = t.opening_hours || "";
  const osmType = el.type;
  const id = `berlin-${osmType}-${el.id}`;
  out.push({ id, name, lat, lon, city: "Berlin", address, category, subcategory, price, open, source: `osm:${osmType}/${el.id}` });
}
out.sort((a,b)=> (a.category||"").localeCompare(b.category||"") || (a.name||"").localeCompare(b.name||""));
fs.mkdirSync("./public/data", { recursive: true });
fs.writeFileSync(dst, JSON.stringify(out, null, 2), "utf-8");
console.log(`OK -> ${dst} (${out.length} Einträge)`);
