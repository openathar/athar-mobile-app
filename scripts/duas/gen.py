import json
src = {d['key']: d for d in json.load(open('duas.json'))}
# Meaning (written for Athar, not copied from a published translation) and occasion per language.
M = {
 'wake': ('All praise is for Allah, who gave us life after He had caused us to die, and to Him is the rising.',
          'Alles Lob gebührt Allah, der uns wieder belebt hat, nachdem Er uns sterben ließ, und zu Ihm ist die Auferstehung.',
          'Wszelka chwała należy do Allaha, który przywrócił nam życie, gdy dał nam umrzeć, i do Niego jest zmartwychwstanie.',
          'Bizi öldürdükten sonra dirilten Allah’a hamdolsun; diriliş O’nadır.'),
 'afterFajr': ('O Allah, I ask You for knowledge that benefits, provision that is good, and deeds that are accepted.',
          'O Allah, ich bitte Dich um nützliches Wissen, gute Versorgung und Taten, die angenommen werden.',
          'Allahu, proszę Cię o wiedzę pożyteczną, dobre utrzymanie i uczynki, które zostaną przyjęte.',
          'Allah’ım, Senden faydalı ilim, temiz rızık ve kabul olunmuş amel isterim.'),
 'morning': ('O Allah, by You we reach the morning and by You the evening, by You we live and by You we die, and to You is the return.',
          'O Allah, durch Dich erreichen wir den Morgen und durch Dich den Abend, durch Dich leben wir und durch Dich sterben wir, und zu Dir ist die Heimkehr.',
          'Allahu, dzięki Tobie nastaje nasz poranek i dzięki Tobie wieczór, dzięki Tobie żyjemy i dzięki Tobie umieramy, i do Ciebie jest powrót.',
          'Allah’ım, Seninle sabaha, Seninle akşama ereriz; Seninle yaşar, Seninle ölürüz; dönüş Sanadır.'),
 'bismillah': ('In the name of Allah, with whose name nothing on earth or in the heavens can cause harm, and He is the All-Hearing, the All-Knowing.',
          'Im Namen Allahs, mit dessen Namen nichts auf der Erde und nichts im Himmel schaden kann; und Er ist der Allhörende, der Allwissende.',
          'W imię Allaha, z którego imieniem nic na ziemi ani w niebie nie może zaszkodzić; On jest Wszystkosłyszący, Wszechwiedzący.',
          'Adıyla yerde ve gökte hiçbir şeyin zarar veremediği Allah’ın adıyla. O işitendir, bilendir.'),
 'worry': ('O Allah, I seek refuge in You from worry and grief, from helplessness and laziness, from miserliness and cowardice, from the burden of debt and from being overpowered by people.',
          'O Allah, ich suche Zuflucht bei Dir vor Sorge und Kummer, vor Unvermögen und Trägheit, vor Geiz und Feigheit, vor der Last der Schulden und davor, von Menschen überwältigt zu werden.',
          'Allahu, szukam u Ciebie schronienia przed troską i smutkiem, niemocą i lenistwem, skąpstwem i tchórzostwem, ciężarem długów i przemocą ludzi.',
          'Allah’ım, kaygıdan ve hüzünden, acizlikten ve tembellikten, cimrilikten ve korkaklıktan, borç yükünden ve insanların baskısından Sana sığınırım.'),
 'hasana': ('Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.',
          'Unser Herr, gib uns im Diesseits Gutes und im Jenseits Gutes und bewahre uns vor der Strafe des Feuers.',
          'Panie nasz, daj nam dobro na tym świecie i dobro w życiu ostatecznym i uchroń nas od kary Ognia.',
          'Rabbimiz, bize dünyada da iyilik ver, ahirette de iyilik ver ve bizi ateş azabından koru.'),
 'dhikr': ('O Allah, help me to remember You, to thank You, and to worship You well.',
          'O Allah, hilf mir, Deiner zu gedenken, Dir zu danken und Dir auf schöne Weise zu dienen.',
          'Allahu, pomóż mi wspominać Cię, dziękować Ci i pięknie Cię czcić.',
          'Allah’ım, Seni anmam, Sana şükretmem ve Sana güzelce kulluk etmem için bana yardım et.'),
 'heart': ('O Turner of hearts, keep my heart firm upon Your religion.',
          'O Du, der die Herzen wendet, festige mein Herz in Deiner Religion.',
          'O Ty, który odmieniasz serca, utwierdź moje serce w Twojej religii.',
          'Ey kalpleri evirip çeviren, kalbimi dinin üzere sabit kıl.'),
 'evening': ('We have reached the evening and the dominion belongs to Allah. Praise is for Allah. There is no god but Allah alone, without partner.',
          'Wir haben den Abend erreicht, und die Herrschaft gehört Allah. Das Lob gebührt Allah. Es gibt keinen Gott außer Allah allein, ohne Teilhaber.',
          'Nastał nasz wieczór, a władza należy do Allaha. Chwała Allahowi. Nie ma boga poza Allahem, Jedynym, bez współtowarzysza.',
          'Akşama erdik, mülk de Allah’ındır. Hamd Allah’adır. Allah’tan başka ilah yoktur; O tektir, ortağı yoktur.'),
 'eveningBi': ('O Allah, by You we reach the evening and by You the morning, by You we live and by You we die, and to You is the rising.',
          'O Allah, durch Dich erreichen wir den Abend und durch Dich den Morgen, durch Dich leben wir und durch Dich sterben wir, und zu Dir ist die Auferstehung.',
          'Allahu, dzięki Tobie nastaje nasz wieczór i dzięki Tobie poranek, dzięki Tobie żyjemy i dzięki Tobie umieramy, i do Ciebie jest zmartwychwstanie.',
          'Allah’ım, Seninle akşama, Seninle sabaha ereriz; Seninle yaşar, Seninle ölürüz; diriliş Sanadır.'),
 'sayyid': ('O Allah, You are my Lord; there is no god but You. You created me and I am Your servant, and I keep to Your covenant and promise as far as I am able. I seek refuge in You from the evil of what I have done. I acknowledge Your favour upon me and I acknowledge my sin, so forgive me, for none forgives sins but You.',
          'O Allah, Du bist mein Herr, es gibt keinen Gott außer Dir. Du hast mich erschaffen, und ich bin Dein Diener. Ich halte an Deinem Bund und Versprechen fest, so gut ich kann. Ich suche Zuflucht bei Dir vor dem Übel dessen, was ich getan habe. Ich bekenne Deine Gnade an mir und bekenne meine Sünde. So vergib mir, denn niemand vergibt die Sünden außer Dir.',
          'Allahu, Ty jesteś moim Panem, nie ma boga poza Tobą. Stworzyłeś mnie, a ja jestem Twoim sługą. Trwam przy Twoim przymierzu i obietnicy, na ile potrafię. Szukam u Ciebie schronienia przed złem tego, co uczyniłem. Wyznaję Twoją łaskę wobec mnie i wyznaję mój grzech, więc przebacz mi, bo nikt nie przebacza grzechów poza Tobą.',
          'Allah’ım, Sen benim Rabbimsin; Senden başka ilah yoktur. Beni Sen yarattın, ben Senin kulunum. Gücüm yettiğince Sana verdiğim ahit ve söz üzereyim. Yaptıklarımın şerrinden Sana sığınırım. Bana olan nimetini ikrar eder, günahımı itiraf ederim. Beni bağışla; çünkü günahları Senden başka bağışlayan yoktur.'),
 'words': ('I seek refuge in the perfect words of Allah from the evil of what He has created.',
          'Ich suche Zuflucht bei den vollkommenen Worten Allahs vor dem Übel dessen, was Er erschaffen hat.',
          'Szukam schronienia w doskonałych słowach Allaha przed złem tego, co stworzył.',
          'Yarattıklarının şerrinden Allah’ın eksiksiz kelimelerine sığınırım.'),
 'huda': ('O Allah, I ask You for guidance, piety, chastity and freedom from need.',
          'O Allah, ich bitte Dich um Rechtleitung, Gottesfurcht, Keuschheit und Unabhängigkeit.',
          'Allahu, proszę Cię o prowadzenie, bogobojność, czystość i niezależność.',
          'Allah’ım, Senden hidayet, takva, iffet ve gönül zenginliği isterim.'),
 'afiyaDA': ('O Allah, I ask You for well-being in this world and the Hereafter.',
          'O Allah, ich bitte Dich um Wohlergehen im Diesseits und im Jenseits.',
          'Allahu, proszę Cię o dobrostan na tym świecie i w życiu ostatecznym.',
          'Allah’ım, Senden dünyada ve ahirette afiyet isterim.'),
 'sleep': ('In Your name I die and I live.', 'In Deinem Namen sterbe ich und lebe ich.', 'W Twoje imię umieram i żyję.', 'Senin adınla ölür, Senin adınla dirilirim.'),
 'qini': ('O Allah, protect me from Your punishment on the Day You raise Your servants.',
          'O Allah, bewahre mich vor Deiner Strafe an dem Tag, an dem Du Deine Diener auferweckst.',
          'Allahu, uchroń mnie od Twojej kary w Dniu, w którym wskrzesisz Swoje sługi.',
          'Allah’ım, kullarını dirilttiğin gün beni azabından koru.'),
 'afw': ('O Allah, You are pardoning and generous, You love to pardon, so pardon me.',
          'O Allah, Du bist vergebend und großzügig, Du liebst das Vergeben, so vergib mir.',
          'Allahu, Ty jesteś Przebaczający i Szczodry, kochasz przebaczać, więc przebacz mi.',
          'Allah’ım, Sen affedicisin, kerimsin, affetmeyi seversin; beni affet.'),
}
# Occasion, as the hadith states it: (en, de, ar, pl, tr)
O = {
 'wake': ('On waking up', 'Beim Aufwachen', 'عند الاستيقاظ', 'Po przebudzeniu', 'Uyanınca'),
 'afterFajr': ('After the Fajr prayer', 'Nach dem Fadschr-Gebet', 'بعد السلام من صلاة الصبح', 'Po modlitwie Fadżr', 'Sabah namazından sonra'),
 'morning': ('In the morning', 'Am Morgen', 'في الصباح', 'Rano', 'Sabah'),
 'bismillah': ('Morning and evening, three times', 'Morgens und abends, dreimal', 'صباحًا ومساءً، ثلاث مرات', 'Rano i wieczorem, trzy razy', 'Sabah ve akşam, üç kez'),
 'worry': ('He ﷺ said it often', 'Er ﷺ sagte es oft', 'كان ﷺ يكثر من قوله', 'Często je powtarzał ﷺ', 'Sık sık söylerdi ﷺ'),
 'hasana': ('His ﷺ most frequent du’a', 'Sein ﷺ häufigstes Du’a', 'أكثر دعاء النبي ﷺ', 'Jego ﷺ najczęstsza du’a', 'En çok yaptığı dua ﷺ'),
 'dhikr': ('At the end of every prayer', 'Am Ende jedes Gebets', 'في دبر كل صلاة', 'Na końcu każdej modlitwy', 'Her namazın sonunda'),
 'heart': ('He ﷺ said it often', 'Er ﷺ sagte es oft', 'كان ﷺ يكثر أن يقوله', 'Często je powtarzał ﷺ', 'Sık sık söylerdi ﷺ'),
 'evening': ('In the evening', 'Am Abend', 'في المساء', 'Wieczorem', 'Akşam'),
 'eveningBi': ('In the evening', 'Am Abend', 'في المساء', 'Wieczorem', 'Akşam'),
 'sayyid': ('Morning and evening — the master of seeking forgiveness', 'Morgens und abends — das Beste der Vergebungsbitten', 'صباحًا ومساءً — سيد الاستغفار', 'Rano i wieczorem — najlepsza z próśb o przebaczenie', 'Sabah ve akşam — Seyyidü’l-istiğfar'),
 'words': ('In the evening, and when stopping at a place', 'Am Abend und wenn man irgendwo Halt macht', 'في المساء وإذا نزل منزلًا', 'Wieczorem i gdy zatrzymujesz się w jakimś miejscu', 'Akşam ve bir yere konaklayınca'),
 'huda': ('One of his ﷺ du’as', 'Eines seiner ﷺ Bittgebete', 'من دعاء النبي ﷺ', 'Jedna z jego ﷺ du’a', 'Dualarından biri ﷺ'),
 'afiyaDA': ('Morning and evening — he ﷺ never left it', 'Morgens und abends — er ﷺ ließ es nie aus', 'صباحًا ومساءً — لم يكن ﷺ يدعه', 'Rano i wieczorem — nigdy jej nie pomijał ﷺ', 'Sabah ve akşam — hiç bırakmazdı ﷺ'),
 'sleep': ('Before sleeping', 'Vor dem Schlafen', 'عند النوم', 'Przed snem', 'Uyumadan önce'),
 'qini': ('Before sleeping, the right hand under the cheek', 'Vor dem Schlafen, die rechte Hand unter der Wange', 'عند النوم، واليد اليمنى تحت الخد', 'Przed snem, z prawą dłonią pod policzkiem', 'Uyumadan önce, sağ el yanağın altında'),
 'afw': ('At night — taught for Laylat al-Qadr', 'In der Nacht — gelehrt für Laylat al-Qadr', 'في الليل — علّمه لليلة القدر', 'Nocą — nauczana na Lajlat al-Kadr', 'Gece — Kadir Gecesi için öğretildi'),
}
COUNT = {'bismillah': 3}
PHASES = {
 'fajr': ['wake', 'afterFajr', 'morning'],
 'sunrise': ['bismillah', 'worry', 'hasana'],
 'dhuhr': ['dhikr', 'heart', 'huda'],
 'asr': ['evening', 'eveningBi', 'sayyid'],
 'maghrib': ['words', 'afiyaDA', 'bismillah'],
 'isha': ['sleep', 'qini', 'afw'],
}
def grade(d):
    if d['coll'] in ('bukhari', 'muslim'): return 'Sahih'
    for g in d['grades']:
        if g.startswith('Al-Albani'): return g.split(': ', 1)[1]
    return ''
