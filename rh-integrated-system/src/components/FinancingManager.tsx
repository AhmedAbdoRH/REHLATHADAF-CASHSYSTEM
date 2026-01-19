'use client';

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { FinancingRecord } from '@/types';

// Cloudinary Configuration
const CLOUDINARY_UPLOAD_PRESET = "ml_default"; // You might need to create an unsigned preset in Cloudinary settings
const CLOUDINARY_CLOUD_NAME = "dvikey3wc"; // Updated with your Cloud Name
const CLOUDINARY_API_KEY = "488219693456662";
const CLOUDINARY_API_SECRET = "6-tyuooUB67POIoBqDu3EbKNtlo";

// OC Firebase configuration (Firestore remains on hadaf-pa to keep your data)
const firebaseConfig = {
  apiKey: "AIzaSyDKHlDDZ4GFGI8u6oOhfOulD_XFzL3qZBQ",
  authDomain: "hadaf-pa.firebaseapp.com",
  projectId: "hadaf-pa",
  storageBucket: "hadaf-pa.appspot.com",
  messagingSenderId: "755281209375",
  appId: "1:755281209375:web:3a9040a2f0031ea2b14d2a",
  measurementId: "G-XNBQ73GMJ2"
};

const OC_APP_NAME = "oc-app";
const app = !getApps().find(a => a.name === OC_APP_NAME) 
  ? initializeApp(firebaseConfig, OC_APP_NAME) 
  : getApp(OC_APP_NAME);
const db = getFirestore(app);

// Storage is imported from @/lib/firebase which points to rhm-fsystem (Free Storage)

interface FinancingManagerProps {
  onFinancingChange: (financing: FinancingRecord[]) => void;
}

