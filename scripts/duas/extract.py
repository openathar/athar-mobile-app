import json, re, sys
TASHKEEL = re.compile(r'[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640\u200f\u200e]')
def nchar(c):
    if TASHKEEL.match(c): return ''
    c = re.sub('[إأآٱ]', 'ا', c)
    return {'ى': 'ي', 'ة': 'ه'}.get(c, c)
def normmap(s):
    out, idx = [], []
    for i, c in enumerate(s):
        n = nchar(c)
        if n.isspace():
            if out and out[-1] == ' ': continue
            n = ' '
        for ch in n:
            out.append(ch); idx.append(i)
    return ''.join(out), idx
def norm(s): return normmap(s)[0]
cache = {}
def load(c):
    if c not in cache: cache[c] = json.load(open(f'/tmp/hadith/ara-{c}.json'))['hadiths']
    return cache[c]
def extract(coll, start, end, number=None):
    S, E = norm(start), norm(end)
    for h in load(coll):
        if number and not str(h.get('arabicnumber', h['hadithnumber'])).split('.')[0] == str(number): continue
        t = h['text']
        nt, idx = normmap(t)
        a = nt.find(S)
        if a < 0: continue
        b = nt.find(E, a)
        if b < 0: continue
        b_end = b + len(E) - 1
        # extend to include trailing vowel marks of the last letter
        j = idx[b_end] + 1
        while j < len(t) and TASHKEEL.match(t[j]) and t[j] not in '\u200f\u200e': j += 1
        seg = t[idx[a]:j]
        seg = re.sub(r'[\u200f\u200e"]', '', seg)
        seg = re.sub(r'\s+', ' ', seg).strip()
        grades = [f"{g.get('name')}: {g.get('grade')}" for g in h.get('grades', [])]
        return {'coll': coll, 'no': str(h.get('arabicnumber', h['hadithnumber'])).split('.')[0], 'text': seg, 'grades': grades, 'context': t[max(0, idx[a]-160):idx[a]].replace('\u200f', '')}
    return None
if __name__ == '__main__':
    r = extract(*sys.argv[1:])
    print(json.dumps(r, ensure_ascii=False, indent=1))
