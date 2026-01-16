import { ref } from 'vue';

export function useTableSelection<T extends string | number = string | number>() {
  const selectedKeys = ref<T[]>([]);

  const handleSelectChange = (keys: T[]) => {
    selectedKeys.value = keys;
  };

  const clearSelection = () => {
    selectedKeys.value = [];
  };

  return {
    selectedKeys,
    handleSelectChange,
    clearSelection,
  };
}
