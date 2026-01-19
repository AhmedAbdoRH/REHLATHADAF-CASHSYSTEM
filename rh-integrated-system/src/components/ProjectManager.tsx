'use client';

import React, { useState, useEffect } from 'react';
import { database, ref, push, onValue, remove, update, doc, getDoc, db } from '@/lib/firebase';
import { Project } from '@/types';

interface ProjectManagerProps {
  onProjectsChange: (projects: Project[]) => void;
}

export default function ProjectManager({ onProjectsChange }: ProjectManagerProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectName, setProjectName] = useState('');
  const [projectCost, setProjectCost] = useState('');
  const [projectType, setProjectType] = useState<'egypt' | 'saudi' | 'mah'>('egypt');
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'SAR' | 'EGP'>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(47.65); // Updated default rate for today
  const [visibleProjects, setVisibleProjects] = useState(5);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        // Try fetching from live API first
        const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        const data = await response.json();
        if (data.rates && data.rates.EGP) {
          setExchangeRate(data.rates.EGP);
          console.log("Fetched live exchange rate:", data.rates.EGP);
          return;
        }
      } catch (error) {
        console.error("Error fetching live exchange rate, falling back to Firestore:", error);
      }

      // Fallback to Firestore if API fails
      const docRef = doc(db, "exchangeRates", "EGP");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setExchangeRate(docSnap.data().rate);
      } else {
        console.log("No such document for exchange rate in Firestore!");
      }
    };

    fetchExchangeRate();

    const projectsRef = ref(database, 'projects');
    
    const unsubscribe = onValue(projectsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const projectsList: Project[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key]
        }));
        setProjects(projectsList);
        onProjectsChange(projectsList);
      }
    });

    return () => unsubscribe();
  }, [onProjectsChange]);

  const convertToUSD = (amount: number, currency: 'USD' | 'SAR' | 'EGP') => {
    if (!amount || !currency) return 0;
    switch (currency) {
      case "SAR": return amount / 3.75;
      case "EGP": return exchangeRate > 0 ? amount / exchangeRate : amount / 50;
      case "USD": return amount;
      default: return amount;
    }
  };

  const convertToSelectedCurrency = (amount: number, targetCurrency: 'USD' | 'SAR' | 'EGP') => {
    if (!amount) return 0;
    let amountInUSD = amount;

    switch (targetCurrency) {
      case "SAR": return amountInUSD * 3.75;
      case "EGP": return amountInUSD * exchangeRate;
      case "USD": return amountInUSD;
      default: return amountInUSD;
    }
  };

  const addProject = () => {
    if (!projectName.trim() || !projectCost || parseFloat(projectCost) <= 0) {
      alert('يرجى إدخال اسم المشروع وتكلفة صحيحة.');
      return;
    }

    const costInUSD = convertToUSD(parseFloat(projectCost), selectedCurrency);
    const date = new Date().toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit' });
    
    const projectData = {
      name: projectName.trim(),
      cost: costInUSD,
      projectType,
      date
    };

    push(ref(database, 'projects'), projectData)
      .then(() => {
        setProjectName('');
        setProjectCost('');
      })
      .catch((error) => {
        console.error('Error adding project:', error);
        alert('حدث خطأ أثناء إضافة المشروع.');
      });
  };

  const deleteProject = (projectId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المشروع نهائياً؟')) {
      remove(ref(database, `projects/${projectId}`))
        .catch((error) => {
          console.error('Error deleting project:', error);
          alert('حدث خطأ أثناء حذف المشروع.');
        });
    }
  };

  const archiveProject = (projectId: string) => {
    update(ref(database, `projects/${projectId}`), { archived: true })
      .catch((error) => {
        console.error('Error archiving project:', error);
        alert('حدث خطأ أثناء أرشفة المشروع.');
      });
  };

  const unarchiveProject = (projectId: string) => {
    update(ref(database, `projects/${projectId}`), { archived: false })
      .catch((error) => {
        console.error('Error unarchiving project:', error);
        alert('حدث خطأ أثناء استعادة المشروع.');
      });
  };

  const getProjectsByType = (type: 'egypt' | 'saudi' | 'mah') => {
    return projects.filter(project => project.projectType === type && !project.archived);
  };

  const getTotalByType = (type: 'egypt' | 'saudi' | 'mah') => {
    return projects
      .filter(project => project.projectType === type && !project.archived)
      .reduce((sum, project) => sum + project.cost, 0);
  };

  return (
    <div className="glass-card rounded-2xl shadow-2xl p-8 border border-slate-700/50 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -z-10 group-hover:bg-blue-500/10 transition-colors"></div>
      
      <div className="flex justify-between items-start mb-8">
        <div className="text-right">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-white to-slate-400">دخل المكتب</h2>
          <div className="text-sm text-slate-400 mt-1 font-medium" contentEditable={true} suppressContentEditableWarning={true}>
            لشهر {new Date().toLocaleDateString('ar-EG', { month: 'long' })} لعام {new Date().getFullYear()}
          </div>
        </div>
        <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      {/* إجمالي دخل المكتب */}
      <div className="relative mb-8 group/total">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover/total:opacity-50 transition duration-1000 group-hover/total:duration-200"></div>
        <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-sm font-semibold mb-4 text-center text-slate-400 uppercase tracking-wider">إجمالي دخل المكتب</h3>
          <div className="text-4xl font-black text-white text-center mb-4 tracking-tight">
            ${(getTotalByType('egypt') + getTotalByType('saudi') + getTotalByType('mah')).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex justify-center gap-6 text-sm font-medium">
            <span className="text-slate-300 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">
              {((getTotalByType('egypt') + getTotalByType('saudi') + getTotalByType('mah')) * 3.75).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ريال
            </span>
            <span className="text-slate-300 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">
              {((getTotalByType('egypt') + getTotalByType('saudi') + getTotalByType('mah')) * exchangeRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} جنيه
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative group/input">
            <input
              type="text"
              placeholder="اسم المشروع"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-5 py-4 bg-slate-900/40 border border-slate-700/50 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all placeholder:text-slate-600 font-medium"
            />
            <div className="absolute inset-0 rounded-2xl bg-blue-500/5 opacity-0 group-focus-within/input:opacity-100 pointer-events-none transition-opacity"></div>
          </div>
          <div className="md:col-span-1 relative group/input">
            <input
              type="number"
              placeholder="المبلغ"
              value={projectCost}
              onChange={(e) => setProjectCost(e.target.value)}
              className="w-full px-5 py-4 bg-slate-900/40 border border-slate-700/50 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all placeholder:text-slate-600 font-bold"
            />
            <div className="absolute inset-0 rounded-2xl bg-blue-500/5 opacity-0 group-focus-within/input:opacity-100 pointer-events-none transition-opacity"></div>
          </div>
        </div>

        {/* Currency & Type Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/80 p-1 rounded-xl border border-slate-800 flex">
            {['USD', 'SAR', 'EGP'].map((curr) => (
              <button
                key={curr}
                onClick={() => setSelectedCurrency(curr as any)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  selectedCurrency === curr ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {curr === 'USD' ? 'دولار' : curr === 'SAR' ? 'ريال' : 'جنيه'}
              </button>
            ))}
          </div>
          <div className="bg-slate-900/80 p-1 rounded-xl border border-slate-800 flex">
            {[
              { id: 'egypt', label: 'مصر', icon: '🇪🇬' },
              { id: 'saudi', label: 'المملكة', icon: '🇸🇦' },
              { id: 'mah', label: 'MAH', icon: '💼' }
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setProjectType(type.id as any)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  projectType === type.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span>{type.icon}</span>
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={addProject}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-xl font-bold hover:from-blue-500 hover:to-indigo-500 transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98] hover:scale-[1.01] flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          إضافة مشروع جديد
        </button>
      </div>

      <div className="relative">
        <div className="bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
            <h3 className="text-lg font-bold text-slate-200">سجل المشاريع الأخيرة</h3>
            <button
              onClick={() => setIsArchiveOpen(true)}
              className="group flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              الأرشيف
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800/50 uppercase tracking-tighter text-[10px] font-black bg-slate-800/20">
                  <th className="px-6 py-5 first:rounded-tr-xl">المشروع</th>
                  <th className="px-6 py-5">التاريخ</th>
                  <th className="px-6 py-5">التكلفة</th>
                  <th className="px-6 py-5 text-center last:rounded-tl-xl">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {projects
                  .filter(p => !p.archived)
                  .slice(0, visibleProjects)
                  .map((project, index) => (
                  <tr 
                    key={project.id} 
                    className={`hover:bg-blue-500/[0.03] transition-all group/row border-transparent hover:border-blue-500/20 border-r-2 border-l-2 animate-fade-in opacity-0`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_12px_rgba(0,0,0,0.5)] transition-transform group-hover/row:scale-125 ${
                          project.projectType === 'egypt' ? 'bg-blue-500 shadow-blue-500/50' : 
                          project.projectType === 'saudi' ? 'bg-emerald-500 shadow-emerald-500/50' : 
                          'bg-purple-500 shadow-purple-500/50'
                        }`}></div>
                        <span className="text-slate-200 font-bold text-base group-hover/row:text-white transition-colors">{project.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1.5 bg-slate-800/50 rounded-lg text-slate-400 font-bold text-[10px] border border-slate-700/50">
                        {project.date}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-slate-100 font-black text-lg group-hover/row:text-blue-400 transition-colors">${project.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                        {selectedCurrency === 'SAR' ? `${(project.cost * 3.75).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ريال` : 
                         selectedCurrency === 'EGP' ? `${(project.cost * exchangeRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} جنيه` : 
                         ''}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover/row:opacity-100 transition-all transform translate-x-2 group-hover/row:translate-x-0">
                        <button
                          onClick={() => archiveProject(project.id)}
                          className="p-2.5 bg-slate-800/50 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-xl transition-all border border-slate-700/50 hover:border-blue-500/30"
                          title="أرشفة"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="p-2.5 bg-slate-800/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-all border border-slate-700/50 hover:border-red-500/30"
                          title="حذف"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {projects.length > visibleProjects && (
            <button
              onClick={() => setVisibleProjects(prev => prev + 10)}
              className="w-full py-4 text-slate-500 hover:text-slate-300 font-bold text-xs uppercase tracking-widest bg-slate-900/50 hover:bg-slate-800 transition-all border-t border-slate-800"
            >
              عرض المزيد من المشاريع
            </button>
          )}

          <div className="grid grid-cols-3 divide-x divide-x-reverse divide-slate-800 border-t border-slate-800 bg-slate-900/60">
            {[
              { label: 'مصر 🇪🇬', val: getTotalByType('egypt'), color: 'text-blue-400' },
              { label: 'المملكة 🇸🇦', val: getTotalByType('saudi'), color: 'text-emerald-400' },
              { label: 'MAH 💼', val: getTotalByType('mah'), color: 'text-purple-400' }
            ].map((item, i) => (
              <div key={i} className="px-4 py-4 text-center">
                <p className="text-[10px] text-slate-500 font-bold mb-1">{item.label}</p>
                <p className={`text-sm font-black ${item.color}`}>${item.val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Archive Modal */}
      {isArchiveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
              <h3 className="text-xl font-bold text-gray-100 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                أرشيف المشاريع
              </h3>
              <button 
                onClick={() => setIsArchiveOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {projects.filter(p => p.archived).length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  <p>لا توجد مشاريع مؤرشفة حالياً</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700 text-gray-400">
                        <th className="text-right pb-3 font-medium">المشروع</th>
                        <th className="text-right pb-3 font-medium">النوع</th>
                        <th className="text-right pb-3 font-medium">التاريخ</th>
                        <th className="text-right pb-3 font-medium">التكلفة</th>
                        <th className="text-center pb-3 font-medium">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {projects.filter(p => p.archived).map((project) => (
                        <tr key={project.id} className="hover:bg-gray-700/30 transition-colors">
                          <td className="py-3 text-gray-100 font-medium">{project.name}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                              project.projectType === 'egypt' ? 'bg-blue-900/30 text-blue-400 border border-blue-800/50' : 
                              project.projectType === 'saudi' ? 'bg-green-900/30 text-green-400 border border-green-800/50' : 
                              'bg-purple-900/30 text-purple-400 border border-purple-800/50'
                            }`}>
                              {project.projectType === 'egypt' ? 'مصر' : 
                               project.projectType === 'saudi' ? 'المملكة' : 'MAH'}
                            </span>
                          </td>
                          <td className="py-3 text-gray-400">{project.date}</td>
                          <td className="py-3 font-bold text-gray-100">${project.cost.toFixed(2)}</td>
                          <td className="py-3">
                            <div className="flex items-center justify-center space-x-3 space-x-reverse">
                              <button
                                onClick={() => unarchiveProject(project.id)}
                                className="flex items-center space-x-1 space-x-reverse text-blue-400 hover:text-blue-300 transition-colors"
                                title="استعادة"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span className="text-xs">استعادة</span>
                              </button>
                              <button
                                onClick={() => deleteProject(project.id)}
                                className="flex items-center space-x-1 space-x-reverse text-red-500 hover:text-red-400 transition-colors"
                                title="حذف نهائي"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span className="text-xs">حذف</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-700 bg-gray-900/50 flex justify-end">
              <button 
                onClick={() => setIsArchiveOpen(false)}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
