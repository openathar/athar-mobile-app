import json
from extract import extract
C = [
 ('wake',      'bukhari',  'الحمد لله الذي احيانا', 'واليه النشور', 6312),
 ('afterFajr', 'ibnmajah', 'اللهم اني اسالك علما نافعا', 'وعملا متقبلا', None),
 ('morning',   'tirmidhi', 'اللهم بك اصبحنا', 'واليك المصير', 3391),
 ('bismillah', 'abudawud', 'بسم الله الذي لا يضر مع اسمه', 'وهو السميع العليم', None),
 ('worry',     'bukhari',  'اللهم اني اعوذ بك من الهم والحزن', 'وغلبه الرجال', None),
 ('hasana',    'bukhari',  'ربنا اتنا في الدنيا حسنه', 'عذاب النار', 6389),
 ('dhikr',     'abudawud', 'اللهم اعني علي ذكرك', 'وحسن عبادتك', 1522),
 ('heart',     'tirmidhi', 'يا مقلب القلوب ثبت قلبي علي دينك', 'علي دينك', 2140),
 ('evening',   'muslim',   'امسينا وامسي الملك لله', 'لا شريك له', 2723),
 ('eveningBi', 'tirmidhi', 'اللهم بك امسينا', 'واليك النشور', 3391),
 ('sayyid',    'bukhari',  'اللهم انت ربي', 'لا يغفر الذنوب الا انت', 6306),
 ('words',     'muslim',   'اعوذ بكلمات الله التامات', 'من شر ما خلق', 2709),
 ('huda',      'muslim',   'اللهم اني اسالك الهدي', 'والغني', 2721),
 ('afiyaDA',   'abudawud', 'اللهم اني اسالك العافيه في الدنيا والاخره', 'والاخره', 5074),
 ('sleep',     'bukhari',  'باسمك اموت واحيا', 'واحيا', 6312),
 ('qini',      'abudawud', 'اللهم قني عذابك', 'عبادك', 5045),
 ('afw',       'tirmidhi', 'اللهم انك عفو', 'فاعف عني', 3513),
]
out = []
for key, coll, s, e, n in C:
    r = extract(coll, s, e, n)
    if not r: print('!! NOT FOUND', key); continue
    r['key'] = key
    out.append(r)
    print(f"{key:10} {coll} {r['no']:>6} | {'; '.join(r['grades'])[:120]}\n           {r['text']}")
json.dump(out, open('/tmp/hadith/duas.json', 'w'), ensure_ascii=False, indent=1)
