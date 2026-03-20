import { onBeforeUnmount, ref, watch } from 'vue';

export function useQuickKeywordSearch(onSearch: (keyword: string) => void, delay = 300) {
  const quickKeyword = ref('');
  let keywordSearchTimer: ReturnType<typeof setTimeout> | null = null;
  let skipQuickKeywordWatch = false;

  function clearQuickKeywordTimer() {
    if (!keywordSearchTimer) {
      return;
    }

    clearTimeout(keywordSearchTimer);
    keywordSearchTimer = null;
  }

  function setQuickKeyword(value: string) {
    skipQuickKeywordWatch = true;
    quickKeyword.value = value;
  }

  function commitQuickKeyword() {
    clearQuickKeywordTimer();
    onSearch(quickKeyword.value.trim());
  }

  watch(
    () => quickKeyword.value,
    () => {
      if (skipQuickKeywordWatch) {
        skipQuickKeywordWatch = false;
        return;
      }

      clearQuickKeywordTimer();
      keywordSearchTimer = setTimeout(() => {
        onSearch(quickKeyword.value.trim());
      }, delay);
    },
  );

  onBeforeUnmount(() => {
    clearQuickKeywordTimer();
  });

  return {
    quickKeyword,
    setQuickKeyword,
    commitQuickKeyword,
    clearQuickKeywordTimer,
  };
}
