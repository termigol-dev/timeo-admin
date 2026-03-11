const API_BASE = import.meta.env.VITE_API_URL;


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
    } catch { }
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

export async function updateUser(userId, data) {

  console.log('📡 PATCH /users/' + userId);

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/users/${userId}`,
    {
      method: 'PATCH',   // ⬅️ ESTE ES EL CAMBIO
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    }
  );

  console.log('📡 status updateUser', res.status);

  if (!res.ok) {
    const t = await res.text();
    console.log('❌ body error', t);
    throw new Error('Error actualizando usuario');
  }

  return res.json();
}



export function deleteUser(id) {
  return api(`/users/${id}`, 'DELETE');
}

export async function getAllEmployees({ page, pageSize, search } = {}) {

  const params = new URLSearchParams();

  if (page) params.append('page', page);
  if (pageSize) params.append('pageSize', pageSize);
  if (search) params.append('search', search);

  const res = await fetch(
    `${API_BASE}/users?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }
  );

  if (!res.ok) throw new Error('Error cargando empleados');

  return res.json();
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
export async function getUserById(userId) {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/users/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Error cargando usuario');
  }

  return res.json();
}

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

export function hardDeleteEmployee(companyId, employeeId) {
  return api(
    `/companies/${companyId}/employees/${employeeId}/hard`,
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

export async function getMyReports({ userId, from, to }) {
  const params = new URLSearchParams();

  if (from) params.append('from', from);
  if (to) params.append('to', to);

  const res = await fetch(
    `${API_BASE}/reports/users/${userId}/daily?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Error cargando informe diario');
  }

  return res.json();
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

/* ───────── SCHEDULES ───────── */

// 1️⃣ Crear horario borrador
export function createDraftSchedule(companyId, branchId, userId) {
  return api(
    `/companies/${companyId}/branches/${branchId}/schedules/draft/${userId}`,
    'POST'
  );
}

// 2️⃣ Añadir turno
export function addShiftToSchedule(
  companyId,
  branchId,
  scheduleId,
  data
) {
  return api(
    `/companies/${companyId}/branches/${branchId}/schedules/${scheduleId}/shifts`,
    'POST',
    data
  );
}

// 3️⃣ Confirmar horario
export function confirmSchedule(
  companyId,
  branchId,
  scheduleId
) {
  return api(
    `/companies/${companyId}/branches/${branchId}/schedules/${scheduleId}/confirm`,
    'POST'
  );
}

// 4️⃣ Ver horario activo
export function getActiveSchedule(
  companyId,
  branchId,
  userId
) {
  return api(
    `/companies/${companyId}/branches/${branchId}/schedules/user/${userId}/active`
  );
}

