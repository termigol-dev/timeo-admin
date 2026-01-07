const API_BASE = import.meta.env.VITE_API_BASE;

/* ───────── BASE API ───────── */
async function api(path, method = 'GET', body, auth = true) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = localStorage.getItem('token');
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

/* ───────── AUTH (ÚNICO) ───────── */
export async function adminLogin(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  // 🔥 SI FALLA, NO INTENTES res.json()
  if (!res.ok) {
    throw new Error('Login incorrecto');
  }

  const data = await res.json();

  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));

  return data;
}

/* ───────── LOGOUT ───────── */
export function clearToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

/* ───────── USERS ───────── */
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

export function updateUser(id, data) {
  return api(`/users/${id}`, 'PATCH', data);
}

export function deleteUser(id) {
  return api(`/users/${id}`, 'DELETE');
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

export function deleteCompany(id) {
  return api(`/companies/${id}`, 'DELETE');
}

/* ───────── BRANCHES ───────── */
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

export function deleteBranch(companyId, branchId) {
  return api(
    `/companies/${companyId}/branches/${branchId}`,
    'DELETE'
  );
}

export function updateUserBranch(companyId, userId, branchId) {
  return api(
    `/companies/${companyId}/employees/${userId}/branch`,
    'PATCH',
    { branchId }
  );
}

export function regenerateTabletToken(companyId, branchId) {
  return api(
    `/companies/${companyId}/branches/${branchId}/tablet-token`,
    'POST'
  );
}

/* ───────── EMPLOYEES ───────── */
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

/* ───────── TABLET (NO SE TOCA) ───────── */
export async function registerTablet(activationToken) {
  return api(
    '/tablet/register',
    'POST',
    { token: activationToken },
    false
  );
}

export async function getTabletStatus(tabletToken) {
  return fetch(`${API_BASE}/tablet/me`, {
    headers: {
      Authorization: `Bearer ${tabletToken}`,
    },
  }).then(r => r.json());
}

export async function tabletPunch({ tabletToken, employeeId, type }) {
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