"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllUsers, deleteUserAllData, FirestoreUser } from "@/lib/firebaseService";
import { Trash2, RefreshCw, Loader2, ShieldAlert, Users } from "lucide-react";
import { toast } from "sonner";

// ⚠️ Bu sayfa yalnızca geliştirme/yönetim amaçlıdır.
// İşiniz bitince /app/admin klasörünü silin.

const MAIN_USER_DOC_ID = "main_user";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [fetching, setFetching] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setFetching(true);
    try {
      const list = await getAllUsers();
      setUsers(list);
    } catch (e) {
      toast.error("Kullanıcılar yüklenemedi.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user) fetchUsers();
  }, [user]);

  const handleDelete = async (u: FirestoreUser) => {
    if (u.docId === MAIN_USER_DOC_ID) {
      toast.error("main_user silinemez!");
      return;
    }
    setDeletingId(u.docId);
    try {
      await deleteUserAllData(u.docId);
      setUsers((prev) => prev.filter((x) => x.docId !== u.docId));
      toast.success(`"${u.displayName}" silindi.`);
    } catch (e) {
      toast.error("Silme işlemi başarısız.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p className="text-sm font-bold">Erişim için giriş yapın.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Admin Paneli</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              ⚠️ Yalnızca geliştirici kullanımı — işiniz bitince bu sayfayı silin
            </p>
          </div>
          <button
            onClick={fetchUsers}
            disabled={fetching}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-bold transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${fetching ? "animate-spin" : ""}`} />
            Yenile
          </button>
        </div>

        {/* User List */}
        <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10 bg-white/5">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              Firestore Kullanıcıları ({users.length})
            </span>
          </div>

          {fetching ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-10">Kullanıcı bulunamadı.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {users.map((u) => {
                const isMain = u.docId === MAIN_USER_DOC_ID;
                const isDeleting = deletingId === u.docId;
                return (
                  <li
                    key={u.docId}
                    className={`flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors ${isMain ? "bg-emerald-500/5" : ""}`}
                  >
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${isMain ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-slate-300"}`}>
                      {u.displayName.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm truncate">{u.displayName}</span>
                        {isMain && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            Korunan
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 font-mono truncate block">{u.docId}</span>
                      {u.totalTrials !== undefined && (
                        <span className="text-[10px] text-slate-500">
                          {u.totalTrials} deneme · Ort. {u.averageNet?.toFixed(1)} net
                        </span>
                      )}
                    </div>

                    {/* Delete Button */}
                    {!isMain && (
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={isDeleting}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/15 transition-all shrink-0 disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        Sil
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
