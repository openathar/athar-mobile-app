/**
 * Daten und Layout der Gefuehls-Karte nach der "Karte des Gefuehlsbaums" von
 * Amin Sabry (135 Gefuehle und Sensoren: 81 in der Brust, 54 im Bauch).
 * Die Reihenfolge folgt der Karte von links (rechte Koerperseite, staerker)
 * nach rechts (linke Koerperseite, schwaecher). Namen von Hand je Sprache;
 * nicht jedes der 135 Woerter ist uebernommen — nur die, die sich sauber
 * uebersetzen lassen.
 *
 * Tupel: [id, arabisch, englisch, deutsch]
 */
export type Feeling = { id: string; ar: string; en: string; de: string };
type Row = [string, string, string, string];

const chestRows: Row[] = [
  ["sidq", "الصدق والبراءة", "Truthfulness and innocence", "Wahrhaftigkeit und Unschuld"],
  ["aman", "أمان", "Safety", "Geborgenheit"],
  ["itminan", "اطمئنان", "Peace of mind", "Seelenruhe"],
  ["faith", "إيمان", "Faith", "Glaube"],
  ["shukr", "شكر", "Gratitude", "Dankbarkeit"],
  ["iqrar", "الاعتراف", "Acknowledgement", "Anerkennung"],
  ["thiqa", "الثقة", "Trust", "Vertrauen"],
  ["love", "حب", "Love", "Liebe"],
  ["shaghaf", "شغف", "Passion", "Leidenschaft"],
  ["ulfa", "ألفة", "Familiarity", "Vertrautheit"],
  ["hadhar", "الحذر", "Caution", "Vorsicht"],
  ["hirs", "الحرص", "Diligence", "Sorgfalt"],
  ["faza", "فزع", "Alarm", "Schreck"],
  ["fear", "خوف", "Fear", "Angst"],
  ["ishfaq", "إشفاق", "Concern", "Besorgnis"],
  ["khashya", "خشية", "Reverent fear", "Ehrfürchtige Scheu"],
  ["khushu", "خشوع", "Humility in prayer", "Demut im Gebet"],
  ["rahab", "رهب", "Dread", "Beklommenheit"],
  ["raghab", "رغب", "Longing", "Verlangen"],
  ["raja", "رجاء", "Hope", "Hoffnung"],
  ["asa", "أسى", "Grief", "Gram"],
  ["hasra", "حسرة", "Bitter regret", "Bitteres Bedauern"],
  ["ghadab", "غضب", "Anger", "Wut"],
  ["hamiyya", "الحمية", "Hot-headed zeal", "Hitzigkeit"],
  ["rida", "رضى", "Contentment", "Zufriedenheit"],
  ["ghill", "غِلّ", "Resentment", "Groll"],
  ["ghamm", "غمّ", "Gloom", "Bedrücktheit"],
  ["ghurur", "غرور", "Vanity", "Eitelkeit"],
  ["ghurba", "غربة", "Alienation", "Fremdheit"],
  ["surur", "السرور", "Delight", "Frohsinn"],
  ["nadam", "ندم", "Remorse", "Reue"],
  ["najwa", "نجوى", "Private conversation", "Vertrauliches Gespräch"],
  ["israr", "الإسرار", "Keeping a secret", "Verschwiegenheit"],
  ["aql", "العقل والتعقل", "Reason", "Vernunft"],
  ["uluw", "العلو والتعالي", "Haughtiness", "Hochmut"],
  ["tafakhur", "تفاخر", "Boasting", "Prahlerei"],
  ["karama", "الكرامة", "Dignity", "Würde"],
  ["hawn", "الهون", "Meekness", "Sanftmut"],
  ["iba", "الإباء", "Unbending pride", "Unbeugsamkeit"],
  ["istikbar", "استكبار", "Arrogance", "Überheblichkeit"],
  ["kibr", "كبر", "Pride", "Stolz"],
  ["istisghar", "استصغار", "Belittling", "Geringschätzung"],
  ["ishmiz", "الاشمئزاز", "Disgust and scorn", "Ekel und Verachtung"],
  ["ana", "الأنا والهوية", "Ego and identity", "Ego und Identität"],
  ["gheera", "الغيرة", "Jealousy", "Eifersucht"],
  ["dhull", "ذلّ", "Humiliation", "Erniedrigung"],
  ["izza", "عزّة", "Honour", "Ehre"],
  ["istiqlal", "الاستقلالية", "Independence", "Unabhängigkeit"],
  ["riya", "رياء", "Pious show", "Scheinfrömmigkeit"],
  ["yas", "يأس", "Despair", "Verzweiflung"],
  ["taa", "الطاعة", "Obedience", "Gehorsam"],
  ["wahda", "وحدة", "Being alone", "Alleinsein"],
  ["lawm", "اللوم", "Blame", "Vorwurf"],
  ["musaraa", "مسارعة", "Hastening to do good", "Eifer zum Guten"],
  ["ajala", "عجلة", "Haste", "Hast"],
  ["sabr", "صبر", "Patience", "Geduld"],
  ["amal", "أمل", "Expectation", "Erwartung"],
  ["azm", "العزم والإصرار", "Resolve", "Entschlossenheit"],
  ["liyuna", "ليونة ومرونة", "Flexibility", "Biegsamkeit"],
  ["rafa", "رأفة", "Tenderness", "Milde"],
  ["qaswa", "القسوة", "Harshness", "Härte"],
  ["kazm", "الكظم والغيظ", "Swallowed rage", "Verhaltener Zorn"],
  ["hurriya", "الحرية", "Freedom", "Freiheit"],
  ["hudud", "الحدود", "Boundaries", "Grenzen"],
  ["istibshar", "الاستبشار", "Glad anticipation", "Frohe Erwartung"],
  ["intilaq", "الانطلاق", "Unfettered ease", "Ungezwungenheit"],
  ["inqibad", "الانقباض", "Tightness", "Beklemmung"],
  ["inbisat", "الانبساط", "Openness", "Weite"],
  ["fadl", "الفضل والوفرة", "Abundance", "Fülle"],
  ["raha", "الراحة", "Rest", "Ruhe"],
  ["saraah", "السراح", "Liberation", "Befreiung"],
  ["hajr", "الهجر", "Abandonment", "Verlassenwerden"],
  ["iradh", "الإعراض", "Turning away", "Abwendung"],
  ["khudhlan", "الخذلان", "Being let down", "Im Stich gelassen"],
  ["khizy", "الخزي", "Disgrace", "Schande"],
  ["safh", "الصفح", "Overlooking a fault", "Nachsicht"],
  ["afw", "العفو", "Pardon", "Verzeihen"],
  ["istinkaf", "الاستنكاف", "Disdain", "Verschmähung"],
  ["ihsan", "إحسان واستحسان", "Goodness and approval", "Güte und Anerkennung"],
  ["ziyada", "الزيادة والأفضلية", "Superiority", "Überlegenheit"],
];

