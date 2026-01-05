const API_BASE = import.meta.env.VITE_API_BASE;

/* ───────── BASE API ───────── */
async function api(path, method = 'GET', body, auth = true) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = localStorage.getItem('admin_token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let msg = 'Error API';
    try {
      const data = await res.json();
      msg = data.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}

/* ───────── AUTH ───────── */
export async function adminLogin(email, password) {
  return api('/auth/login', 'POST', { email, password }, false);
}

export function setToken(token) {
  localStorage.setItem('admin_token', token);
}

export function clearToken() {
  localStorage.removeItem('admin_token');
}

export function getToken() {
  return localStorage.getItem('admin_token');
}

/* ───────── USERS (GENÉRICO / ADMIN GLOBAL) ───────── */
/* ⚠️ NO usar para Employees por empresa */
export function getUsers() {
  return api('/users');
}

export function createUser(data) {
  return api('/users', 'POST', data);
}

export function toggleUser(id) {
  return api(`/users/${id}/active`, 'PATCH');
}

export function resetUserPassword(id) {
  return api(`/users/${id}/reset-password`, 'PATCH');
}

export function updateUserRole(userId, role) {
  return api(`/users/${userId}/role`, 'PATCH', { role });
}

export function updateEmployeeBranch(companyId, userId, branchId) {
  return api(
    `/companies/${companyId}/employees/${userId}/branch`,
    'PATCH',
    { branchId },
  );
}

export function updateUser(id, data) {
  return api(`/users/${id}`, 'PATCH', data);
}

export function checkDeleteUser(id) {
  return api(`/users/${id}/delete-check`);
}

export function deleteUser(id) {
  return api(`/users/${id}`, 'DELETE');
}

/* ───────── BRANCHES (POR EMPRESA) ───────── */
export function getBranches(companyId) {
  return api(`/companies/${companyId}/branches`);
}

export function createBranch(companyId, data) {
  return api(`/companies/${companyId}/branches`, 'POST', data);
}

export function toggleBranch(companyId, branchId) {
  return api(
    `/companies/${companyId}/branches/${branchId}/active`,
    'PATCH'
  );
}

export function deleteBranch(companyId, branchId, body) {
  return api(
    `/companies/${companyId}/branches/${branchId}`,
    'DELETE',
    body
  );
}
// 🔁 Regenerar token de tablet para una sucursal
export function regenerateTabletToken(companyId, branchId) {
  return api(
    `/companies/${companyId}/branches/${branchId}/tablet-token`,
    'POST'
  );
}
/* ───────── EMPLOYEES (POR EMPRESA) ───────── */

export function getEmployees(companyId) {
  return api(`/companies/${companyId}/employees`);
}

export function createEmployee(companyId, data) {
  return api(`/companies/${companyId}/employees`, 'POST', data);
}

export function toggleEmployee(companyId, employeeId) {
  return api(
    `/companies/${companyId}/employees/${employeeId}/active`,
    'PATCH'
  );
}

/* ───────── EMPLOYEES (POR EMPRESA) ───────── */

export function updateUserBranch(companyId, userId, branchId) {
  return api(
    `/companies/${companyId}/employees/${userId}/branch`,
    'PATCH',
    { branchId },
  );
}

export function deleteEmployee(companyId, employeeId) {
  return api(
    `/companies/${companyId}/employees/${employeeId}`,
    'DELETE'
  );
}

/* ───────── PROFILE ───────── */
export function getMyProfile() {
  return api('/users/me');
}

export function updateMyPassword(password) {
  return api('/users/me/password', 'PATCH', { password });
}

export function updateMyPhoto(photoUrl) {
  return api('/users/me/photo', 'PATCH', { photoUrl });
}

/* ───────── REPORTS ───────── */
export function getMyReports(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return api(`/reports/me?${params}`);
}

/* ───────── COMPANIES ───────── */
export function getCompanies() {
  return api('/companies');
}

export function getCompany(id) {
  return api(`/companies/${id}`);
}

export function createCompany(data) {
  return api('/companies', 'POST', data);
}

export function updateCompany(id, data) {
  return api(`/companies/${id}`, 'PATCH', data);
}

/* 🧪 BORRADO DEFINITIVO EMPRESA (TEST) */
export function deleteCompany(id) {
  return api(`/companies/${id}`, 'DELETE');
}
/* ───────── TABLET (SIN ADMIN TOKEN) ───────── */

// 🔐 Registrar tablet con token de activación
export async function registerTablet(activationToken) {
  return api(
    '/tablet/register',
    'POST',
    { token: activationToken },
    false // ❗ NO admin auth
  );
}

// 📱 Obtener estado de la tablet
export async function getTabletStatus(tabletToken) {
  return fetch(`${API_BASE}/tablet/me`, {
    headers: {
      Authorization: `Bearer ${tabletToken}`,
    },
  }).then(r => r.json());
}

// 🕒 FICHAR (IN / OUT)
export async function tabletPunch({
  tabletToken,
  employeeId,
  type, // 'IN' | 'OUT'
}) {
  return fetch(`${API_BASE}/tablet/punch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tabletToken}`,
    },
    body: JSON.stringify({ employeeId, type }),
  }).then(async res => {
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Error fichando');
    }
    return res.json();
  });
  
}