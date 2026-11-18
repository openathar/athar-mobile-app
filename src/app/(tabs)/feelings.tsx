import { Screen, ScreenHeader } from '@/components/screen';
import { HeartLamp } from '@/components/heart-lamp';
import { IS_RTL, t } from '@/lib/i18n';

/**
 * The feelings tab: "The Lamp of the Heart" (مصباح القلب), after Ayat an-Nur
 * (24:35). A central lamp whose flame responds to the feeling you tap —
 * positive feelings feed it, their counterparts starve it. Around it, eight
 * feelings are arranged as points of light; tapping one shows its description
 * and a relevant verse.
 */
export default function FeelingsScreen() {
  return (
    <Screen>
      <ScreenHeader title={IS_RTL ? undefined : t.feelingsTitle} titleAr={IS_RTL ? t.feelingsTitle : 'المشاعر'} subtitle={t.feelingsLead} subtitleLines={2} />
      <HeartLamp />
    </Screen>
  );
}