const bellyRows: Row[] = [
  ["ikhlas", "الإخلاص", "Sincerity", "Aufrichtigkeit"],
  ["istikhlas", "الاستخلاص", "Distilling", "Läuterung"],
  ["maghfira", "المغفرة", "Forgiveness", "Vergebung"],
  ["juhd", "الجهد والكسل", "Effort and laziness", "Mühe und Trägheit"],
  ["hate", "الكراهية", "Hatred", "Hass"],
  ["nufur", "النفور", "Aversion", "Abneigung"],
  ["istinfar", "الاستنفار", "Alert mobilisation", "Alarmbereitschaft"],
  ["jabr", "الجبر والإجبار", "Compulsion", "Zwang"],
  ["rafd", "الرفض والعصيان", "Refusal and defiance", "Verweigerung und Trotz"],
  ["utuw", "العُتُوّ", "Insolence", "Aufsässigkeit"],
  ["ataa", "العطاء", "Giving", "Geben"],
  ["man", "المنع", "Withholding", "Zurückhalten"],
  ["daaf", "الضعف", "Weakness", "Schwäche"],
  ["istidaaf", "الاستضعاف", "Oppression", "Unterdrückung"],
  ["wahn", "الوهن", "Frailty", "Kraftlosigkeit"],
  ["quwwa", "القوة", "Strength", "Kraft"],
  ["khasara", "الخسارة والفقد", "Loss", "Verlust"],
  ["mal", "المال والملك", "Wealth and ownership", "Besitz"],
  ["ghina", "الغنى والفقر", "Riches and poverty", "Reichtum und Armut"],
  ["sakan", "السكن والمسكنة", "Shelter and lowliness", "Obdach und Bedürftigkeit"],
  ["istiqrar", "الاستقرار", "Stability", "Beständigkeit"],
  ["qunut2", "القنوط", "Hopelessness", "Hoffnungslosigkeit"],
  ["qunut", "القنوت", "Devout obedience", "Ergebenheit"],
  ["iltizam", "الالتزام والمسؤوليات", "Commitment", "Verbindlichkeit"],
  ["irtibat", "الارتباط والروابط", "Bonds", "Bindungen"],
  ["takathur", "تكاثر", "Accumulating", "Anhäufen"],
  ["tawasul", "التواصل والقرب", "Closeness", "Nähe"],
  ["adha", "الأذى", "Harm", "Schaden"],
  ["suu", "السوء", "Wrongdoing", "Böses"],
  ["alaq", "العلق والتعلق", "Attachment", "Anhänglichkeit"],
  ["mann", "المنّ", "Reproach for favours", "Vorhalten von Wohltaten"],
  ["tamanni", "التمني", "Wishing", "Wünschen"],
  ["fujur", "الفجور", "Licentiousness", "Zügellosigkeit"],
  ["shanaan", "الشنآن", "Hostile hatred", "Feindseligkeit"],
  ["marah", "المرح", "Playfulness", "Ausgelassenheit"],
  ["himma", "الهمة والحافز", "Drive", "Antrieb"],
  ["mutaa", "المتعة والدفء", "Pleasure and warmth", "Genuss und Wärme"],
  ["shahwa", "الشهوة", "Craving", "Begierde"],
  ["uns", "الأنس", "Companionship", "Geselligkeit"],
  ["batar", "البطر", "Smugness", "Übermut"],
  ["shaqaa", "الشقاء", "Misery", "Elend"],
  ["faragh", "الفراغ", "Emptiness", "Leere"],
  ["asaf", "الأسف", "Sorrow", "Wehmut"],
  ["sadness", "الحَزَن", "Sadness", "Trauer"],
  ["huzn", "الحُزن", "Deep grief", "Tiefer Kummer"],
  ["farah", "الفرح", "Joy", "Freude"],
  ["tama", "الطمع", "Greed", "Gier"],
  ["zulm", "الظلم وأكل الحقوق", "Injustice", "Unrecht"],
  ["ijram", "الإجرام", "Crime", "Verbrechen"],
  ["udwan", "العدوان", "Aggression", "Aggression"],
  ["taslim", "الاستسلام والتسليم", "Submission", "Hingabe"],
  ["peace", "السلام والإسلام", "Peace", "Frieden"],
  ["qabul", "القبول والتقبل", "Acceptance", "Annahme"],
];

