import { ref } from 'vue';

export function useTable<T>() {
  const loading = ref(false);
  const data = ref<T[]>([]);

  return {
    loading,
    data,
  };
}