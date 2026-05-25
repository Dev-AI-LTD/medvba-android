import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLanguage } from '@/providers/LanguageProvider';
import { resolveStudyContentLocale } from '@/lib/study-content-locale';
import { useTheme } from '@/providers/ThemeProvider';
import {
  classifyStudySectionHeading,
  type StudySummarySectionKind,
} from '@/lib/study-summary-sections';
import { radiusMd, space, typeScale } from '@/theme/iosDesign';

type Block =
  | { type: 'h2'; text: string; kind: StudySummarySectionKind }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] };

function parseMarkdown(md: string, locale: 'ro' | 'en'): Block[] {
  const blocks: Block[] = [];
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  let paragraph: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    const text = paragraph.join(' ').trim();
    if (text) blocks.push({ type: 'p', text });
    paragraph = [];
  };

  const flushList = () => {
    if (listItems.length) blocks.push({ type: 'ul', items: [...listItems] });
    listItems = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushList();
      flushParagraph();
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      flushParagraph();
      const text = line.slice(3).trim();
      blocks.push({
        type: 'h2',
        text,
        kind: classifyStudySectionHeading(text, locale),
      });
      continue;
    }
    if (line.startsWith('- ')) {
      flushParagraph();
      listItems.push(line.slice(2).trim());
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushList();
  flushParagraph();
  return blocks;
}

function groupIntoSections(blocks: Block[]) {
  const sections: { kind: StudySummarySectionKind; title: string; body: Block[] }[] = [];
  let current: { kind: StudySummarySectionKind; title: string; body: Block[] } | null = null;

  for (const block of blocks) {
    if (block.type === 'h2') {
      if (current) sections.push(current);
      current = { kind: block.kind, title: block.text, body: [] };
      continue;
    }
    if (!current) {
      current = { kind: 'other', title: '', body: [block] };
    } else {
      current.body.push(block);
    }
  }
  if (current) sections.push(current);
  return sections;
}

function renderInline(text: string, boldStyle: object, baseStyle: object) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={baseStyle}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={i} style={boldStyle}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
}

export function StudyMarkdown({ markdown }: { markdown: string }) {
  const { colors } = useTheme();
  const { currentLanguage } = useLanguage();
  const locale = resolveStudyContentLocale(currentLanguage);

  const sections = useMemo(() => {
    const blocks = parseMarkdown(markdown, locale);
    return groupIntoSections(blocks);
  }, [markdown, locale]);

  const boldStyle = { fontWeight: '700' as const, color: colors.text };
  const bodyStyle = { ...typeScale.body, color: colors.text, lineHeight: 24 };
  const h2Style = { ...typeScale.headline, color: colors.text, fontWeight: '700' as const };
  const bulletStyle = { ...typeScale.body, color: colors.text, flex: 1, lineHeight: 22 };

  return (
    <View style={styles.root}>
      {sections.map((section, sIdx) => {
        const isMini = section.kind === 'mini';
        const isLearn = section.kind === 'learn';

        return (
          <View
            key={`${section.kind}-${sIdx}`}
            style={[
              styles.section,
              sIdx > 0 && styles.sectionSpacing,
              isMini && { backgroundColor: colors.primary + '14', borderColor: colors.primary + '35' },
              !isMini && { borderColor: colors.cardBgLight },
            ]}
          >
            {section.title ? (
              <Text style={[h2Style, isLearn && styles.learnTitle]}>{section.title}</Text>
            ) : null}

            {section.body.map((block, idx) => {
              if (block.type === 'p') {
                return (
                  <View key={idx} style={styles.pWrap}>
                    {renderInline(block.text, boldStyle, bodyStyle)}
                  </View>
                );
              }
              return (
                <View key={idx} style={styles.ul}>
                  {block.items.map((item, j) => (
                    <View key={j} style={styles.li}>
                      <View style={[styles.bulletDot, { backgroundColor: colors.primary }]} />
                      <View style={styles.liText}>
                        {renderInline(item, boldStyle, bulletStyle)}
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: space.space3,
  },
  section: {
    borderRadius: radiusMd,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.space4,
    gap: space.space3,
  },
  sectionSpacing: {
    marginTop: 0,
  },
  learnTitle: {
    marginBottom: space.space1,
  },
  pWrap: {
    marginTop: 0,
  },
  ul: {
    gap: space.space3,
  },
  li: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.space3,
  },
  bulletDot: {
    width: space.space2 - 2,
    height: space.space2 - 2,
    borderRadius: (space.space2 - 2) / 2,
    marginTop: space.space2,
  },
  liText: {
    flex: 1,
    flexShrink: 1,
  },
});
