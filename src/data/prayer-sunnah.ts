/*
 * The Sunnah of each prayer's time, and what the hadith say about the iqama — shown in the "Now"
 * block on Today. Paraphrased for Athar (no translation is quoted), with the source as the common
 * (Abd al-Baqi) number. The Arabic lines are descriptions written for Athar, not hadith text (that
 * is only ever cut from the dataset, see duas.ts). Like the du'a meanings, this still needs a scholarly review before release:
 * check each number against the collection.
 *
 * There is no fixed number of minutes between adhan and iqama in the hadith; mosques set it. So the
 * app names none and says what is narrated: room for a voluntary prayer between the two.
 */
import type { ContentLocale } from '@/lib/i18n';

export type SunnahKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'duha' | 'night' | 'pause';
type Text = Record<ContentLocale, string>;
export type SunnahNote = { text: Text; source: string };

export const PRAYER_SUNNAH: Record<SunnahKey, SunnahNote> = {
  fajr: {
    text: {
      en: 'The Prophet ﷺ prayed Fajr early, while it was still dark.',
      de: 'Der Prophet ﷺ betete Fadschr früh, noch in der Dunkelheit.',
      ar: 'كان النبي ﷺ يصلي الفجر مبكرًا والظلام باقٍ.',
    },
    source: 'Bukhari 578',
  },
  dhuhr: {
    text: {
      en: 'In fierce heat, wait until it cools a little.',
      de: 'Bei großer Hitze: warten, bis es etwas kühler wird.',
      ar: 'في شدة الحر يُستحب تأخير الظهر حتى يخف الحر.',
    },
    source: 'Bukhari 533',
  },
  asr: {
    text: {
      en: 'Pray while the sun is still bright, before it turns yellow.',
      de: 'Beten, solange die Sonne noch hell ist, bevor sie gelb wird.',
      ar: 'تُصلّى والشمس ما زالت بيضاء قبل أن تصفر.',
    },
    source: 'Muslim 612',
  },
  maghrib: {
    text: {
      en: 'Pray it soon after sunset, while there is still light.',
      de: 'Bald nach Sonnenuntergang beten, solange es noch hell ist.',
      ar: 'تُصلّى بعد الغروب بقليل والضوء باقٍ.',
    },
    source: 'Bukhari 559',
  },
  isha: {
    text: {
      en: 'A later Isha is better, if it is not a hardship.',
      de: 'Ein späteres Ischa ist besser, wenn es nicht schwerfällt.',
      ar: 'تأخير العشاء أفضل إن لم يكن فيه مشقة.',
    },
    source: 'Bukhari 571',
  },
  duha: {
    text: {
      en: 'Two rak‘ahs of Duha stand for a charity for every joint.',
      de: 'Zwei Rakaat Duha gelten als Spende für jedes Gelenk.',
      ar: 'ركعتان من الضحى تكفيان عن الصدقة عن كل مفصل.',
    },
    source: 'Muslim 720',
  },
  night: {
    text: {
      en: 'In the last third of the night our Lord descends and asks who is calling on Him.',
      de: 'Im letzten Drittel der Nacht steigt unser Herr herab und fragt, wer Ihn anruft.',
      ar: 'في الثلث الأخير من الليل ينزل ربنا ويجيب من يدعوه.',
    },
    source: 'Bukhari 1145',
  },
  pause: {
    text: {
      en: 'No prayer while the sun rises or stands at its zenith; the next time is close.',
      de: 'Kein Gebet, während die Sonne aufgeht oder im Zenit steht; die nächste Zeit ist nah.',
      ar: 'لا صلاة وقت شروق الشمس ولا وقت استوائها، والوقت التالي قريب.',
    },
    source: 'Muslim 831',
  },
};

export const IQAMA_NOTE: SunnahNote = {
  text: {
    en: 'The hadith set no fixed minutes; between adhan and iqama there is room for a voluntary prayer.',
    de: 'Die Hadithe nennen keine feste Minutenzahl; zwischen Adhan und Iqama ist Raum für ein freiwilliges Gebet.',
    ar: 'لا تحدد الأحاديث دقائق ثابتة، وبين الأذان والإقامة متسع لصلاة نافلة.',
  },
  source: 'Bukhari 624',
};
