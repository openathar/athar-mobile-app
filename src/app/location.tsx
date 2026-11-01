import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, Divider, ModalHeader, Screen, SectionLabel } from '@/components/screen';
import { Fonts } from '@/constants/theme';
import { useLocationContext } from '@/context/location';
import { usePhase } from '@/context/phase';
import { IS_RTL, t } from '@/lib/i18n';
import { bundledPlaces, searchPlaces, type Place } from '@/lib/places';

/**
 * Where the app prays. The lookup is our own (bundled cities first, then
 * `api.openathar.org`) — a third-party geocoder would see every city a user
 * searches for, which this app promises not to do.
 */
export default function LocationScreen() {
  const { colors } = usePhase();
  const { location, setCustom } = useLocationContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const id = setTimeout(async () => {
      const found = await searchPlaces(q);
      setResults(found.places);
      setSearching(false);
    }, 350);
    return () => clearTimeout(id);
  }, [query]);

  const pick = useCallback(
    (place: Place) => {
      setCustom({ lat: place.latitude, lng: place.longitude, label: place.name });
      setQuery('');
      router.back();
    },
    [setCustom]
  );

  const list = results ?? bundledPlaces();
  const active = location.label;

  return (
    <Screen>
      <ModalHeader
        title={IS_RTL ? undefined : t.locationTitle}
        titleAr={IS_RTL ? t.locationTitle : 'الموقع'}
        subtitle={`${t.currently} ${location.label}`}
      />

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t.searchCity}
        placeholderTextColor={colors.textSecondary}
        autoCorrect={false}
        style={[
          styles.input,
          { borderBottomColor: colors.rule, color: colors.text, fontFamily: Fonts.sans },
        ]}
      />

      <Pressable
        onPress={() => {
          setCustom(null);
          router.back();
        }}
        style={({ pressed }) => [styles.currentRow, pressed && styles.pressed]}>
        <Text style={[styles.current, { color: colors.accent, fontFamily: Fonts.sansMedium }]}>
          {t.useCurrent}
        </Text>
      </Pressable>

      <SectionLabel>{query.trim().length >= 2 ? t.results : t.cities}</SectionLabel>

      {results !== null && results.length === 0 && !searching && (
        <Text style={[styles.note, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
          {t.anywhereNoResult}
        </Text>
      )}

      <Card>
        {list.map((place, i) => {
          const isActive = place.name === active;
          return (
            <View key={`${place.name}-${place.country}-${place.latitude}`}>
              {i > 0 && <Divider />}
              <Pressable
                onPress={() => pick(place)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <Text
                  style={[
                    styles.name,
                    { color: isActive ? colors.accent : colors.text, fontFamily: isActive ? Fonts.sansMedium : Fonts.sans },
                  ]}>
                  {place.name}
                </Text>
                <Text style={[styles.country, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>
                  {place.country}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // A single hairline underneath, like a form line on paper — no box.
  input: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 0,
    paddingVertical: 14,
    fontSize: 22,
    // web: no browser focus ring
    outlineStyle: 'none',
  } as never,
  currentRow: {
    paddingVertical: 18,
  },
  current: {
    fontSize: 16,
  },
  note: {
    fontSize: 14,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 13,
  },
  name: {
    fontSize: 17,
  },
  country: {
    fontSize: 12,
  },
  pressed: {
    opacity: 0.6,
  },
});
