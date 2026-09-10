import React, { useEffect, useState } from "react";
import { fetchApi } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

export default function Master() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ partNo: "", partName: "", initialStock: 0, minStock: 0, maxStock: 0 });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchApi("/parts");
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
      const payload = { ...formData, userId: user?.id };
      if (editId) {
        await fetchApi(`/parts/${editId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      } else {
        await fetchApi("/parts", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }
      setIsFormOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan");
    }
  };

  const handleEdit = (part: any) => {
    setEditId(part.id);
    setFormData({ 
      partNo: part.partNo, 
      partName: part.partName, 
      initialStock: part.initialStock || 0,
      minStock: part.minStock || 0,
      maxStock: part.maxStock || 0
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus part ini?")) return;
    try {
      await fetchApi(`/parts/${id}`, { method: "DELETE" });
      loadData();
    } catch (err) {
      alert("Gagal menghapus");
    }
  };

  const openNewForm = () => {
    setEditId(null);
    setFormData({ partNo: "", partName: "", initialStock: 0, minStock: 0, maxStock: 0 });
    setIsFormOpen(true);
  };

  const handleDownloadTemplate = () => {
    const csvContent = "Part No,Part Name,Stock Awal,Min,Max\nPART-001,Baut 10mm,100,10,200";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "Template_Part_Master.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return alert("Pilih file CSV terlebih dahulu");

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        
        // Skip header line if it looks like header
        const startIndex = lines[0].toLowerCase().includes('part no') ? 1 : 0;
        const parts = [];

        for (let i = startIndex; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim());
          if (cols.length >= 2 && cols[0]) {
            parts.push({
              partNo: cols[0],
              partName: cols[1],
              initialStock: Number(cols[2]) || 0,
              minStock: Number(cols[3]) || 0,
              maxStock: Number(cols[4]) || 0
            });
          }
        }

        if (parts.length === 0) {
          throw new Error("Tidak ada data valid yang bisa diupload. Pastikan format sesuai template.");
        }

        const res = await fetchApi("/parts/bulk", {
          method: "POST",
          body: JSON.stringify({ parts, userId: user?.id })
        });
        
        alert(res.message || "Upload berhasil");
        setIsUploadOpen(false);
        setCsvFile(null);
        loadData();
      } catch (err: any) {
        alert(err.message || "Gagal memproses file CSV");
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      setUploading(false);
      alert("Gagal membaca file");
    };
    reader.readAsText(csvFile);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Master Part</h2>
          <div className="flex gap-2 flex-wrap">
            <button 
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 text-sm font-medium bg-gray-100 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Unduh Template
            </button>
            <button 
              onClick={() => setIsUploadOpen(true)}
              className="px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Upload CSV
            </button>
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
              Tambah Part
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-semibold">Part No</th>
                <th className="p-4 font-semibold">Part Name</th>
                <th className="p-4 font-semibold text-center">Stock Awal</th>
                <th className="p-4 font-semibold text-center text-red-600">Min</th>
                <th className="p-4 font-semibold text-center text-amber-600">Max</th>
                <th className="p-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Memuat data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Belum ada data.</td></tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-bold text-gray-900">{item.partNo}</td>
                    <td className="p-4 text-gray-600">{item.partName}</td>
                    <td className="p-4 text-center font-bold text-gray-700">{item.initialStock}</td>
                    <td className="p-4 text-center font-medium text-red-600">{item.minStock || 0}</td>
                    <td className="p-4 text-center font-medium text-amber-600">{item.maxStock || 0}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleEdit(item)} className="text-blue-600 font-medium hover:underline text-sm mr-4">Edit</button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 font-medium hover:underline text-sm">Hapus</button>
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">{editId ? "Edit Part" : "Tambah Part"}</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-800">Tutup</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Part No</label>
                  <input 
                    type="text" required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.partNo}
                    onChange={e => setFormData({...formData, partNo: e.target.value})}
                    disabled={!!editId}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Part Name</label>
                  <input 
                    type="text" required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.partName}
                    onChange={e => setFormData({...formData, partName: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Awal</label>
                  <input 
                    type="number" required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.initialStock}
                    onChange={e => setFormData({...formData, initialStock: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-red-600">Min Stock</label>
                  <input 
                    type="number" required
                    className="w-full px-3 py-2 border border-red-300 rounded-md outline-none focus:ring-2 focus:ring-red-500"
                    value={formData.minStock}
                    onChange={e => setFormData({...formData, minStock: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-amber-600">Max Stock</label>
                  <input 
                    type="number" required
                    className="w-full px-3 py-2 border border-amber-300 rounded-md outline-none focus:ring-2 focus:ring-amber-500"
                    value={formData.maxStock}
                    onChange={e => setFormData({...formData, maxStock: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700">
                  Simpan Part
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isUploadOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Upload Data Part via CSV</h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-gray-500 hover:text-gray-800">Tutup</button>
            </div>
            <form onSubmit={handleUploadCsv} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih File CSV</label>
                <input 
                  type="file" 
                  accept=".csv"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  onChange={e => setCsvFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-gray-500 mt-2">Format: Part No, Part Name, Stock Awal, Min, Max</p>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsUploadOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium" disabled={uploading}>Batal</button>
                <button type="submit" className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium" disabled={uploading}>
                  {uploading ? 'Memproses...' : 'Upload Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
