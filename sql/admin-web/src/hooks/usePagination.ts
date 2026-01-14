import { ref } from 'vue';

export function usePagination() {
  const page = ref(1);
  const pageSize = ref(20);
  const total = ref(0);

  const reset = () => {
    page.value = 1;
    total.value = 0;
  };

  return {
    page,
    pageSize,
    total,
    reset,
  };
}