export default function FinancingManager({ onFinancingChange }: FinancingManagerProps) {
  const [financing, setFinancing] = useState<FinancingRecord[]>([]);
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [isPositive, setIsPositive] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(47.65); // Updated default rate for today
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'SAR' | 'EGP'>('EGP');
  const [isUploadingId, setIsUploadingId] = useState<string | null>(null);

  const [visibleTransactions, setVisibleTransactions] = useState(5);

  useEffect(() => {
    fetchExchangeRate();

    const transactionsQuery = query(collection(db, "transactions"), orderBy("timestamp", "desc"));
    const unsubscribeTransactions = onSnapshot(transactionsQuery, (querySnapshot) => {
      const financingList: FinancingRecord[] = querySnapshot.docs.map(docSnapshot => ({ 
        id: docSnapshot.id, 
        name: docSnapshot.data().name || '',
        cost: docSnapshot.data().cost || 0,
        timestamp: docSnapshot.data().timestamp,
        imageUrl: docSnapshot.data().imageUrl,
        archived: docSnapshot.data().archived || false
      }));
      setFinancing(financingList);
      onFinancingChange(financingList);
    }, (error) => {
      console.error('Error listening to transactions:', error);
    });

    return () => {
      unsubscribeTransactions();
    };
  }, []);

  const handleLateImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, recordId: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadingId(recordId);
      
      try {
        // Upload to Cloudinary using Fetch API
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error('Cloudinary upload failed');
        }

        const data = await response.json();
        const imageUrl = data.secure_url;
        
        await updateDoc(doc(db, "transactions", recordId), {
          imageUrl: imageUrl
        });
      } catch (error) {
        console.error('Error uploading image to Cloudinary:', error);
        alert('حدث خطأ أثناء رفع الصورة إلى Cloudinary. تأكد من إعداد Unsigned Upload Preset باسم "ml_default" في إعدادات Cloudinary.');
      } finally {
        setIsUploadingId(null);
      }
    }
  };

  const removeImage = async (recordId: string) => {
    if (!window.confirm('هل تريد بالتأكيد إزالة المرفق؟')) return;
    
    try {
      await updateDoc(doc(db, "transactions", recordId), {
        imageUrl: null
      });
    } catch (error) {
      console.error('Error removing image:', error);
      alert('حدث خطأ أثناء إزالة المرفق.');
    }
  };

  const renderNameWithLinks = (name: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = name.split(urlRegex);
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={index} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline break-all mx-1"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const fetchExchangeRate = async () => {
    try {
      const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
      const data = await response.json();
      setExchangeRate(data.rates.EGP || 47.5);
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
    }
  };

  const convertToUSD = (amount: number, currency: string) => {
    if (!amount || !currency) return 0;
    switch (currency) {
      case "SAR": return amount / 3.75;
      case "EGP": return exchangeRate > 0 ? amount / exchangeRate : amount / 47.5;
      default: return amount;
    }
  };

  const addFinancialTransaction = async () => {
    if (!name.trim() || !cost || parseFloat(cost) <= 0) {
      alert('يرجى إدخال اسم العملية وتكلفة صحيحة.');
      return;
    }

    try {
      const costInUSD = convertToUSD(parseFloat(cost), selectedCurrency);
      const finalCost = isPositive ? costInUSD : -costInUSD;
      
      await addDoc(collection(db, "transactions"), { 
        name: name.trim(), 
        cost: finalCost, 
        timestamp: serverTimestamp(),
        imageUrl: null
      });
      
      setName('');
      setCost('');
      setIsPositive(true);
    } catch (error) {
      console.error('Error adding financial transaction:', error);
      alert('حدث خطأ أثناء إضافة العملية المالية.');
    }
  };

  const deleteFinancialTransaction = async (id: string) => {
    try {
      await deleteDoc(doc(db, "transactions", id));
    } catch (error) {
      console.error('Error deleting financial transaction:', error);
      alert('حدث خطأ أثناء حذف العملية المالية.');
    }
  };

  const archiveFinancialTransaction = async (id: string) => {
    try {
      await updateDoc(doc(db, "transactions", id), { archived: true });
    } catch (error) {
      console.error('Error archiving financial transaction:', error);
      alert('حدث خطأ أثناء أرشفة العملية المالية.');
    }
  };

  const unarchiveFinancialTransaction = async (id: string) => {
    try {
      await updateDoc(doc(db, "transactions", id), { archived: false });
    } catch (error) {
      console.error('Error unarchiving financial transaction:', error);
      alert('حدث خطأ أثناء استعادة العملية المالية.');
    }
  };

  const getTotalFinancing = () => {
    return financing
      .filter(record => !record.archived)
      .reduce((sum, record) => sum + record.cost, 0);
  };

  const getPositiveTransactions = () => {
    return financing.filter(record => record.cost > 0 && !record.archived);
  };

  const getNegativeTransactions = () => {
    return financing.filter(record => record.cost < 0 && !record.archived);
  };

  const getTotalByType = (isPositiveType: boolean) => {
    return financing
      .filter(record => (record.cost > 0) === isPositiveType && !record.archived)
      .reduce((sum, record) => sum + Math.abs(record.cost), 0);
  };

  return (
    <div className="glass-card rounded-2xl shadow-2xl p-8 border border-slate-700/50 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -z-10 group-hover:bg-emerald-500/10 transition-colors"></div>
      
      <div className="flex justify-between items-start mb-8">
        <div className="text-right">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-white to-slate-400">التمويل والنفقات</h2>
          <p className="text-sm text-slate-400 mt-1 font-medium italic">إدارة التدفقات النقدية والمصاريف</p>
        </div>
        <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      </div>
      
      {/* صافي التمويل العام المتاح */}
      <div className="relative mb-8 group/total">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl blur opacity-25 group-hover/total:opacity-50 transition duration-1000 group-hover/total:duration-200"></div>
        <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-sm font-semibold mb-4 text-center text-slate-400 uppercase tracking-wider">صافي التمويل العام المتاح</h3>
          <div className="text-4xl font-black text-white text-center mb-4 tracking-tight">
            ${getTotalFinancing().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex justify-center gap-6 text-sm font-medium">
            <span className="text-slate-300 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">
              {(getTotalFinancing() * 3.75).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ريال
            </span>
            <span className="text-slate-300 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">
              {(getTotalFinancing() * exchangeRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} جنيه
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative group/input">
            <input
              type="text"
              placeholder="اسم العملية"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-4 bg-slate-900/40 border border-slate-700/50 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all placeholder:text-slate-600 font-medium"
            />
            <div className="absolute inset-0 rounded-2xl bg-emerald-500/5 opacity-0 group-focus-within/input:opacity-100 pointer-events-none transition-opacity"></div>
          </div>
          <div className="md:col-span-1 relative group/input">
            <input
              type="number"
              placeholder="المبلغ"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-full px-5 py-4 bg-slate-900/40 border border-slate-700/50 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all placeholder:text-slate-600 font-bold"
            />
            <div className="absolute inset-0 rounded-2xl bg-emerald-500/5 opacity-0 group-focus-within/input:opacity-100 pointer-events-none transition-opacity"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/80 p-1 rounded-xl border border-slate-800 flex">
            {(['SAR', 'USD', 'EGP'] as const).map((curr) => (
              <button
                key={curr}
                onClick={() => setSelectedCurrency(curr)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  selectedCurrency === curr ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {curr === 'SAR' ? 'ريال' : curr === 'USD' ? 'دولار' : 'جنيه'}
              </button>
            ))}
          </div>
          <div className="bg-slate-900/80 p-1 rounded-xl border border-slate-800 flex">
            <button
              onClick={() => setIsPositive(true)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                isPositive ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-current"></div>
              <span>إيراد</span>
            </button>
            <button
              onClick={() => setIsPositive(false)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                !isPositive ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-current"></div>
              <span>مصروف</span>
            </button>
          </div>
        </div>

        <button
          onClick={addFinancialTransaction}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4 rounded-xl font-bold hover:from-emerald-500 hover:to-teal-500 transition-all shadow-xl shadow-emerald-900/20 active:scale-[0.98] hover:scale-[1.01] flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          إضافة عملية مالية
        </button>
      </div>

      <div className="relative">
        <div className="bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800 bg-slate-800/30">
            <h3 className="text-lg font-bold text-slate-200">سجل العمليات المالية</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800/50 uppercase tracking-tighter text-[10px] font-black bg-slate-800/20">
                  <th className="px-6 py-5 first:rounded-tr-xl">العملية</th>
                  <th className="px-6 py-5">التاريخ</th>
                  <th className="px-6 py-5">المبلغ</th>
                  <th className="px-6 py-5 text-center last:rounded-tl-xl">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {financing.slice(0, visibleTransactions).map((record, index) => (
                  <tr 
                    key={record.id} 
                    className={`hover:bg-emerald-500/[0.03] transition-all group/row border-transparent hover:border-emerald-500/20 border-r-2 border-l-2 animate-fade-in opacity-0 ${record.archived ? 'grayscale opacity-50 bg-slate-900/40' : ''}`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_12px_rgba(0,0,0,0.5)] transition-transform group-hover/row:scale-125 ${
                          record.archived ? 'bg-slate-500 shadow-slate-500/50' : (record.cost > 0 ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-500 shadow-red-500/50')
                        }`}></div>
                        <div className="flex flex-col gap-1.5">
                          <div className={`font-bold text-base group-hover/row:text-white transition-colors leading-tight ${record.archived ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                            {renderNameWithLinks(record.name)}
                            {record.archived && <span className="mr-2 text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md no-underline inline-block align-middle">مؤرشف</span>}
                          </div>
                          {record.imageUrl ? (
                            <div className="flex items-center gap-2">
                              <a 
                                href={record.imageUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-bold transition-all"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                عرض المرفق
                              </a>
                              <button 
                                onClick={() => removeImage(record.id)} 
                                className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                                title="إزالة المرفق"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <label className="flex items-center gap-1.5 text-slate-500 hover:text-emerald-400 text-[10px] cursor-pointer transition-all font-bold group/label">
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLateImageUpload(e, record.id)} disabled={isUploadingId === record.id} />
                              {isUploadingId === record.id ? (
                                <span className="flex items-center gap-1.5">
                                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                  جاري الرفع...
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 opacity-60 group-hover/row:opacity-100">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  إضافة مرفق
                                </span>
                              )}
                            </label>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1.5 bg-slate-800/50 rounded-lg text-slate-400 font-bold text-[10px] border border-slate-700/50">
                        {record.timestamp ? new Date(record.timestamp.seconds * 1000).toLocaleDateString("ar-EG") : '...'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className={`font-black text-lg group-hover/row:scale-105 transition-transform ${record.cost > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {record.cost > 0 ? '+' : '-'}${Math.abs(record.cost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                        {selectedCurrency === 'SAR' ? `${(Math.abs(record.cost) * 3.75).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ريال` : 
                         selectedCurrency === 'EGP' ? `${(Math.abs(record.cost) * exchangeRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} جنيه` : 
                         ''}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover/row:opacity-100 transition-all transform translate-x-2 group-hover/row:translate-x-0">
                        {record.archived ? (
                          <button
                            onClick={() => unarchiveFinancialTransaction(record.id)}
                            className="p-2.5 bg-slate-800/50 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded-xl transition-all border border-slate-700/50 hover:border-emerald-500/30"
                            title="استعادة من الأرشيف"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={() => archiveFinancialTransaction(record.id)}
                            className="p-2.5 bg-slate-800/50 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 rounded-xl transition-all border border-slate-700/50 hover:border-amber-500/30"
                            title="أرشفة"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => deleteFinancialTransaction(record.id)}
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

          <div className="grid grid-cols-2 divide-x divide-x-reverse divide-slate-800 border-t border-slate-800 bg-slate-900/60">
            <div className="px-4 py-4 text-center">
              <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-widest">إجمالي التمويل</p>
              <p className="text-sm font-black text-emerald-400">${getTotalByType(true).toFixed(2)}</p>
            </div>
            <div className="px-4 py-4 text-center">
              <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-widest">إجمالي المصروفات</p>
              <p className="text-sm font-black text-red-400">${getTotalByType(false).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {financing.length > visibleTransactions && (
          <button
            onClick={() => setVisibleTransactions(prev => prev + 10)}
            className="w-full py-4 text-slate-500 hover:text-slate-300 font-bold text-xs uppercase tracking-widest bg-slate-900/50 hover:bg-slate-800 transition-all border border-slate-800 rounded-xl mt-4"
          >
            عرض المزيد من العمليات
          </button>
        )}
      </div>
    </div>
  );
}
