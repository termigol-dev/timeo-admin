export function can(role, action) {
  const rules = {
    SUPERADMIN: [
      'dashboard',
      'companies',
      'employees',
      'branches',
      'reports',
      'profile',
    ],

    ADMIN_EMPRESA: [
      'dashboard',
      'companies',
      'employees',
      'branches',
      'reports',
      'profile',
    ],

    ADMIN_SUCURSAL: [
      'dashboard',
      'employees',
      'reports',
      'profile',
    ],

    EMPLEADO: [
      'reports',
      'profile',
    ],
  };

  return rules[role]?.includes(action);
}