const toF = (r: Row): Feeling => ({ id: r[0], ar: r[1], en: r[2], de: r[3] });
export const chest: Feeling[] = chestRows.map(toF);
export const belly: Feeling[] = bellyRows.map(toF);

/** Gegenstuecke: Brust <-> Bauch. */
export const PAIRS: [string, string][] = [
  ["love", "hate"],
  ["fear", "sadness"],
  ["faith", "peace"],
  ["tafakhur", "takathur"],
  ["sidq", "ikhlas"],
];
export const counterpartOf = (id: string): string | null => {
  for (const [a, b] of PAIRS) {
    if (a === id) return b;
    if (b === id) return a;
  }
  return null;
};
/** Die sechs Gefuehle mit eigenem Text (Reihenfolge wie in EmotionCopy.items). */
export const TEXT_IDS = ["love", "hate", "fear", "sadness", "faith", "peace"] as const;

/* ------------------------------ Layout ------------------------------ */

export const MAP_W = 1000;
export const MAP_H = 1130;
export const HEART = { x: 500, y: 400 };
export const NAVEL = { x: 500, y: 740 };

type P = { x: number; y: number };
export type Placed = Feeling & {
  zone: "chest" | "belly";
  side: "strong" | "weak" | "mid";
  tip: P;
  /** Pfad vom Gabelpunkt (oder Stamm) zur Spitze */
  d: string;
  cluster: number;
};
export type Cluster = { id: number; zone: "chest" | "belly"; stem: string; origin: P; members: number[] };

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (n: number) => +n.toFixed(1);
const lerp = (a: P, b: P, t: number): P => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

