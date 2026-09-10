import React, { useEffect, useState } from "react";
import { fetchApi } from "../lib/api";

export default function Users() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ username: "", fullname: "", role: "IN", password: "" });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchApi("/users");
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await fetchApi(`/users/${editId}`, {
          method: "PUT",
          body: JSON.stringify(formData)
        });
      } else {
        await fetchApi("/users", {
          method: "POST",
          body: JSON.stringify(formData)
        });
      }
      setIsFormOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan");
    }
  };

  const handleEdit = (user: any) => {
    setEditId(user.id);
    setFormData({ username: user.username, fullname: user.fullname, role: user.role, password: "" });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus user ini?")) return;
    try {
      await fetchApi(`/users/${id}`, { method: "DELETE" });
      loadData();
    } catch (err) {
      alert("Gagal menghapus");
    }
  };

  const openNewForm = () => {
    setEditId(null);
    setFormData({ username: "", fullname: "", role: "IN", password: "" });
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Manajemen User</h2>
          <div className="flex gap-2">
            <button 
              onClick={loadData}
              className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Refresh
            </button>
            <button 
              onClick={openNewForm}
              className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Tambah User
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-semibold">Username</th>
                <th className="p-4 font-semibold">Nama Lengkap</th>
                <th className="p-4 font-semibold text-center">Role</th>
                <th className="p-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">Memuat data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">Belum ada data.</td></tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-bold text-gray-900">{item.username}</td>
                    <td className="p-4 text-gray-600">{item.fullname}</td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700">
                        {item.role}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleEdit(item)} className="text-blue-600 font-medium hover:underline text-sm mr-4">Edit</button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 font-medium hover:underline text-sm disabled:opacity-50" disabled={item.username === "admin"}>Hapus</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">{editId ? "Edit User" : "Tambah User"}</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-800">Tutup</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input 
                  type="text" required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  disabled={!!editId}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input 
                  type="text" required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.fullname}
                  onChange={e => setFormData({...formData, fullname: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="IN">User IN</option>
                  <option value="OUT">User OUT</option>
                  <option value="PPIC">PPIC (Admin)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password {editId && "(Kosongkan jika tidak diubah)"}</label>
                <input 
                  type="password" 
                  required={!editId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
