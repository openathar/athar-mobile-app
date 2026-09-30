import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, Divider, Screen, SectionLabel } from '@/components/screen';
import { Fonts } from '@/constants/theme';
import { useLocationContext } from '@/context/location';
import { usePhase } from '@/context/phase';
import { withAlpha } from '@/lib/color';

type SearchResult = { lat: string; lon: string; display_name: string };

const NOMINATIM = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&q=';

export default function LocationScreen() {
  const { colors } = usePhase();
  const { location, setCustom } = useLocationContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(NOMINATIM + encodeURIComponent(q), {
        headers: { 'User-Agent': 'athar-mobile-app (openathar.org)' },
      });
      const data = (await res.json()) as SearchResult[] | { error: string };
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => search(query), 400);
    return () => clearTimeout(id);
  }, [query, search]);

  const pick = (r: SearchResult) => {
    setCustom({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), label: r.display_name.split(',')[0] });
    router.back();
  };

  const useCurrent = () => {
    setCustom(null);
    router.back();
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.display }]}>Location</Text>
            <Text style={[styles.titleAr, { color: colors.accent, fontFamily: Fonts.arabic }]}>الموقع</Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
            Currently {location.label}
          </Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={({ pressed }) => [styles.close, { borderColor: colors.rule }, pressed && styles.pressed]}>
          <Text style={[styles.closeText, { color: colors.textSecondary }]}>✕</Text>
        </Pressable>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search for a city…"
        placeholderTextColor={colors.textSecondary}
        autoFocus
        autoCorrect={false}
        style={[
          styles.input,
          {
            backgroundColor: withAlpha(colors.surface, 0.86),
            borderColor: colors.rule,
            color: colors.text,
            fontFamily: Fonts.sans,
          },
        ]}
      />

      <Pressable onPress={useCurrent} style={({ pressed }) => pressed && styles.pressed}>
        <Text style={[styles.current, { color: colors.accent, fontFamily: Fonts.mono }]}>◎ use my current location</Text>
      </Pressable>

      {searching && <ActivityIndicator color={colors.accent} style={styles.spinner} />}

      {results.length > 0 && (
        <>
          <SectionLabel>results</SectionLabel>
          <Card>
            {results.map((r, i) => (
              <View key={r.display_name}>
                {i > 0 && <Divider />}
                <Pressable onPress={() => pick(r)} style={({ pressed }) => pressed && styles.pressed}>
                  <View style={styles.resultRow}>
                    <Text style={[styles.resultName, { color: colors.text, fontFamily: Fonts.sansMedium }]}>
                      {r.display_name.split(',')[0]}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[styles.resultHint, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
                      {r.display_name.split(',').slice(1).join(',').trim()}
                    </Text>
                  </View>
                </Pressable>
              </View>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
  },
  titleAr: {
    fontSize: 24,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 13,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 15,
  },
  input: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  current: {
    fontSize: 13,
    letterSpacing: 0.5,
    marginTop: 16,
  },
  spinner: {
    marginTop: 20,
  },
  resultRow: {
    paddingVertical: 13,
    gap: 2,
  },
  resultName: {
    fontSize: 16,
  },
  resultHint: {
    fontSize: 12,
  },
  pressed: {
    opacity: 0.6,
  },
});
