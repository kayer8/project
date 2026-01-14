export function hasRole(roles: string[], required: string[]) {
  return required.some((role) => roles.includes(role));
}