import { computed } from 'vue';
import { useUserStore } from '@/store/modules/user';

export function usePermissions() {
  const userStore = useUserStore();

  const isSuperAdmin = computed(() => userStore.profile.roles.includes('super_admin'));

  return {
    isSuperAdmin,
  };
}
