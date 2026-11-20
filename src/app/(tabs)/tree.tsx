import { DhikrTree } from '@/components/dhikr-tree';
import { FeelingsTree } from '@/components/feelings-tree';
import { ChapterHead, Screen, ScreenHeader, SectionLabel } from '@/components/screen';
import { IS_RTL, t } from '@/lib/i18n';

/**
 * The tree tab — the website's tree, in two parts. First your own: a tasbih
 * counter that grows a tree with every count (athar, the trace you leave).
 * Then the website's feelings tree: branches in the chest, roots in the belly.
 */
export default function TreeScreen() {
  return (
    <Screen>
      <ScreenHeader
        title={IS_RTL ? undefined : t.treeTitle}
        titleAr={IS_RTL ? t.treeTitle : 'شجرتك'}
        subtitle={t.treeLead}
        subtitleLines={3}
        celestial={false}
      />
      <SectionLabel n={1}>{t.tasbihTitle}</SectionLabel>
      <DhikrTree />

      <ChapterHead n={2} name={t.feelingsTitle} title={t.feelingsChapter} />
      <FeelingsTree />
    </Screen>
  );
}
