import { ref } from 'vue';
import { fetchContentList } from '../api';
import type { ContentItem } from '../types';

export function useContentList() {
  const loading = ref(false);
  const items = ref<ContentItem[]>([]);

  const load = async () => {
    loading.value = true;
    try {
      items.value = await fetchContentList();
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    items,
    load,
  };
}