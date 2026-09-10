import React, { useEffect, useState } from "react";
import { fetchApi } from "../lib/api";
import { cn } from "../lib/utils";
import { X, Search } from "lucide-react";
import { useAuth } from "../lib/AuthContext";

type DashboardData = {
  items: any[];
  shiftData: { s1_in: number; s1_out: number; s2_in: number; s2_out: number };
  overStockCount: number;
  criticalStockCount: number;
  todayTransactions: any[];
};

const greetings = [
  "Semangat kerjanya ya! Jangan lupa ngopi ☕",
  "Gas terus! Rezeki gak akan kemana 🚀",
  "Kerja santai tapi kelar semua, mantap! 🎯",
  "Jangan lupa senyum hari ini 😊",
  "Lelah boleh, menyerah jangan! Yuk bisa yuk 💪",
  "Fokus! Hari ini pasti lebih baik dari kemarin ✨"
];

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [greetingText, setGreetingText] = useState("");
  
  // Modals state
  const [showTransModal, setShowTransModal] = useState(false);
  const [showOverModal, setShowOverModal] = useState(false);
  const [showCritModal, setShowCritModal] = useState(false);
  
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [partHistory, setPartHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const openHistoryModal = async (part: any) => {
    setSelectedPart(part);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const res = await fetchApi(`/transactions/part/${part.id}`);
      setPartHistory(res);
    } catch (err) {
      console.error("Gagal load history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const shareToWA = (hist: any) => {
    const text = `*Histori Part*\n\nNo Part: ${hist.partNo}\nNama Part: ${hist.partName}\nWaktu: ${new Date(hist.timestamp).toLocaleString()}\nUser: ${hist.username}\nTipe: ${hist.type}\nQty: ${hist.qty}\nKeterangan: ${hist.remark || "-"}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchApi("/dashboard");
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setGreetingText(greetings[Math.floor(Math.random() * greetings.length)]);
  }, []);

  const totalIn = data ? data.shiftData.s1_in + data.shiftData.s2_in : 0;
  const totalOut = data ? data.shiftData.s1_out + data.shiftData.s2_out : 0;

  const filteredItems = data?.items.filter(item => 
    item.partNo.toLowerCase().includes(search.toLowerCase()) || 
    item.partName.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const Modal = ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="p-0 sm:p-4 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Greeting Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 shadow-sm text-white">
        <h2 className="text-2xl font-bold mb-1">Halo, {user?.fullname || user?.username}!</h2>
        <p className="text-blue-100">{greetingText}</p>
      </div>

      {/* Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={() => setShowTransModal(true)}
          className="text-left bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200 p-6 rounded-xl shadow-sm flex flex-col justify-center cursor-pointer"
        >
          <h3 className="font-semibold text-blue-900 mb-2">Transaksi Hari Ini</h3>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm text-blue-700">Total IN</p>
              <p className="text-2xl font-bold text-blue-900">{totalIn}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-700">Total OUT</p>
              <p className="text-2xl font-bold text-blue-900">{totalOut}</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => setShowOverModal(true)}
          className="text-left bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-200 p-6 rounded-xl shadow-sm flex flex-col justify-center cursor-pointer"
        >
          <h3 className="font-semibold text-amber-900 mb-1">Over Stock</h3>
          <p className="text-4xl font-bold text-amber-900">{data?.overStockCount || 0}</p>
        </button>

        <button 
          onClick={() => setShowCritModal(true)}
          className="text-left bg-red-50 hover:bg-red-100 transition-colors border border-red-200 p-6 rounded-xl shadow-sm flex flex-col justify-center cursor-pointer"
        >
          <h3 className="font-semibold text-red-900 mb-1">Stock Kritis</h3>
          <p className="text-4xl font-bold text-red-900">{data?.criticalStockCount || 0}</p>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800 shrink-0">Status Stok Saat Ini</h2>
          <div className="flex w-full sm:w-auto items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari part..." 
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
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-semibold w-12 text-center">No</th>
                <th className="p-4 font-semibold whitespace-nowrap">Part No</th>
                <th className="p-4 font-semibold min-w-[150px]">Part Name</th>
                <th className="p-4 font-semibold text-center text-green-600">Total IN</th>
                <th className="p-4 font-semibold text-center text-red-600">Total OUT</th>
                <th className="p-4 font-semibold text-center bg-blue-50 text-blue-800">Current Stock</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">Memuat data...</td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">Part tidak ditemukan.</td>
                </tr>
              ) : (
                filteredItems.map((item, index) => {
                  const isOver = item.maxStock > 0 && item.currentStock > item.maxStock;
                  const isCrit = item.minStock > 0 && item.currentStock <= item.minStock;
                  
                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => openHistoryModal(item)}
                      className={cn(
                        "border-b border-gray-100 hover:bg-gray-100 cursor-pointer transition-colors",
                        isOver && "bg-amber-50/50 hover:bg-amber-100",
                        isCrit && "bg-red-50/50 hover:bg-red-100"
                      )}
                    >
                      <td className="p-4 text-center text-sm text-gray-500">{index + 1}</td>
                      <td className="p-4 font-bold text-gray-900 whitespace-nowrap">{item.partNo}</td>
                      <td className="p-4 text-gray-600 text-sm">{item.partName}</td>
                      <td className="p-4 text-center text-green-600 font-medium">+{item.totalIn}</td>
                      <td className="p-4 text-center text-red-600 font-medium">-{item.totalOut}</td>
                      <td className={cn(
                        "p-4 text-center font-bold text-lg bg-blue-50/30",
                        isOver && "text-amber-700 bg-amber-100/50",
                        isCrit && "text-red-600 bg-red-100/50",
                        (!isOver && !isCrit) && "text-blue-700"
                      )}>
                        {item.currentStock}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      <Modal isOpen={showTransModal} onClose={() => setShowTransModal(false)} title="Detail Transaksi Hari Ini">
        {(!data?.todayTransactions || data.todayTransactions.length === 0) ? (
          <p className="text-center text-gray-500 py-4">Belum ada transaksi hari ini.</p>
        ) : (
          <div className="space-y-6">
            {[1, 2].map((shiftNum) => {
              const shiftTxs = data.todayTransactions.filter(t => t.shift === shiftNum);
              if (shiftTxs.length === 0) return null;
              return (
                <div key={shiftNum} className="overflow-x-auto">
                  <h4 className="font-semibold text-gray-800 p-2 sm:px-0 mb-2 border-b">
                    Shift {shiftNum} {shiftNum === 1 ? "(07:00 - 19:29)" : "(19:30 - 06:59)"}
                  </h4>
                  <table className="w-full text-left text-sm border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600">
                        <th className="p-2 border-b w-10 text-center">No</th>
                        <th className="p-2 border-b whitespace-nowrap">Waktu</th>
                        <th className="p-2 border-b">User</th>
                        <th className="p-2 border-b text-center">Tipe</th>
                        <th className="p-2 border-b whitespace-nowrap">Part No</th>
                        <th className="p-2 border-b text-center">Qty</th>
                        <th className="p-2 border-b">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shiftTxs.map((t: any, idx) => (
                        <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-2 text-center text-gray-500">{idx + 1}</td>
                          <td className="p-2 text-gray-500 whitespace-nowrap">{new Date(t.timestamp).toLocaleTimeString()}</td>
                          <td className="p-2 text-gray-700">{t.fullname}</td>
                          <td className="p-2 text-center">
                            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", t.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                              {t.type}
                            </span>
                          </td>
                          <td className="p-2 font-bold whitespace-nowrap">{t.partNo}</td>
                          <td className="p-2 text-center font-bold text-gray-900">{t.qty}</td>
                          <td className="p-2 text-gray-500 italic max-w-xs truncate">{t.remark || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
          </div>
        )}
      </Modal>

      <Modal isOpen={showOverModal} onClose={() => setShowOverModal(false)} title="Daftar Over Stock">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="p-3 border-b w-10 text-center">No</th>
                <th className="p-3 border-b whitespace-nowrap">Part No</th>
                <th className="p-3 border-b min-w-[150px]">Part Name</th>
                <th className="p-3 border-b text-center">Max Stock</th>
                <th className="p-3 border-b text-center">Current Stock</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.filter(i => i.maxStock > 0 && i.currentStock > i.maxStock).map((item, idx) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-amber-50">
                  <td className="p-3 text-center text-gray-500">{idx + 1}</td>
                  <td className="p-3 font-bold text-gray-900 whitespace-nowrap">{item.partNo}</td>
                  <td className="p-3 text-gray-600">{item.partName}</td>
                  <td className="p-3 text-center text-gray-500">{item.maxStock}</td>
                  <td className="p-3 text-center font-bold text-amber-600">{item.currentStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      <Modal isOpen={showCritModal} onClose={() => setShowCritModal(false)} title="Daftar Stock Kritis">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="p-3 border-b w-10 text-center">No</th>
                <th className="p-3 border-b whitespace-nowrap">Part No</th>
                <th className="p-3 border-b min-w-[150px]">Part Name</th>
                <th className="p-3 border-b text-center">Min Stock</th>
                <th className="p-3 border-b text-center">Current Stock</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.filter(i => i.minStock > 0 && i.currentStock <= i.minStock).map((item, idx) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-red-50">
                  <td className="p-3 text-center text-gray-500">{idx + 1}</td>
                  <td className="p-3 font-bold text-gray-900 whitespace-nowrap">{item.partNo}</td>
                  <td className="p-3 text-gray-600">{item.partName}</td>
                  <td className="p-3 text-center text-gray-500">{item.minStock}</td>
                  <td className="p-3 text-center font-bold text-red-600">{item.currentStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} title={`History 8 Terakhir - ${selectedPart?.partNo}`}>
        <div className="overflow-x-auto w-full">
          {loadingHistory ? (
            <p className="text-center p-8 text-gray-500">Memuat history...</p>
          ) : partHistory.length === 0 ? (
            <p className="text-center p-8 text-gray-500">Belum ada transaksi untuk part ini.</p>
          ) : (
            <table className="w-full text-left text-sm border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="p-3 border-b w-10 text-center">No</th>
                  <th className="p-3 border-b whitespace-nowrap">Waktu</th>
                  <th className="p-3 border-b">User</th>
                  <th className="p-3 border-b text-center">Tipe</th>
                  <th className="p-3 border-b whitespace-nowrap">Part No</th>
                  <th className="p-3 border-b">Part Name</th>
                  <th className="p-3 border-b text-center">Qty</th>
                  <th className="p-3 border-b">Keterangan</th>
                  <th className="p-3 border-b text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {partHistory.map((t: any, idx) => {
                  let badge = "bg-gray-100 text-gray-700";
                  if (t.type === "IN") badge = "bg-green-100 text-green-700";
                  if (t.type === "OUT") badge = "bg-red-100 text-red-700";
                  
                  const isLog = t.type.includes("LOG");
                  const qtyDisplay = isLog ? "-" : t.qty;

                  return (
                    <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 text-center text-gray-500">{idx + 1}</td>
                      <td className="p-3 text-gray-500 whitespace-nowrap">{new Date(t.timestamp).toLocaleString('id-ID')}</td>
                      <td className="p-3 text-gray-700 whitespace-nowrap">{t.username}</td>
                      <td className="p-3 text-center">
                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap", badge)}>
                          {t.type}
                        </span>
                      </td>
                      <td className="p-3 font-bold whitespace-nowrap">{t.partNo}</td>
                      <td className="p-3 text-gray-600 truncate max-w-[120px]">{t.partName}</td>
                      <td className={cn(
                        "p-3 text-center font-bold",
                        t.type === 'IN' ? 'text-green-600' : (t.type === 'OUT' ? 'text-red-600' : 'text-gray-900')
                      )}>
                        {qtyDisplay}
                      </td>
                      <td className="p-3 text-gray-500 italic max-w-[150px] truncate">{t.remark || "-"}</td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => shareToWA(t)}
                          className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs font-medium whitespace-nowrap transition-colors"
                        >
                          Share WA
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </Modal>
    </div>
  );
}
