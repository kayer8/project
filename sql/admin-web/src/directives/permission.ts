import type { Directive } from 'vue';
import { hasRole } from '@/utils/permission';

export const permissionDirective: Directive = {
  mounted(el, binding) {
    const roles = JSON.parse(localStorage.getItem('roles') || '[]') as string[];
    const required = Array.isArray(binding.value) ? binding.value : [binding.value];
    if (!hasRole(roles, required)) {
      el.parentNode?.removeChild(el);
    }
  },
};