out = []
for key, d in src.items():
    en, de, pl, tr = M[key]
    o = O[key]
    out.append({
        'key': key, 'arabic': d['text'], 'collection': d['coll'], 'number': d['no'], 'grade': grade(d),
        'count': COUNT.get(key),
        'meaning': {'en': en, 'de': de, 'pl': pl, 'tr': tr},
        'occasion': {'en': o[0], 'de': o[1], 'ar': o[2], 'pl': o[3], 'tr': o[4]},
    })
ts = '''/*
 * Du\u2019a for each part of the day. GENERATED by scripts/duas/ — do not edit by hand.
 *
 * The Arabic is cut verbatim (with its vowelling) out of the hadith collections
 * as published in the open hadith-api dataset (fawazahmed0/hadith-api, Arabic
 * editions), located by its opening and closing words; nothing is typed from
 * memory. Only narrations graded sahih or hasan are used (Bukhari and Muslim,
 * otherwise al-Albani's grade as given in the dataset). `number` is the common
 * (Abd al-Baqi / standard) numbering. The meanings are written for Athar —
 * not copied from a published translation — and still need a scholarly review.
 */
import type { DayPhase } from '@/constants/theme';

export type Collection = 'bukhari' | 'muslim' | 'abudawud' | 'tirmidhi' | 'ibnmajah';
export type Dua = {
  key: string;
  arabic: string;
  collection: Collection;
  number: string;
  grade: string;
  /** How often to say it, where the hadith says so. */
  count?: number;
  meaning: { en: string; de: string; pl: string; tr: string };
  occasion: { en: string; de: string; ar: string; pl: string; tr: string };
};

export const DUAS: Record<string, Dua> = ''' + json.dumps({d['key']: {k: v for k, v in d.items() if v is not None} for d in out}, ensure_ascii=False, indent=2) + ''';

/** Which du\u2019a belong to which part of the day (the current prayer period). */
export const DUAS_BY_PHASE: Record<DayPhase, string[]> = ''' + json.dumps(PHASES, indent=2) + ''';
'''
open('/Users/ahmad/Development/business/athar/mobile/src/data/duas.ts', 'w').write(ts)
print(len(out), 'duas written')
