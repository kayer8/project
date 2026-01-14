import type { Directive } from 'vue';

export const copyDirective: Directive = {
  mounted(el, binding) {
    el.addEventListener('click', async () => {
      const value = String(binding.value ?? '');
      if (!value) {
        return;
      }
      await navigator.clipboard.writeText(value);
    });
  },
};