/**
 * Observances on the Hijri calendar — plain calendar facts, same list and
 * wording as the API's /v1/events and the website. Mawlid is a date, not a
 * call to observe it; Laylat al-Qadr is stated as an unknown night.
 */
export type Observance = {
  key: string;
  month: number;
  day: number;
  name: { en: string; de: string; ar: string };
  note: { en: string; de: string; ar: string };
};

export const OBSERVANCES: Observance[] = [
  { key: 'new-year', month: 1, day: 1, name: { en: 'Islamic New Year', de: 'Islamisches Neujahr', ar: 'رأس السنة الهجرية' }, note: { en: 'Start of the Hijri year.', de: 'Beginn des Hijri-Jahres.', ar: 'بداية السنة الهجرية.' } },
  { key: 'ashura', month: 1, day: 10, name: { en: 'Ashura', de: 'Aschura', ar: 'عاشوراء' }, note: { en: '10th of Muharram.', de: '10. Muharram.', ar: 'العاشر من محرّم.' } },
  { key: 'mawlid', month: 3, day: 12, name: { en: 'Mawlid al-Nabi', de: 'Mawlid an-Nabi', ar: 'المولد النبوي' }, note: { en: 'Birth date of the Prophet ﷺ. Observance of this date is debated among scholars.', de: 'Geburtsdatum des Propheten ﷺ. Ob dieser Tag begangen werden soll, ist unter Gelehrten umstritten.', ar: 'تاريخ مولد النبي ﷺ. إحياء هذا اليوم مسألة خلافية بين العلماء.' } },
  { key: 'ramadan-start', month: 9, day: 1, name: { en: 'Start of Ramadan', de: 'Beginn des Ramadan', ar: 'بداية رمضان' }, note: { en: 'Subject to moon sighting; the calculated date may shift by a day.', de: 'Abhängig von der Mondsichtung; das berechnete Datum kann um einen Tag abweichen.', ar: 'مرتبط برؤية الهلال؛ قد يختلف التاريخ المحسوب بيوم واحد.' } },
  { key: 'laylat-al-qadr', month: 9, day: 27, name: { en: 'Laylat al-Qadr (commonly observed)', de: 'Laylat al-Qadr (üblich beobachtet)', ar: 'ليلة القدر (المعتاد إحياؤها)' }, note: { en: 'The exact night is not specified in tradition — commonly the 27th.', de: 'Die genaue Nacht ist überliefert unbekannt — üblich ist die 27.', ar: 'لم تُحدَّد الليلة بعينها في النص — الشائع ليلة ٢٧.' } },
  { key: 'eid-al-fitr', month: 10, day: 1, name: { en: 'Eid al-Fitr', de: 'Eid al-Fitr', ar: 'عيد الفطر' }, note: { en: '1st of Shawwal, end of Ramadan.', de: '1. Schawwal, Ende des Ramadan.', ar: 'الأول من شوّال، نهاية رمضان.' } },
  { key: 'eid-al-adha', month: 12, day: 10, name: { en: 'Eid al-Adha', de: 'Eid al-Adha', ar: 'عيد الأضحى' }, note: { en: '10th of Dhu al-Hijjah, during Hajj.', de: '10. Dhu al-Hijjah, während der Hajj.', ar: 'العاشر من ذي الحجة، أثناء الحج.' } },
];
