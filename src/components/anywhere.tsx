import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrayerTimes, Methods, formatLocalTime } from '@openathar/athan-core-ts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, Divider, SectionLabel } from '@/components/screen';
import { BUNDLED_CITIES } from '@/data/cities';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { LOCALE, PRAYER_KEYS, t } from '@/lib/i18n';

/** Our own city lookup (GeoNames data, no third-party geocoder sees the query). */
const API = 'https://api.openathar.org';
const STORAGE_KEY = 'athar.anywhere.v1';
const ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

type Place = { name: string; country: string; latitude: number; longitude: number; timezone: string; utcOffsetHours: number };

/** The place's UTC offset right now, from its IANA zone (daylight saving included); falls back to the stored one. */
function offsetHoursNow(zone: string, fallback: number): number {
  try {
    const part = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName')?.value;
    const m = part?.match(/GMT([+-])(\d{2}):(\d{2})/);
    if (m) return (m[1] === '-' ? -1 : 1) * (Number(m[2]) + Number(m[3]) / 60);
  } catch {
    // zone data missing on this runtime
  }
  return fallback;
}

const fold = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Bundled cities that match the query in any of the three languages — instant and offline. */
function localMatches(q: string): Place[] {
  const needle = fold(q.trim());
  return BUNDLED_CITIES.filter((c) => Object.values(c.name).some((n) => fold(n).includes(needle))).map((c) => ({
    name: c.name[LOCALE],
    country: c.country,
    latitude: c.latitude,
    longitude: c.longitude,
    timezone: c.timezone,
    utcOffsetHours: 0,
  }));
}

function timesFor(place: Place) {
  const offset = offsetHoursNow(place.timezone, place.utcOffsetHours);
  const local = new Date(Date.now() + offset * 3_600_000);
  const result = new PrayerTimes(Methods.MWL).getTimes(local.getUTCFullYear(), local.getUTCMonth() + 1, local.getUTCDate(), place.latitude, place.longitude);
  return { offset, result };
}

/**
 * "Anywhere": look up any city and see today's prayer times there, computed
 * on the device with the same engine as the API. Cities you looked at are
 * kept for offline use.
 */
export function Anywhere() {
  const { colors } = usePhase();
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<Place[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'empty' | 'offline'>('idle');
  const [recent, setRecent] = useState<Place[]>([]);
  const [selected, setSelected] = useState<Place | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (!v) return;
        const list = JSON.parse(v) as Place[];
        setRecent(list);
        setSelected(list[0] ?? null);
      })
      .catch(() => {});
  }, []);

  // Local matches answer at once; the server adds the rest of the world. If the
  // server cannot be reached, nothing is shown about it — the local list stands.
  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setFound([]);
      setStatus('idle');
      return;
    }
    const local = localMatches(q);
    setFound(local.slice(0, 5));
    setStatus(local.length ? 'idle' : 'loading');
    try {
      const res = await fetch(`${API}/v1/places?limit=5&q=${encodeURIComponent(q.trim())}`);
      const data = (await res.json()) as { places?: Place[] };
      const remote = data.places ?? [];
      const merged = [...local, ...remote.filter((r) => !local.some((l) => l.latitude.toFixed(1) === r.latitude.toFixed(1) && l.longitude.toFixed(1) === r.longitude.toFixed(1)))].slice(0, 6);
      setFound(merged);
      setStatus(merged.length ? 'idle' : 'empty');
    } catch {
      setStatus(local.length ? 'idle' : 'empty');
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => search(query), 400);
    return () => clearTimeout(id);
  }, [query, search]);

  const choose = (p: Place) => {
    setSelected(p);
    setQuery('');
    setFound([]);
    const next = [p, ...recent.filter((r) => !(r.name === p.name && r.country === p.country))].slice(0, 5);
    setRecent(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  };

  const forget = (p: Place) => {
    const next = recent.filter((r) => r !== p);
    setRecent(next);
    if (selected === p) setSelected(next[0] ?? null);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  };

  const shown = useMemo(() => (selected ? timesFor(selected) : null), [selected]);

  return (
    <View>
      <SectionLabel>{t.anywhere}</SectionLabel>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t.anywhereHint}
        placeholderTextColor={colors.textSecondary}
        autoCorrect={false}
        style={[styles.input, { borderBottomColor: colors.rule, color: colors.text, fontFamily: Fonts.sans, textAlign: LOCALE === 'ar' ? 'right' : 'left' }]}
      />

      {status === 'empty' && <Text style={[styles.note, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.anywhereNoResult}</Text>}

      {found.length > 0 && (
        <Card style={styles.results}>
          {found.map((p, i) => (
            <View key={`${p.name}-${p.latitude}`}>
              {i > 0 && <Divider />}
              <Pressable onPress={() => choose(p)} style={({ pressed }) => [styles.pick, pressed && styles.pressed]}>
                <Text style={[styles.pickName, { color: colors.text, fontFamily: Fonts.sansMedium }]}>{p.name}</Text>
                <Text style={[styles.pickHint, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>{p.country}</Text>
              </Pressable>
            </View>
          ))}
        </Card>
      )}

      {selected && shown && (
        <View style={styles.selected}>
          <Text style={[styles.city, { color: colors.text, fontFamily: Fonts.display }]}>{selected.name}</Text>
          <Card>
            {ORDER.map((key, i) => (
              <View key={key}>
                {i > 0 && <Divider />}
                <View style={styles.row}>
                  <Text style={[styles.rowName, { color: colors.text, fontFamily: Fonts.sansMedium }]}>{t[PRAYER_KEYS[key]]}</Text>
                  <Text style={[styles.rowTime, { color: colors.text, fontFamily: Fonts.mono }]}>{formatLocalTime(shown.result[key], shown.offset)}</Text>
                </View>
              </View>
            ))}
          </Card>
        </View>
      )}

      {recent.length > 1 && (
        <View style={styles.recent}>
          <Text style={[styles.note, { color: colors.textSecondary, fontFamily: Fonts.sansMedium }]}>{t.recent}</Text>
          <View style={styles.chips}>
            {recent.map((p) => (
              <Pressable
                key={`${p.name}-${p.latitude}`}
                onPress={() => setSelected(p)}
                onLongPress={() => forget(p)}
                accessibilityHint={t.forget}
                style={({ pressed }) => pressed && styles.pressed}>
                <Text style={[styles.chip, { color: selected === p ? colors.accent : colors.textSecondary, fontFamily: Fonts.sansMedium }]}>{p.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 12, fontSize: 18, outlineStyle: 'none' } as never,
  note: { fontSize: 14, marginTop: 10 },
  results: { marginTop: 6 },
  pick: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingVertical: 13 },
  pickName: { fontSize: 18 },
  pickHint: { fontSize: 13 },
  pressed: { opacity: 0.7 },
  selected: { marginTop: 20, gap: 8 },
  city: { fontSize: 34, lineHeight: 42, letterSpacing: -0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingVertical: 12 },
  rowName: { fontSize: 17 },
  rowTime: { fontSize: 17 },
  recent: { marginTop: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 18, rowGap: 6, marginTop: 4 },
  chip: { fontSize: 16 },
});
