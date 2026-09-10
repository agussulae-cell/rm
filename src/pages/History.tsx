import React, { useEffect, useState } from "react";
import { fetchApi } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { cn } from "../lib/utils";
import { Search } from "lucide-react";

export default function History() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Edit states
  const [editId, setEditId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchApi("/transactions");
      setData(res.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (tx: any) => {
    setEditId(tx.id);
    setEditQty(tx.qty.toString());
  };

  const handleSave = async (id: string) => {
    try {
      await fetchApi(`/transactions/${id}`, {
        method: "PUT",
        body: JSON.stringify({ qty: Number(editQty), userId: user?.id })
      });
      setEditId(null);
      loadData();
    } catch (err) {
      alert("Gagal mengupdate");
    }
  };

  const shareToWA = (item: any) => {
    const text = `*Histori Part*\n\nNo Part: ${item.partNo}\nNama Part: ${item.partName}\nWaktu: ${new Date(item.timestamp).toLocaleString('id-ID')}\nUser: ${item.fullname || item.username}\nTipe: ${item.type}\nQty: ${item.qty}\nKeterangan: ${item.remark || "-"}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const filteredData = data.filter(item => 
    item.partNo.toLowerCase().includes(search.toLowerCase()) || 
    item.partName.toLowerCase().includes(search.toLowerCase()) ||
    item.type.toLowerCase().includes(search.toLowerCase()) ||
    (item.remark && item.remark.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50">
        <h2 className="text-lg font-bold text-gray-800 shrink-0">Riwayat Transaksi & Log</h2>
        <div className="flex w-full sm:w-auto items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari riwayat..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={loadData}
            className="px-3 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shrink-0"
          >
            Refresh
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[900px] align-middle">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-sm border-b border-gray-200">
              <th className="p-4 font-semibold w-12 text-center">No</th>
              <th className="p-4 font-semibold whitespace-nowrap">Waktu</th>
              <th className="p-4 font-semibold">User</th>
              <th className="p-4 font-semibold text-center">Tipe</th>
              <th className="p-4 font-semibold">Part No</th>
              <th className="p-4 font-semibold min-w-[150px]">Part Name</th>
              <th className="p-4 font-semibold text-center">Qty</th>
              <th className="p-4 font-semibold min-w-[150px]">Keterangan</th>
              <th className="p-4 font-semibold text-center whitespace-nowrap">Bagikan</th>
              {user?.role === "PPIC" && (
                <th className="p-4 font-semibold text-center whitespace-nowrap">Aksi (Revisi)</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="p-8 text-center text-gray-500">Memuat data...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan={9} className="p-8 text-center text-gray-500">Data tidak ditemukan.</td></tr>
            ) : (
              filteredData.map((item, index) => {
                const isEditing = editId === item.id;
                const isLog = item.type.includes("LOG");
                
                let badgeClass = "bg-gray-100 text-gray-700";
                if (item.type === "IN") badgeClass = "bg-green-100 text-green-700";
                if (item.type === "OUT") badgeClass = "bg-red-100 text-red-700";
                if (isLog) badgeClass = "bg-gray-800 text-white opacity-80";

                return (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 text-sm text-gray-500 text-center">{index + 1}</td>
                    <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 text-sm text-gray-600 font-medium">{item.fullname}</td>
                    <td className="p-4 text-center">
                      <span className={cn("px-2 py-1 text-xs font-bold rounded-full", badgeClass)}>
                        {item.type}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-gray-900 whitespace-nowrap">{item.partNo}</td>
                    <td className="p-4 text-sm text-gray-600">{item.partName}</td>
                    <td className="p-4 text-center font-bold">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editQty}
                          onChange={(e) => setEditQty(e.target.value)}
                          className="w-20 px-2 py-1 text-center border border-gray-300 rounded"
                        />
                      ) : isLog ? (
                        <span className="text-gray-400 text-xs">-</span>
                      ) : (
                        <span className={item.type === "IN" ? "text-green-600" : "text-red-600"}>
                          {item.qty}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-600 italic">
                      {item.remark || "-"}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => shareToWA(item)}
                        className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs font-medium whitespace-nowrap transition-colors"
                      >
                        Share WA
                      </button>
                    </td>
                    {user?.role === "PPIC" && (
                      <td className="p-4 text-center">
                        {isLog ? (
                          <span className="text-gray-300 text-xs">-</span>
                        ) : isEditing ? (
                          <div className="flex justify-center gap-2">
                            <button onClick={() => handleSave(item.id)} className="text-blue-600 font-medium hover:underline text-sm">Simpan</button>
                            <button onClick={() => setEditId(null)} className="text-gray-500 font-medium hover:underline text-sm">Batal</button>
                          </div>
                        ) : (
                          <button onClick={() => handleEdit(item)} className="text-blue-600 font-medium hover:underline text-sm">Revisi Qty</button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
