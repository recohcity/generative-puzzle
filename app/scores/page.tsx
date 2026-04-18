'use client';

import { useEffect, useState, useMemo } from 'react';
import { CloudGameRepository } from '@/utils/cloud/CloudGameRepository';
import ResponsiveBackground from '@/components/ResponsiveBackground';
import { 
  Users, 
  Trophy, 
  RefreshCcw, 
  Search, 
  ArrowLeft, 
  ShieldCheck,
  BarChart3,
  UserX,
  Database,
  Zap,
  Languages,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslation } from '@/contexts/I18nContext';

const ADMIN_ACCESS_KEY = "admin888"; 
const PAGE_SIZE = 10;

export default function ScoreManagementPage() {
  const { t, locale, changeLocale } = useTranslation();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminInput, setAdminInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const isCN = locale === 'zh-CN';

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const allProfiles = await CloudGameRepository.adminFetchAllProfiles();
      setProfiles(allProfiles);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin]);

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminInput === ADMIN_ACCESS_KEY) {
      setIsAdmin(true);
      window.localStorage.setItem('gp_admin_verified', 'true');
    } else {
      alert(isCN ? "密码错误 / 访问被拒绝" : "Incorrect Password / Access Denied");
    }
  };

  useEffect(() => {
    if (window.localStorage.getItem('gp_admin_verified') === 'true') {
      setIsAdmin(true);
    }
  }, []);

  const handleDeleteScores = async (userId: string, nickname: string) => {
    const confirmMsg = isCN 
      ? `确定要清空用户 [${nickname}] 的所有游戏成绩吗？此操作不可撤销。`
      : `Are you sure you want to clear all scores for user [${nickname}]? This action cannot be undone.`;
    
    if (!confirm(confirmMsg)) return;
    
    setActionLoading(userId);
    const success = await CloudGameRepository.adminDeleteUserScores(userId);
    if (success) {
      alert(isCN ? "成绩已成功清空" : "Scores cleared successfully");
      fetchAllData();
    } else {
      alert(isCN ? "操作失败" : "Operation failed");
    }
    setActionLoading(null);
  };

  const handleDeleteUser = async (userId: string, nickname: string) => {
    const confirmMsg = isCN
      ? `警告：确定要彻底注销用户 [${nickname}] 吗？\n这将删除该用户的所有档案和全部成绩。`
      : `Warning: Are you sure you want to completely delete user [${nickname}]?\nThis will remove their profile and all score data.`;

    if (!confirm(confirmMsg)) return;
    
    setActionLoading(userId);
    const success = await CloudGameRepository.adminDeleteUserCompletely(userId);
    if (success) {
      alert(isCN ? "用户已彻底移除" : "User removed successfully");
      fetchAllData();
    } else {
      alert(isCN ? "操作失败" : "Operation failed");
    }
    setActionLoading(null);
  };

  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => 
      p.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [profiles, searchTerm]);

  const stats = useMemo(() => {
    if (profiles.length === 0) return { total: 0, avg: 0, high: 0 };
    const scores = profiles.map(p => p.best_score || 0);
    return {
      total: profiles.length,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / (profiles.length || 1)),
      high: Math.max(...scores)
    };
  }, [profiles]);

  const toggleLanguage = () => {
    const nextLang = locale === 'zh-CN' ? 'en' : 'zh-CN';
    changeLocale(nextLang as any);
  };

  const L = {
    gameTitle: isCN ? '生成式拼图游戏' : 'Generative Puzzle',
    dashboard: isCN ? '用户数据看板' : 'User Data Dashboard',
    subtitle: isCN ? '全服玩家记录管理与成绩维护系统' : 'Global Player Records and Score Maintenance System',
    totalUsers: isCN ? '活跃玩家总计' : 'Total Active Users',
    avgScore: isCN ? '全服平均成绩' : 'Avg Best Score',
    peakScore: isCN ? '历史最高得分' : 'Peak Score Record',
    profile: isCN ? '用户信息' : 'User Profile',
    best: isCN ? '最高分' : 'Best',
    lastSync: isCN ? '最后同步' : 'Last Sync',
    actions: isCN ? '管理操作' : 'Actions',
    searchPlaceholder: isCN ? '搜索用户昵称或 ID...' : 'Search nickname or ID...',
    refresh: isCN ? '刷新数据' : 'Refresh Data',
    logout: isCN ? '退出登录' : 'Logout',
    clearScores: isCN ? '清空成绩' : 'Clear Score',
    deleteUser: isCN ? '注销账户' : 'Delete User',
    syncing: isCN ? '正在同步数据...' : 'Syncing Data...',
    noData: isCN ? '无匹配记录' : 'No Data Found',
    adminLabel: isCN ? '管理员终端' : 'Admin Terminal',
    verify: isCN ? '验证并进入' : 'Login Dashboard',
    back: isCN ? '返回首页' : 'Home',
    inputHint: isCN ? '请输入访问密钥' : 'Enter Secret Key',
    page: isCN ? '第 {{current}} 页，共 {{total}} 页' : 'Page {{current}} of {{total}}'
  };

  const paginatedProfiles = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProfiles.slice(start, start + PAGE_SIZE);
  }, [filteredProfiles, currentPage]);

  const totalPages = Math.ceil(filteredProfiles.length / PAGE_SIZE);

  if (!isAdmin) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
        <ResponsiveBackground />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-[#1a1b26]/95 backdrop-blur-2xl border border-white/20 p-10 rounded-[2.5rem] shadow-2xl relative z-10"
        >
          <div className="w-16 h-16 bg-[#F68E5F]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#F68E5F]/40">
            <ShieldCheck className="w-8 h-8 text-[#FFB17A]" />
          </div>
          <h1 className="text-xl font-black text-center mb-1 text-white uppercase">{L.gameTitle}</h1>
          <p className="text-[#FFB17A] text-center text-[10px] mb-8 font-black uppercase tracking-[0.3em]">{L.adminLabel}</p>
          
          <form onSubmit={handleAdminAuth} className="space-y-4">
            <input 
              type="password"
              placeholder={L.inputHint}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-center outline-none focus:border-[#F68E5F] transition-all font-mono tracking-widest text-white text-lg placeholder-white/20"
              value={adminInput}
              onChange={(e) => setAdminInput(e.target.value)}
              autoFocus
            />
            <button type="submit" className="w-full glass-btn-active h-14 rounded-2xl text-sm font-bold uppercase tracking-widest">
              {L.verify}
            </button>
          </form>
          
          <div className="flex items-center justify-between mt-10 px-1">
            <Link href="/" className="text-white/40 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> {L.back}
            </Link>
            <button onClick={toggleLanguage} className="text-[#FFB17A] text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
              <Languages className="w-3 h-3" /> {isCN ? 'English' : '中文'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative text-white font-sans overflow-x-hidden">
      <ResponsiveBackground />
      
      <div className="max-w-7xl mx-auto px-6 py-10 relative z-10">
        
        {/* Header Section */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <Link href="/" className="glass-btn-inactive w-12 h-12 rounded-2xl shrink-0 group">
              <ArrowLeft className="w-5 h-5 text-[#FFB17A] group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                <div className="bg-[#F68E5F] text-[#1a1b26] text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase shadow-lg shadow-[#F68E5F]/20">
                  {L.adminLabel}
                </div>
                <span className="text-[#FFB17A] text-[11px] font-bold opacity-60 tracking-wider truncate uppercase">{L.gameTitle}</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight leading-none truncate">
                {L.dashboard}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end lg:self-center bg-black/40 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl">
             <button onClick={toggleLanguage} className="h-10 px-5 rounded-xl text-[10px] font-black uppercase bg-white/5 border border-white/5 hover:bg-[#FFB17A]/20 text-[#FFB17A] transition-all flex items-center gap-2">
                <Languages className="w-4 h-4" />
                {isCN ? 'English' : '中文'}
             </button>
             <button onClick={fetchAllData} disabled={loading} className="h-10 px-5 rounded-xl text-[10px] font-black uppercase bg-white/5 border border-white/5 hover:bg-white/15 flex items-center gap-2 transition-all">
                <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {L.refresh}
             </button>
             <button onClick={() => { setIsAdmin(false); window.localStorage.removeItem('gp_admin_verified'); }} className="h-10 px-5 rounded-xl text-[10px] font-black uppercase bg-[#F68E5F] text-[#1a1b26] shadow-lg shadow-[#F68E5F]/20 hover:scale-105 transition-all flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                {L.logout}
             </button>
          </div>
        </header>

        {/* Global Stats - Sleek Row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {[
            { label: L.totalUsers, val: stats.total, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
            { label: L.avgScore, val: stats.avg, icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
            { label: L.peakScore, val: stats.high, icon: Trophy, color: 'text-[#FFB17A]', bg: 'bg-[#F68E5F]/10', border: 'border-[#F68E5F]/20' }
          ].map((stat, i) => (
            <div key={i} className="bg-[#1a1b26]/90 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-xl flex items-center gap-6 group hover:border-white/20 transition-all">
               <div className={`w-12 h-12 ${stat.bg} ${stat.border} rounded-2xl flex items-center justify-center shrink-0 border shadow-lg group-hover:scale-110 transition-transform`}>
                 <stat.icon className={`w-6 h-6 ${stat.color}`} />
               </div>
               <div className="min-w-0">
                 <div className="text-white/40 text-[9px] font-black uppercase tracking-widest leading-none mb-1.5">{stat.label}</div>
                 <div className="text-3xl font-black text-white leading-none whitespace-nowrap">{stat.val.toLocaleString()}</div>
               </div>
            </div>
          ))}
        </section>

        {/* User Data Hub */}
        <section className="bg-[#1a1b26]/95 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <header className="px-10 py-8 border-b border-white/10 flex flex-wrap items-center justify-between gap-6">
            <h2 className="text-2xl font-black flex items-center gap-4">
              <Database className="w-6 h-6 text-[#FFB17A]" /> 
              {isCN ? '全量名录' : 'DIRECTORY'}
              <span className="text-xs bg-[#FFB17A]/10 text-[#FFB17A] px-3 py-1 rounded-full border border-[#FFB17A]/20 font-black">
                {filteredProfiles.length}
              </span>
            </h2>

            <div className="relative w-full max-w-sm">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
              <input 
                type="text" 
                placeholder={L.searchPlaceholder}
                className="w-full bg-black/40 border border-white/10 rounded-[1.25rem] py-4 pl-14 pr-6 outline-none focus:border-[#F68E5F] text-sm font-bold text-white placeholder-white/20 transition-all"
                value={searchTerm}
                onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
              />
            </div>
          </header>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-10 py-6 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{L.profile}</th>
                  <th className="px-10 py-6 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{L.best}</th>
                  <th className="px-10 py-6 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{isCN ? '总局数' : 'GAMES'}</th>
                  <th className="px-10 py-6 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] text-center">{L.lastSync}</th>
                  <th className="px-10 py-6 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] text-right">{L.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {loading ? (
                   <tr>
                     <td colSpan={4} className="py-32 text-center">
                        <RefreshCcw className="w-10 h-10 mx-auto text-[#FFB17A] animate-spin opacity-30" />
                        <div className="mt-4 text-[11px] font-black uppercase text-[#FFB17A]/40 tracking-widest">{L.syncing}</div>
                     </td>
                   </tr>
                ) : paginatedProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-32 text-center text-white/10 font-black italic uppercase tracking-[0.4em]">{L.noData}</td>
                  </tr>
                ) : (
                  paginatedProfiles.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.03] transition-all group">
                      <td className="px-10 py-7">
                        <div className="flex items-center gap-5">
                           <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FFD5AB] to-[#F68E5F] flex items-center justify-center font-black text-[#1a1b26] text-base shadow-lg group-hover:scale-110 transition-transform">
                             {p.nickname?.[0] || '?'}
                           </div>
                           <div className="min-w-0">
                             <div className="text-base font-black text-white group-hover:text-[#FFB17A] transition-colors truncate">{p.nickname || 'Anonymity'}</div>
                             <div className="text-[10px] font-mono text-white/15 uppercase truncate w-40 tracking-tighter">{p.id}</div>
                           </div>
                        </div>
                      </td>
                      <td className="px-10 py-7">
                         <div className="flex items-center gap-3 text-white">
                           <Zap className="w-4 h-4 text-amber-500" />
                           <span className="text-xl font-black">{p.best_score?.toLocaleString() || 0}</span>
                         </div>
                      </td>
                      <td className="px-10 py-7">
                         <div className="flex items-center gap-2 text-white/50">
                           <Gamepad2 className="w-4 h-4 text-emerald-500/70" />
                           <span className="text-sm font-bold">{p.total_games?.toLocaleString() || 0}</span>
                         </div>
                      </td>
                      <td className="px-10 py-7 text-center">
                         <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-bold text-white/40 uppercase tracking-tight">
                               {p.updated_at ? new Date(p.updated_at).toLocaleDateString(isCN ? 'zh-CN' : 'en-US') : '-'}
                            </span>
                            <span className="text-[9px] font-mono text-white/10">
                               {p.updated_at ? new Date(p.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                         </div>
                      </td>
                      <td className="px-10 py-7 text-right">
                         <div className="flex items-center justify-end gap-3 translate-x-3">
                            <button 
                              onClick={() => handleDeleteScores(p.id, p.nickname)}
                              disabled={actionLoading === p.id}
                              className="h-10 px-4 rounded-xl text-[10px] font-black uppercase text-white/30 hover:text-amber-500 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-all"
                            >
                               {isCN ? '清空' : 'Clear'}
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(p.id, p.nickname)}
                              disabled={actionLoading === p.id}
                              className="w-10 h-10 rounded-xl text-white/20 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 flex items-center justify-center transition-all"
                              title={L.deleteUser}
                            >
                               <UserX className="w-5 h-5" />
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <footer className="px-10 py-6 border-t border-white/10 flex items-center justify-between bg-black/20">
               <div className="text-[11px] font-black text-white/20 uppercase tracking-[0.2em]">
                  {L.page.replace('{{current}}', currentPage.toString()).replace('{{total}}', totalPages.toString())}
               </div>
               <div className="flex items-center gap-3">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/20 disabled:opacity-10 disabled:pointer-events-none transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/20 disabled:opacity-10 disabled:pointer-events-none transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
               </div>
            </footer>
          )}
        </section>

        <footer className="mt-12 py-10 text-center opacity-40">
           <div className="inline-flex items-center gap-4 px-8 py-3 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white/20 border border-white/5">
              <ShieldCheck className="w-4 h-4 text-[#FFB17A]" /> 
              SECURE ADMIN ACCESS CHANNEL · RECOH INTERNAL
           </div>
        </footer>
      </div>
    </div>
  );
}