function cubic(S: P, T: P, up: 1 | -1) {
  const dx = T.x - S.x;
  const dy = T.y - S.y;
  const arch = 46 * up * Math.min(1, Math.abs(dx) / 260);
  const c1: P = { x: S.x + dx * 0.08, y: S.y + dy * 0.55 - arch * 0.4 };
  const c2: P = { x: S.x + dx * 0.55, y: T.y - dy * 0.1 - arch };
  return [S, c1, c2, T] as const;
}
/** de Casteljau: linker Teil der Kurve bis t */
function split(c: readonly [P, P, P, P], t: number) {
  const a = lerp(c[0], c[1], t), b = lerp(c[1], c[2], t), cc = lerp(c[2], c[3], t);
  const d = lerp(a, b, t), e = lerp(b, cc, t);
  const m = lerp(d, e, t);
  return { left: [c[0], a, d, m] as const, point: m };
}
const pathOf = (c: readonly [P, P, P, P]) =>
  `M${f(c[0].x)} ${f(c[0].y)}C${f(c[1].x)} ${f(c[1].y)} ${f(c[2].x)} ${f(c[2].y)} ${f(c[3].x)} ${f(c[3].y)}`;

function layoutZone(rows: Feeling[], zone: "chest" | "belly", seed: number) {
  const r = rng(seed);
  const up = zone === "chest" ? 1 : -1;
  const N = rows.length;
  const placed: Placed[] = [];
  const clusters: Cluster[] = [];
  const base = zone === "chest" ? HEART : NAVEL;
  const spread = zone === "chest" ? 85 : 80;
  const tips: P[] = [];
  const starts: P[] = [];
  rows.forEach((_, i) => {
    const u = N === 1 ? 0.5 : i / (N - 1);
    const th = ((u - 0.5) * 2 * spread * Math.PI) / 180;
    const s = Math.sin(th);
    const c = Math.cos(th);
    const rr = 0.8 + 0.2 * r();
    if (zone === "chest") {
      tips.push({ x: 500 + s * 480 * rr, y: base.y - c * 390 * rr + 120 * s * s - 14 });
      starts.push({ x: 500 + s * 8, y: base.y + 70 + Math.abs(s) * 100 });
    } else {
      tips.push({ x: 500 + s * 470 * rr, y: base.y + c * 340 * rr - 90 * s * s + 40 });
      starts.push({ x: 500 + s * 8, y: base.y - 40 - Math.abs(s) * 60 });
    }
  });
  const sizes = [3, 2, 4, 3, 2, 3, 4, 2];
  let i = 0;
  let k = 0;
  while (i < N) {
    let n = Math.min(sizes[k % sizes.length], N - i);
    if (N - i - n === 1) n += 1;
    const idx = Array.from({ length: n }, (_, j) => i + j);
    const mean = (arr: P[]): P => ({ x: arr.reduce((a, p) => a + p.x, 0) / arr.length, y: arr.reduce((a, p) => a + p.y, 0) / arr.length });
    const S = mean(idx.map((j) => starts[j]));
    const T = mean(idx.map((j) => tips[j]));
    const cur = cubic(S, T, up);
    const id = clusters.length;
    if (n === 1) {
      const j = idx[0];
      placed[j] = mk(rows[j], zone, N, j, tips[j], pathOf(cubic(starts[j], tips[j], up)), id);
      clusters.push({ id, zone, stem: "", origin: starts[j], members: [j] });
    } else {
      const { left, point } = split(cur, 0.58);
      idx.forEach((j) => {
        const T2 = tips[j];
        const dx = T2.x - point.x;
        const dy = T2.y - point.y;
        const c1: P = { x: point.x + dx * 0.15, y: point.y + dy * 0.5 };
        const c2: P = { x: point.x + dx * 0.6, y: T2.y - dy * 0.08 };
        placed[j] = mk(rows[j], zone, N, j, T2, pathOf([point, c1, c2, T2] as const), id);
      });
      clusters.push({ id, zone, stem: pathOf(left), origin: S, members: idx });
    }
    i += n;
    k += 1;
  }
  return { placed, clusters };
}
function mk(row: Feeling, zone: "chest" | "belly", N: number, i: number, tip: P, d: string, cluster: number): Placed {
  const u = i / (N - 1);
  return { ...row, zone, side: Math.abs(u - 0.5) < 0.03 ? "mid" : u < 0.5 ? "strong" : "weak", tip: { x: f(tip.x), y: f(tip.y) }, d, cluster };
}

const c = layoutZone(chest, "chest", 17);
const b = layoutZone(belly, "belly", 5);
export const placed: Placed[] = [...c.placed, ...b.placed];
export const clusters: Cluster[] = [...c.clusters, ...b.clusters.map((k) => ({ ...k, id: k.id + c.clusters.length, members: k.members.map((m) => m + c.placed.length) }))];
placed.forEach((p, i) => {
  if (i >= c.placed.length) p.cluster += c.clusters.length;
});
