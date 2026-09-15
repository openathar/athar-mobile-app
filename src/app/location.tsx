import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useLocationContext } from '@/context/location';

type SearchResult = { lat: string; lon: string; display_name: string };

const NOMINATIM = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&q=';

export default function LocationScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.display }]}>
            Choose location
          </Text>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={[styles.close, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>✕</Text>
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
            { backgroundColor: colors.backgroundElement, color: colors.text, fontFamily: Fonts.sans },
          ]}
        />

        <Pressable onPress={useCurrent} style={({ pressed }) => pressed && { opacity: 0.6 }}>
          <Text style={[styles.current, { color: colors.accent, fontFamily: Fonts.sansMedium }]}>
            Use my current location
          </Text>
        </Pressable>

        {searching && <ActivityIndicator color={colors.accent} style={styles.spinner} />}

        <ScrollView style={styles.results} keyboardShouldPersistTaps="handled">
          {results.map((r) => (
            <Pressable
              key={r.display_name}
              onPress={() => pick(r)}
              style={({ pressed }) => pressed && { opacity: 0.6 }}>
              <View style={[styles.resultRow, { borderBottomColor: colors.rule }]}>
                <Text style={[styles.resultText, { color: colors.text, fontFamily: Fonts.sans }]}>
                  {r.display_name}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={[styles.currentLabel, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
          Currently: {location.label}
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
  },
  close: {
    fontSize: 20,
  },
  input: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  current: {
    marginTop: Spacing.three,
    fontSize: 15,
  },
  spinner: {
    marginTop: Spacing.three,
  },
  results: {
    marginTop: Spacing.three,
    flex: 1,
  },
  resultRow: {
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultText: {
    fontSize: 15,
  },
  currentLabel: {
    paddingVertical: Spacing.three,
    fontSize: 13,
    opacity: 0.85,
  },
});