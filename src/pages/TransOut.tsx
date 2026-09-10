import React, { useEffect, useState, useRef } from "react";
import { fetchApi } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { Truck, Save, AlertCircle } from "lucide-react";

export default function TransOut() {
  const { user } = useAuth();
  const [parts, setParts] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [partId, setPartId] = useState("");
  const [search, setSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [qty, setQty] = useState("");
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchApi("/parts").then(setParts).catch(console.error);
    fetchApi("/dashboard").then(res => setDashboardData(res.items)).catch(console.error);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedPart = parts.find(p => p.id === partId);
  const selectedDashInfo = dashboardData.find(d => d.id === partId);

  const filteredParts = parts.filter(p => 
    p.partNo.toLowerCase().includes(search.toLowerCase()) || 
    p.partName.toLowerCase().includes(search.toLowerCase())
  );

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partId || !qty || Number(qty) <= 0 || !remark) {
      setMsg({ type: "error", text: "Pilih part, masukkan qty > 0, dan isi keterangan" });
      return;
    }
    
    if (selectedDashInfo && Number(qty) > selectedDashInfo.currentStock) {
      setMsg({ type: "error", text: `Gagal: Stock tidak cukup! Stock saat ini = ${selectedDashInfo.currentStock}` });
      return;
    }
    
    setShowConfirm(true);
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      await fetchApi("/transactions", {
        method: "POST",
        body: JSON.stringify({ type: "OUT", partId, qty: Number(qty), userId: user?.id, remark })
      });
      setMsg({ type: "success", text: "Berhasil menyimpan transaksi OUT" });
      setPartId("");
      setSearch("");
      setQty("");
      setRemark("");
      // Refresh current stock cache
      fetchApi("/dashboard").then(res => setDashboardData(res.items)).catch(console.error);
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Gagal menyimpan" });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-red-50 flex items-center gap-3">
          <div className="p-2 bg-red-100 text-red-700 rounded-lg">
            <Truck size={24} />
          </div>
          <h2 className="text-xl font-bold text-red-900">Transaksi Barang Keluar (OUT)</h2>
        </div>
        
        <form onSubmit={handleInitialSubmit} className="p-6 space-y-6">
          {msg.text && (
            <div className={`p-4 rounded-lg text-sm font-medium ${msg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
              {msg.text}
            </div>
          )}

          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Part</label>
            <input 
              type="text"
              placeholder="Cari part no / nama..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              value={search}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => {
                setSearch(e.target.value);
                setPartId("");
                setIsDropdownOpen(true);
                setMsg({ type: "", text: "" });
              }}
              required={!partId}
            />
            {isDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {filteredParts.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">Tidak ada part ditemukan.</div>
                ) : (
                  filteredParts.map(p => (
                    <div 
                      key={p.id} 
                      className="px-4 py-3 hover:bg-red-50 cursor-pointer border-b border-gray-100 last:border-0"
                      onClick={() => {
                        setPartId(p.id);
                        setSearch(`${p.partNo} - ${p.partName}`);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <div className="font-bold text-gray-800">{p.partNo}</div>
                      <div className="text-sm text-gray-500">{p.partName}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {selectedPart && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
              <div>
                <p className="text-xs text-gray-500 font-medium">Nama Part</p>
                <p className="font-semibold text-gray-900">{selectedPart.partName}</p>
              </div>
              {selectedDashInfo && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-sm font-medium text-blue-700">Stock Terkini: <span className="font-bold text-lg">{selectedDashInfo.currentStock}</span></p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Qty Keluar</label>
            <input 
              type="number" 
              min="1"
              required
              className="w-full px-4 py-3 text-xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
            <input 
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Cth: Dipakai untuk line 2..."
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <Save size={20} />
            {loading ? "Menyimpan..." : "Simpan Transaksi OUT"}
          </button>
        </form>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Yakin ga qty segini?</h3>
            <p className="text-gray-600 mb-6">
              Anda akan mengeluarkan item <strong>{selectedPart?.partNo}</strong> dengan Qty Keluar sebanyak <strong>{qty}</strong>.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition-colors"
              >
                Ragu
              </button>
              <button 
                onClick={handleConfirmedSubmit}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
              >
                Yakin Dong
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
