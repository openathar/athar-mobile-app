import { Screen, ScreenHeader } from '@/components/screen';
import { HeartAtlas } from '@/components/heart-atlas';
import { IS_RTL, t } from '@/lib/i18n';

/**
 * The feelings tab: "The Heart's Atlas" (أطلس القلب), after Ayat an-Nur
 * (24:35). A lamp whose flame responds to the feeling you tap, above a
 * searchable atlas of all 199 feelings from Amin Sabry's research map.
 */
export default function FeelingsScreen() {
  return (
    <Screen>
      <ScreenHeader title={IS_RTL ? undefined : t.feelingsTitle} titleAr={IS_RTL ? t.feelingsTitle : 'المشاعر'} subtitle={t.feelingsLead} subtitleLines={2} />
      <HeartAtlas />
    </Screen>
  );
}
