import { Screen, ScreenHeader } from '@/components/screen';
import { HeartBreath } from '@/components/heart-breath';
import { IS_RTL, t } from '@/lib/i18n';

/**
 * The feelings tab: "The Breath of the Heart" (نَفَس القلب), after Ayat an-Nur
 * (24:35). One feeling at a time — the lamp's flame shifts colour and the
 * Arabic name appears large, like the 99 Names. Swipe or use the arrows.
 */
export default function FeelingsScreen() {
  return (
    <Screen>
      <ScreenHeader title={IS_RTL ? undefined : t.feelingsTitle} titleAr={IS_RTL ? t.feelingsTitle : 'المشاعر'} subtitle={t.feelingsLead} subtitleLines={2} />
      <HeartBreath />
    </Screen>
  );
}
