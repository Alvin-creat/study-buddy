import en from './en';
import zhCN from './zh-CN';
import ja from './ja';

// Korean, Spanish, French, Arabic — extend as needed
// For now they fall back to English for untranslated keys
const ko = { ...en };
const es = { ...en };
const fr = { ...en };
const ar = { ...en };

export const messages: Record<string, any> = {
  'zh-CN': zhCN,
  'en': en,
  'ja': ja,
  'ko': ko,
  'es': es,
  'fr': fr,
  'ar': ar,
};
