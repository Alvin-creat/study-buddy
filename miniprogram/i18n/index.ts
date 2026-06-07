import { useI18n as useVueI18n } from 'vue-i18n';

export function useI18n() {
  return useVueI18n();
}

export function setLocale(locale: string) {
  const { locale: current } = useVueI18n();
  current.value = locale;
  uni.setStorageSync('locale', locale);
}
