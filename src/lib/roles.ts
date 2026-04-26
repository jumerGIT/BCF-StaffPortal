export const PRIVILEGED_ROLES = ['site_head', 'manager', 'admin'] as const
export const MANAGER_ROLES = ['manager', 'admin'] as const

export const isPrivileged = (role: string) =>
  (PRIVILEGED_ROLES as readonly string[]).includes(role)

export const isManager = (role: string) =>
  (MANAGER_ROLES as readonly string[]).includes(role)
