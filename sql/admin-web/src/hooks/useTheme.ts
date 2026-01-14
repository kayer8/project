import { ref } from 'vue';

export function useTheme() {
  const dark = ref(false);
  const toggle = () => {
    dark.value = !dark.value;
  };

  return {
    dark,
    toggle,
  };
}