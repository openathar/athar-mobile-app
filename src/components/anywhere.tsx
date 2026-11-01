import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrayerTimes, formatLocalTime, type Method } from '@openathar/athan-core-ts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, Divider, SectionLabel } from '@/components/screen';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { useSettingsContext } from '@/context/settings';
import { LOCALE, PRAYER_KEYS, t } from '@/lib/i18n';
import { matchLocal, offsetHoursNow, searchPlaces, type Place } from '@/lib/places';

const STORAGE_KEY = 'athar.anywhere.v1';
const ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

/** Today's times at the place, in the app's calculation method, as wall-clock times there. */
function timesFor(place: Place, method: Method) {
  const offset = offsetHoursNow(place.timezone, place.utcOffsetHours);
  const local = new Date(Date.now() + offset * 3_600_000);
  const result = new PrayerTimes(method).getTimes(
    local.getUTCFullYear(),
    local.getUTCMonth() + 1,
    local.getUTCDate(),
    place.latitude,
    place.longitude
  );
  return { offset, result };
}

/**
 * "Anywhere": look up any city and see today's prayer times there, computed
 * on the device with the same engine as the API. Cities you looked at are
 * kept for offline use.
 */
export function Anywhere() {
  const { colors } = usePhase();
  const { calculator } = useSettingsContext();
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
    const local = matchLocal(q);
    setFound(local);
    setStatus(local.length ? 'idle' : 'loading');
    const { places, remoteFailed } = await searchPlaces(q);
    setFound(places);
    setStatus(places.length ? 'idle' : remoteFailed && !local.length ? 'offline' : 'empty');
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

  const shown = useMemo(() => (selected ? timesFor(selected, calculator) : null), [selected, calculator]);

  return (
    <View>
      <SectionLabel>{t.anywhere}</SectionLabel>
      <Text style={[styles.lead, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.anywhereLead}</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t.anywhereHint}
        placeholderTextColor={colors.textSecondary}
        autoCorrect={false}
        style={[styles.input, { borderBottomColor: colors.rule, color: colors.text, fontFamily: Fonts.sans, textAlign: LOCALE === 'ar' ? 'right' : 'left' }]}
      />

      {status === 'empty' && <Text style={[styles.note, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.anywhereNoResult}</Text>}
      {status === 'offline' && <Text style={[styles.note, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.anywhereOffline}</Text>}

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
  lead: { fontSize: 13, marginBottom: 2 },
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
