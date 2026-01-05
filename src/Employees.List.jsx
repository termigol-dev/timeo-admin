import React, { useEffect, useState } from "react";
import {
  getEmployees,
  toggleEmployee,
  getBranches,
  assignBranch,
} from "./api";

export default function EmployeesList({ token, dark }) {
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [emps, brs] = await Promise.all([
        getEmployees(token),
        getBranches(token),
      ]);
      setEmployees(emps);
      setBranches(brs);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(id) {
    await toggleEmployee(token, id);
    load();
  }

  async function changeBranch(userId, branchId) {
    await assignBranch(token, userId, branchId || null);
    load();
  }

  return (
    <div
      className={`p-6 rounded-xl shadow ${
        dark ? "bg-slate-800 text-white" : "bg-white"
      }`}
    >
      <h2 className="text-xl font-bold mb-4">Empleados</h2>

      {error && <div className="text-red-500">{error}</div>}

      <div className="space-y-3">
        {employees.map((e) => (
          <div
            key={e.id}
            className={`flex items-center justify-between p-3 rounded-lg ${
              dark ? "bg-slate-700" : "bg-gray-100"
            }`}
          >
            <div>
              <div className="font-semibold">
                {e.name} {e.firstSurname}
              </div>
              <div className="text-sm opacity-70">{e.email}</div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={e.branchId || ""}
                onChange={(ev) => changeBranch(e.id, ev.target.value)}
                className="px-2 py-1 rounded"
              >
                <option value="">Sin sucursal</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => toggle(e.id)}
                className={`px-3 py-1 rounded font-semibold ${
                  e.active
                    ? "bg-red-500 text-white"
                    : "bg-emerald-500 text-white"
                }`}
              >
                {e.active ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
