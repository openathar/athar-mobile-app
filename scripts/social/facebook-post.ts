/**
 * Generates a Facebook post from the app's bundled data.
 * Run: npx tsx scripts/social/facebook-post.ts --lang de --type dua
 *
 * Types: dua, prayer-times, moon, observance
 * Output: a ready-to-paste post with text + hashtags.
 */
import { DUAS, DUAS_BY_PHASE } from '../../src/data/duas';
import { OBSERVANCES } from '../data/observances';
import { BUNDLED_CITIES } from '../../src/data/cities';

type Lang = 'en' | 'de' | 'ar' | 'pl' | 'tr';

const HASHTAGS: Record<Lang, string> = {
  en: '#Athar #PrayerTimes #Duas #IslamicApp #OpenSource',
  de: '#Athar #Gebetszeiten #Dua #IslamischeApp #OpenSource',
  ar: '#أثر #أوقات_الصلاة #دعاء #تطبيق_إسلامي # 오픈소스',
  pl: '#Athar #CzasyModlitwy #Dua #AplikacjaIslamska #OpenSource',
  tr: '#Athar #NamazVakitleri #Dua #İslamUygulaması #OpenSource',
};

const PHASES = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
const PHASE_LABELS: Record<Lang, Record<string, string>> = {
  en: { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
  de: { fajr: 'Fadschr', sunrise: 'Sonnenaufgang', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Ischa' },
  ar: { fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' },
  pl: { fajr: 'Fadżr', sunrise: 'Wschód', dhuhr: 'Zuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isza' },
  tr: { fajr: 'Sabah', sunrise: 'Güneş', dhuhr: 'Öğle', asr: 'İkindi', maghrib: 'Akşam', isha: 'Yatsı' },
};

function duaPost(lang: Lang) {
  const today = new Date();
  const day = Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86_400_000);
  const phase = PHASES[new Date().getHours() < 6 ? 0 : new Date().getHours() < 9 ? 1 : new Date().getHours() < 13 ? 2 : new Date().getHours() < 16 ? 3 : new Date().getHours() < 19 ? 4 : 5];
  const list = DUAS_BY_PHASE[phase];
  const dua = DUAS[list[day % list.length]];
  const meaning = dua.meaning[lang as 'en' | 'de' | 'pl' | 'tr'];
  const occasion = dua.occasion[lang as 'en' | 'de' | 'pl' | 'tr' | 'ar'];
  const label = PHASE_LABELS[lang][phase];
  return `🕌 ${label} — ${t(lang, 'dua')}\n\n${dua.arabic}\n\n${meaning}\n\n— ${occasion}\n${collectionName(dua.collection, lang)} ${dua.number}\n\n${HASHTAGS[lang]}`;
}

function prayerTimesPost(lang: Lang, city: string) {
  const c = BUNDLED_CITIES.find((x) => x.name.en.toLowerCase() === city.toLowerCase()) ?? BUNDLED_CITIES[0];
  return `🕌 ${t(lang, 'today')} — ${c.name[lang as 'en' | 'de' | 'ar']}\n\n${HASHTAGS[lang]}`;
}

function collectionName(c: string, lang: Lang) {
  const names: Record<string, Record<Lang, string>> = {
    bukhari: { en: 'Sahih al-Bukhari', de: 'Sahih al-Buchari', ar: 'صحيح البخاري', pl: 'Sahih al-Buchari', tr: 'Sahîh-i Buhârî' },
    muslim: { en: 'Sahih Muslim', de: 'Sahih Muslim', ar: 'صحيح مسلم', pl: 'Sahih Muslim', tr: 'Sahîh-i Müslim' },
    abudawud: { en: 'Sunan Abi Dawud', de: 'Sunan Abi Dawud', ar: 'سنن أبي داود', pl: 'Sunan Abi Dawud', tr: 'Sünen-i Ebû Dâvûd' },
    tirmidhi: { en: "Jami' at-Tirmidhi", de: 'Dschami at-Tirmidhi', ar: 'جامع الترمذي', pl: 'Dżami at-Tirmizi', tr: "Câmiu't-Tirmizî" },
    ibnmajah: { en: 'Sunan Ibn Majah', de: 'Sunan Ibn Madscha', ar: 'سنن ابن ماجه', pl: 'Sunan Ibn Madża', tr: 'Sünen-i İbn Mâce' },
  };
  return names[c]?.[lang] ?? c;
}

function t(lang: Lang, key: string) {
  const dict: Record<Lang, Record<string, string>> = {
    en: { dua: 'Du’a', today: 'Today' },
    de: { dua: 'Du’a', today: 'Heute' },
    ar: { dua: 'دعاء', today: 'اليوم' },
    pl: { dua: 'Du’a', today: 'Dziś' },
    tr: { dua: 'Dua', today: 'Bugün' },
  };
  return dict[lang]?.[key] ?? key;
}

const args = process.argv.slice(2);
const lang = (args.find((a) => a.startsWith('--lang='))?.split('=')[1] ?? 'de') as Lang;
const type = args.find((a) => a.startsWith('--type='))?.split('=')[1] ?? 'dua';

if (type === 'dua') console.log(duaPost(lang));
else if (type === 'prayer-times') console.log(prayerTimesPost(lang, args.find((a) => a.startsWith('--city='))?.split('=')[1] ?? 'Berlin'));
