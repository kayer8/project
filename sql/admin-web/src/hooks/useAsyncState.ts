import { ref } from 'vue';

export function useAsyncState<T>(initialValue: T) {
  const state = ref(initialValue);
  const loading = ref(false);

  const run = async (promise: Promise<T>) => {
    loading.value = true;
    try {
      state.value = await promise;
    } finally {
      loading.value = false;
    }
  };

  return {
    state,
    loading,
    run,
  };
}