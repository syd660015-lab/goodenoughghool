/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  User, 
  Calendar, 
  Info, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  FileText, 
  PenTool, 
  Eraser, 
  RotateCcw,
  Check,
  TrendingUp,
  BrainCircuit,
  Download,
  Printer,
  ClipboardList,
  MessageSquareQuote
} from 'lucide-react';
import { ChildInfo, IQInterpretation, MentalAge } from './types';
import { SCORING_ITEMS, RAW_SCORE_TO_MENTAL_AGE } from './data/testData';

// --- Components ---

const Header = () => (
  <header className="bg-white border-b border-natural-border py-8 sticky top-0 z-10 transition-all">
    <div className="max-w-5xl mx-auto px-6 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
          <BrainCircuit size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-serif font-bold text-natural-text leading-tight">اختبار رسم الرجل</h1>
          <p className="text-[10px] text-natural-light-text font-bold uppercase tracking-[0.2em]">جودانف - هاريس لقياس الذكاء</p>
        </div>
      </div>
      <div className="hidden md:block">
        <span className="text-[10px] font-bold bg-natural-muted text-primary px-4 py-1.5 rounded-full uppercase tracking-widest border border-natural-border">
          Goodenough-Harris Scale
        </span>
      </div>
    </div>
  </header>
);

const SectionTitle = ({ title, icon: Icon, subtitle }: { title: string; icon: any; subtitle?: string }) => (
  <div className="mb-10 text-right" dir="rtl">
    <div className="flex items-center gap-4 mb-3 justify-start flex-row-reverse">
      <div className="p-3 bg-natural-muted rounded-2xl text-primary border border-natural-border">
        <Icon size={28} />
      </div>
      <h2 className="text-3xl font-serif font-bold text-natural-text">{title}</h2>
    </div>
    {subtitle && <p className="text-natural-light-text text-sm mr-16 font-light">{subtitle}</p>}
  </div>
);

// --- Main App Logic ---

export default function App() {
  const [step, setStep] = useState(0);
  const [childInfo, setChildInfo] = useState<ChildInfo>({
    name: '',
    birthDate: '',
    testDate: new Date().toISOString().split('T')[0],
    examinerName: ''
  });
  const [scoreItems, setScoreItems] = useState<Record<number, boolean>>({});
  const [drawingDataUrl, setDrawingDataUrl] = useState<string | null>(null);
  const [drawingHistory, setDrawingHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [brushSize, setBrushSize] = useState(3);
  const [brushColor, setBrushColor] = useState('#5A5A40');

  const [examinerNotes, setExaminerNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');

  // Persist drawing
  const saveCanvas = useCallback(() => {
    const canvas = document.getElementById('test-canvas') as HTMLCanvasElement;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      setDrawingDataUrl(dataUrl);
      
      const newHistory = drawingHistory.slice(0, historyIndex + 1);
      newHistory.push(dataUrl);
      // Limit history to 20 steps
      if (newHistory.length > 20) newHistory.shift();
      
      setDrawingHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [drawingHistory, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const dataUrl = drawingHistory[newIndex];
      setDrawingDataUrl(dataUrl);
      restoreCanvas(dataUrl);
    } else if (historyIndex === 0) {
      // Clear canvas if we undo the first stroke
      setHistoryIndex(-1);
      setDrawingDataUrl(null);
      const canvas = document.getElementById('test-canvas') as HTMLCanvasElement;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const redo = () => {
    if (historyIndex < drawingHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const dataUrl = drawingHistory[newIndex];
      setDrawingDataUrl(dataUrl);
      restoreCanvas(dataUrl);
    }
  };

  const restoreCanvas = (dataUrl: string) => {
    const canvas = document.getElementById('test-canvas') as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = dataUrl;
      }
    }
  };

  const canvasColors = [
    { name: 'Forest', value: '#5A5A40' },
    { name: 'Charcoal', value: '#2d2d2a' },
    { name: 'Slate', value: '#7c7c72' },
    { name: 'Terracotta', value: '#d16a5a' },
    { name: 'Muted Blue', value: '#5d8aa8' },
  ];

  const brushSizes = [
    { label: 'S', value: 2 },
    { label: 'M', value: 5 },
    { label: 'L', value: 10 },
  ];

  const rawScore = Object.values(scoreItems).filter(Boolean).length;

  const calculateAge = (birthDate: string, targetDate: string) => {
    const start = new Date(birthDate);
    const end = new Date(targetDate);
    
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    
    if (months < 0 || (months === 0 && end.getDate() < start.getDate())) {
      years--;
      months += 12;
    }
    
    return { years, months, totalMonths: years * 12 + months };
  };

  const currentAge = useMemo(() => {
    if (!childInfo.birthDate || !childInfo.testDate) return null;
    return calculateAge(childInfo.birthDate, childInfo.testDate);
  }, [childInfo.birthDate, childInfo.testDate]);

  const mentalAgeResult = useMemo(() => {
    return RAW_SCORE_TO_MENTAL_AGE[rawScore] || { years: 0, months: 0 };
  }, [rawScore]);

  const iqResult = useMemo(() => {
    if (!currentAge || !mentalAgeResult) return null;
    const mentalMonths = mentalAgeResult.years * 12 + mentalAgeResult.months;
    const chronologicalMonths = currentAge.totalMonths;
    if (chronologicalMonths === 0) return 0;
    return Math.round((mentalMonths / chronologicalMonths) * 100);
  }, [currentAge, mentalAgeResult]);

  const getInterpretation = (iq: number): IQInterpretation => {
    if (iq >= 140) return "عبقري";
    if (iq >= 120) return "ذكي جداً";
    if (iq >= 110) return "فوق المتوسط";
    if (iq >= 90) return "متوسط";
    if (iq >= 80) return "أقل من المتوسط";
    if (iq >= 70) return "على حدود الضعف العقلي";
    if (iq >= 55) return "ضعف عقلي بسيط";
    if (iq >= 40) return "ضعف عقلي معتدل";
    if (iq >= 25) return "ضعف عقلي شديد";
    return "ضعف عقلي تام";
  };

  const steps = [
    { title: "المقدمة", icon: Info },
    { title: "بيانات المفحوص", icon: User },
    { title: "الرسم", icon: PenTool },
    { title: "التقييم الكمي", icon: ClipboardList },
    { title: "ملاحظات الفاحص", icon: MessageSquareQuote },
    { title: "التقرير النهائي", icon: FileText }
  ];

  const handleNext = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const handlePrev = () => setStep(s => Math.max(s - 1, 0));

  const toggleScore = (id: number) => {
    setScoreItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text font-sans mt-0 selection:bg-primary/20">
      <Header />
      
      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Step Indicator */}
        <div className="mb-16" dir="rtl">
          <div className="flex justify-between items-center relative">
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-natural-border -translate-y-1/2 z-0" />
            <div 
              className="absolute top-1/2 right-0 h-[2px] bg-primary -translate-y-1/2 z-0 transition-all duration-700 ease-in-out"
              style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
            />
            
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isCompleted = i < step;
              
              return (
                <div key={i} className="relative z-10 flex flex-col items-center gap-3">
                  <button
                    onClick={() => i <= step && setStep(i)}
                    disabled={i > step}
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500
                      ${isActive ? 'bg-primary text-white ring-8 ring-primary/10 scale-110 shadow-lg' : 
                        isCompleted ? 'bg-primary text-white opacity-80' : 'bg-white text-natural-light-text border-2 border-natural-border'}
                      ${i <= step ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}
                    `}
                  >
                    {isCompleted ? <Check size={24} /> : <Icon size={24} />}
                  </button>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-primary' : 'text-natural-light-text'}`}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(90,90,64,0.08)] p-8 md:p-14 min-h-[600px] border border-natural-border/50"
          >
            {step === 0 && (
              <div dir="rtl">
                <SectionTitle 
                  title="مرحباً بك في اختبار رسم الرجل" 
                  icon={Info} 
                  subtitle="أداة تقييمية للنضج العقلي والذكاء للأطفال"
                />
                <div className="prose prose-stone max-w-none text-natural-text/80 leading-relaxed space-y-8 font-light">
                  <p className="text-lg">
                    يعد اختبار رسم الرجل من الاختبارات الإسقاطية غير اللفظية الشهيرة التي تعتمد على الرسم كوسيلة لقياس القدرة العقلية. 
                    يعود الاختبار للعالمة "فلورنس جودانف" (1926) وتم تطويره لاحقاً بواسطة "هاريس".
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-10">
                    <div className="bg-natural-muted p-8 rounded-[32px] border border-natural-border/50 relative overflow-hidden group">
                      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                      <h3 className="text-secondary-foreground font-serif font-bold text-xl mb-4 flex items-center gap-3 text-primary">
                        <TrendingUp size={20} /> مزايا الاختبار
                      </h3>
                      <ul className="text-sm space-y-3 list-none pr-0">
                        {["غير لفظي: لا يعتمد على القراءة أو الكتابة.", "بسيط في التطبيق وغير مكلف.", "مناسب للأطفال من مختلف الثقافات.", "يستخدم مع ذوي الفئات الخاصة (الصم، المعاقين ذهنياً)."].map((txt, idx) => (
                           <li key={idx} className="flex gap-3 items-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                              {txt}
                           </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-primary p-8 rounded-[32px] shadow-xl shadow-primary/20 text-white relative overflow-hidden">
                      <div className="absolute -left-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                      <h3 className="font-serif font-bold text-xl mb-4 flex items-center gap-3">
                        <Calendar size={20} /> الفئة المستهدفة
                      </h3>
                      <p className="text-sm leading-relaxed opacity-90">
                        مصمم للأطفال في الفئة العمرية ما بين 5 إلى 14 سنة. 
                        يستغرق التطبيق حوالي 15 دقيقة تقريباً ويعد من أسهل الاختبارات النفسية تطبيقاً.
                      </p>
                    </div>
                  </div>

                  <div className="bg-natural-bg p-8 rounded-[32px] border border-natural-border border-dashed">
                    <h3 className="font-serif font-bold text-xl mb-4 text-natural-text">تعليمات التطبيق للطفل:</h3>
                    <p className="italic text-natural-text/90 bg-white p-6 rounded-2xl border border-natural-border shadow-sm text-lg leading-relaxed">
                      "أريدك أن ترسم لي صورة رجل كامل.. أرسم أحسن صورة تقدر تعملها، خذ وقتك كما تريد."
                    </p>
                  </div>

                  <button 
                    onClick={handleNext}
                    className="w-full mt-12 bg-primary text-white py-5 rounded-full font-bold uppercase tracking-[0.2em] text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/30 group"
                  >
                    بدء الاختبار
                    <ChevronLeft className="group-hover:-translate-x-2 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div dir="rtl">
                <SectionTitle 
                  title="بيانات المفحوص" 
                  icon={User} 
                  subtitle="يرجى إدخال البيانات بدقة لحساب العمر الزمني"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-widest text-natural-light-text mr-2">اسم الطفل</label>
                    <input 
                      type="text"
                      value={childInfo.name}
                      onChange={e => setChildInfo({...childInfo, name: e.target.value})}
                      placeholder="أدخل الاسم رباعي"
                      className="w-full p-5 bg-natural-bg border border-natural-border rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none text-natural-text"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-widest text-natural-light-text mr-2">اسم الفاحص</label>
                    <input 
                      type="text"
                      value={childInfo.examinerName}
                      onChange={e => setChildInfo({...childInfo, examinerName: e.target.value})}
                      placeholder="اسم الأخصائي"
                      className="w-full p-5 bg-natural-bg border border-natural-border rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none text-natural-text"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-widest text-natural-light-text mr-2 text-right">تاريخ الميلاد</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" size={20} />
                      <input 
                        type="date"
                        value={childInfo.birthDate}
                        onChange={e => setChildInfo({...childInfo, birthDate: e.target.value})}
                        className="w-full p-5 bg-natural-bg border border-natural-border rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none pl-12 text-natural-text"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-widest text-natural-light-text mr-2">تاريخ التطبيق</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" size={20} />
                      <input 
                        type="date"
                        value={childInfo.testDate}
                        onChange={e => setChildInfo({...childInfo, testDate: e.target.value})}
                        className="w-full p-5 bg-natural-bg border border-natural-border rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none pl-12 text-natural-text"
                      />
                    </div>
                  </div>
                </div>

                {currentAge && (
                  <div className="mt-12 p-8 bg-natural-muted rounded-[32px] flex items-center justify-between border border-natural-border shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-natural-border">
                        <TrendingUp size={28} />
                      </div>
                      <div>
                        <p className="text-[10px] text-primary font-bold uppercase tracking-[0.2em] mb-1">العمر الزمني المحسوب</p>
                        <p className="text-xl font-serif font-bold text-natural-text">
                          {currentAge.years} سنة و {currentAge.months} شهور
                        </p>
                      </div>
                    </div>
                    <div className="text-primary bg-white px-6 py-3 rounded-full font-bold shadow-sm border border-natural-border text-sm">
                      {currentAge.totalMonths} شهر
                    </div>
                  </div>
                )}

                <div className="flex gap-6 mt-14">
                  <button 
                    onClick={handlePrev}
                    className="flex-1 py-5 px-8 border-2 border-natural-border rounded-full font-bold text-xs uppercase tracking-widest hover:bg-natural-bg transition-all"
                  >
                    السابق
                  </button>
                  <button 
                    disabled={!childInfo.name || !childInfo.birthDate}
                    onClick={handleNext}
                    className="flex-[2] bg-primary text-white rounded-full font-bold text-xs uppercase tracking-widest hover:scale-[1.02] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/30"
                  >
                    التالي
                    <ChevronLeft size={18} />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div dir="rtl">
                <SectionTitle 
                  title="مساحة الرسم" 
                  icon={PenTool} 
                  subtitle="أطلب من الطفل رسم رجل كامل في المساحة أدناه"
                />
                
                <div className="relative bg-natural-bg rounded-[40px] border-2 border-dashed border-natural-border p-6 flex flex-col items-center justify-center overflow-hidden">
                  {/* Drawing Tools */}
                  <div className="w-full flex flex-wrap justify-between items-center mb-6 gap-4 px-2">
                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-[20px] border border-natural-border shadow-sm">
                      {canvasColors.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setBrushColor(color.value)}
                          className={`w-9 h-9 rounded-full border-2 transition-all hover:scale-110 active:scale-90 ${brushColor === color.value ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: color.value }}
                          title={`اختيار اللون: ${color.name}`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-2 bg-white p-2.5 rounded-[20px] border border-natural-border shadow-sm">
                      <button 
                        onClick={undo}
                        disabled={historyIndex < 0}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${historyIndex >= 0 ? 'bg-natural-bg text-primary hover:bg-natural-muted' : 'text-natural-border opacity-50 cursor-not-allowed'}`}
                        title="تراجع عن الخطوة الأخيرة (Ctrl+Z)"
                      >
                        <RotateCcw size={18} className="scale-x-[-1]" />
                      </button>
                      <button 
                        onClick={redo}
                        disabled={historyIndex >= drawingHistory.length - 1}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${historyIndex < drawingHistory.length - 1 ? 'bg-natural-bg text-primary hover:bg-natural-muted' : 'text-natural-border opacity-50 cursor-not-allowed'}`}
                        title="إعادة تطبيق الخطوة الملغاة (Ctrl+Y)"
                      >
                        <RotateCcw size={18} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-2.5 rounded-[20px] border border-natural-border shadow-sm">
                      {brushSizes.map((size) => (
                        <button
                          key={size.value}
                          onClick={() => setBrushSize(size.value)}
                          className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${brushSize === size.value ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-natural-bg text-natural-light-text hover:bg-natural-muted'}`}
                          title={`حجم الفرشاة: ${size.label}`}
                        >
                          {size.label}
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={() => {
                        const canvas = document.getElementById('test-canvas') as HTMLCanvasElement;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          ctx.clearRect(0, 0, canvas.width, canvas.height);
                          setDrawingDataUrl(null);
                          setDrawingHistory([]);
                          setHistoryIndex(-1);
                        }
                      }}
                      className="px-6 py-3 bg-white shadow-sm rounded-full text-red-500 hover:bg-red-50 transition-all border border-natural-border active:scale-95 flex items-center gap-3 text-xs font-bold uppercase tracking-widest"
                      title="مسح لوحة الرسم بالكامل والبدء من جديد"
                    >
                      <Eraser size={18} />
                      مسح
                    </button>

                    <button 
                      onClick={() => {
                        const canvas = document.getElementById('test-canvas') as HTMLCanvasElement;
                        if (!canvas) return;
                        
                        const dataUrl = canvas.toDataURL('image/png');
                        const printWin = window.open('', '_blank');
                        if (printWin) {
                          printWin.document.write(`
                            <html dir="rtl">
                              <head>
                                <title>رسم الطفل - اختبار رسم الرجل</title>
                                <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                                <style>
                                  body { 
                                    margin: 0; 
                                    display: flex; 
                                    flex-direction: column; 
                                    align-items: center; 
                                    justify-content: center; 
                                    min-height: 100vh; 
                                    font-family: 'IBM Plex Sans Arabic', sans-serif; 
                                    background: white; 
                                    color: #2d2d2a;
                                  }
                                  .container {
                                    max-width: 800px;
                                    width: 90%;
                                    text-align: center;
                                    padding: 40px;
                                    border: 2px solid #5A5A40;
                                    border-radius: 40px;
                                  }
                                  img { 
                                    max-width: 100%; 
                                    height: auto; 
                                    margin-bottom: 30px;
                                    border: 1px solid #e2e2d8;
                                    border-radius: 20px;
                                  }
                                  h1 { font-family: 'Amiri', serif; color: #5A5A40; margin-bottom: 20px; }
                                  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; text-align: right; font-size: 14px; }
                                  @media print {
                                    .container { border: none; padding: 0; }
                                  }
                                </style>
                              </head>
                              <body>
                                <div class="container">
                                  <h1>رسم الملف الشخصي - اختبار جودانف</h1>
                                  <img src="${dataUrl}" />
                                  <div class="meta">
                                    <div><strong>اسم الطفل:</strong> ${childInfo.name || '---'}</div>
                                    <div><strong>تاريخ التطبيق:</strong> ${childInfo.testDate}</div>
                                    <div><strong>الأخصائي:</strong> ${childInfo.examinerName || '---'}</div>
                                    <div><strong>العمر الزمني:</strong> ${currentAge ? `${currentAge.years} سنة و ${currentAge.months} شهر` : '---'}</div>
                                  </div>
                                </div>
                                <script>
                                  window.onload = () => {
                                    setTimeout(() => {
                                      window.print();
                                      window.close();
                                    }, 500);
                                  };
                                </script>
                              </body>
                            </html>
                          `);
                          printWin.document.close();
                        }
                      }}
                      className="px-6 py-3 bg-white shadow-sm rounded-full text-primary hover:bg-natural-muted transition-all border border-primary/30 active:scale-95 flex items-center gap-3 text-xs font-bold uppercase tracking-widest"
                      title="طباعة الرسم الحالي فقط في صفحة منفصلة"
                    >
                      <Printer size={18} />
                      طباعة الرسم
                    </button>

                    <button 
                      onClick={() => {
                        const canvas = document.getElementById('test-canvas') as HTMLCanvasElement;
                        if (canvas) {
                          const dataUrl = canvas.toDataURL('image/png');
                          const link = document.createElement('a');
                          link.download = `drawing-${childInfo.name || 'child'}-${new Date().getTime()}.png`;
                          link.href = dataUrl;
                          link.click();
                        }
                      }}
                      className="px-6 py-3 bg-white shadow-sm rounded-full text-green-600 hover:bg-green-50 transition-all border border-green-200 active:scale-95 flex items-center gap-3 text-xs font-bold uppercase tracking-widest"
                      title="حفظ الرسم كصورة PNG"
                    >
                      <Download size={18} />
                      حفظ كصورة
                    </button>
                  </div>

                  <div className="w-full aspect-[4/3] relative bg-white rounded-[32px] shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] border border-natural-border cursor-crosshair overflow-hidden">
                    <canvas 
                      id="test-canvas"
                      className="w-full h-full block"
                      style={{ touchAction: 'none' }}
                      ref={(canvas) => {
                        if (canvas) {
                          // Crucial: only set size once to avoid clearing
                          if (canvas.width === 0 || canvas.width !== canvas.offsetWidth) {
                            canvas.width = canvas.offsetWidth;
                            canvas.height = canvas.offsetHeight;
                            if (drawingDataUrl) {
                              const ctx = canvas.getContext('2d');
                              if (ctx) {
                                const img = new Image();
                                img.onload = () => ctx.drawImage(img, 0, 0);
                                img.src = drawingDataUrl;
                              }
                            }
                          }
                        }
                      }}
                      onMouseDown={(e) => {
                        const canvas = e.currentTarget;
                        const rect = canvas.getBoundingClientRect();
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return;
                        
                        // Set standard styles
                        ctx.lineWidth = brushSize;
                        ctx.lineCap = 'round';
                        ctx.lineJoin = 'round';
                        ctx.strokeStyle = brushColor;
                        
                        ctx.beginPath();
                        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
                        
                        const handleMove = (me: MouseEvent) => {
                          ctx.lineTo(me.clientX - rect.left, me.clientY - rect.top);
                          ctx.stroke();
                        };
                        const handleUp = () => {
                          saveCanvas();
                          window.removeEventListener('mousemove', handleMove);
                          window.removeEventListener('mouseup', handleUp);
                        };
                        window.addEventListener('mousemove', handleMove);
                        window.addEventListener('mouseup', handleUp);
                      }}
                      onTouchStart={(e) => {
                        const canvas = e.currentTarget;
                        const rect = canvas.getBoundingClientRect();
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return;
                        
                        const touch = e.touches[0];
                        
                        ctx.lineWidth = brushSize;
                        ctx.lineCap = 'round';
                        ctx.lineJoin = 'round';
                        ctx.strokeStyle = brushColor;
                        
                        ctx.beginPath();
                        ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
                        
                        const handleTouchMove = (te: TouchEvent) => {
                          const t = te.touches[0];
                          ctx.lineTo(t.clientX - rect.left, t.clientY - rect.top);
                          ctx.stroke();
                        };
                        const handleTouchEnd = () => {
                          saveCanvas();
                          window.removeEventListener('touchmove', handleTouchMove);
                          window.removeEventListener('touchend', handleTouchEnd);
                        };
                        window.addEventListener('touchmove', handleTouchMove);
                        window.addEventListener('touchend', handleTouchEnd);
                      }}
                    />
                  </div>
                </div>

                <div className="mt-8 flex items-center gap-5 text-sm text-natural-light-text bg-natural-muted p-6 rounded-[24px] border border-natural-border font-light">
                  <Info className="text-primary shrink-0" size={24} />
                  <p>يمكن رسم صورة الرجل هنا للتجربة أو الرسم على ورق خارجي رسمي ثم الانتقال مباشرة لمرحلة التقييم الفني بنقاط الاختبار الـ 50.</p>
                </div>

                <div className="flex gap-6 mt-14">
                  <button onClick={handlePrev} className="flex-1 py-5 border-2 border-natural-border rounded-full font-bold text-xs uppercase tracking-widest hover:bg-natural-bg transition-all">السابق</button>
                  <button onClick={handleNext} className="flex-[2] bg-primary text-white rounded-full font-bold text-xs uppercase tracking-widest hover:scale-[1.02] shadow-xl shadow-primary/30 flex items-center justify-center gap-3 transition-all">
                    بدء التقييم الفني
                    <ChevronLeft size={18} />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div dir="rtl">
                <SectionTitle 
                  title="قائمة بنود التقييم" 
                  icon={CheckCircle2} 
                  subtitle={`قم بتحليل الرسم بعناية وتحديد العناصر المتوفرة | الدرجة الحالية: ${rawScore}`}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto px-2 custom-scrollbar pb-10">
                  {SCORING_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => toggleScore(item.id)}
                      className={`
                        flex items-center gap-5 p-5 rounded-[24px] text-right transition-all border-2
                        ${scoreItems[item.id] ? 
                          'bg-natural-muted border-primary/30 text-natural-text shadow-sm ring-1 ring-primary/5' : 
                          'bg-white border-natural-border/40 text-natural-light-text hover:border-natural-border'}
                      `}
                    >
                      <div className={`
                        w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all
                        ${scoreItems[item.id] ? 
                          'bg-primary border-primary text-white scale-110 shadow-lg shadow-primary/20' : 
                          'border-natural-border bg-natural-bg'}
                      `}>
                        {scoreItems[item.id] && <Check size={16} strokeWidth={4} />}
                      </div>
                      <span className={`text-sm font-medium ${scoreItems[item.id] ? 'text-primary' : ''}`}>
                        <span className="opacity-40 ml-2 font-mono text-[10px] font-bold tracking-tighter">{item.id.toString().padStart(2, '0')}.</span>
                        {item.text}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex gap-6 mt-14 sticky bottom-0 bg-white pt-6 border-t border-natural-border">
                  <button onClick={handlePrev} className="flex-1 py-5 border-2 border-natural-border rounded-full font-bold text-xs uppercase tracking-widest">السابق</button>
                  <button onClick={handleNext} className="flex-[2] bg-primary text-white rounded-full font-bold text-xs uppercase tracking-widest hover:scale-[1.02] shadow-xl shadow-primary/30 flex items-center justify-center gap-3 transition-all">
                    بدء تدوين الملاحظات
                    <ChevronLeft size={18} />
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div dir="rtl">
                <SectionTitle 
                  title="الملاحظات الكيفية والتوصيات" 
                  icon={MessageSquareQuote} 
                  subtitle="سجل هنا انطباعاتك المهنية وتوصياتك للأسرة"
                />
                
                <div className="space-y-10">
                  <div className="space-y-4">
                    <label className="block text-sm font-bold uppercase tracking-widest text-primary mr-2">ملاحظات الفاحص التفصيلية</label>
                    <textarea 
                      value={examinerNotes}
                      onChange={(e) => setExaminerNotes(e.target.value)}
                      placeholder="صف هنا جودة رسم الطفل، سلوكه أثناء الاختبار، أي دلالات إكلينيكية لافتة..."
                      className="w-full h-48 p-6 bg-natural-bg border border-natural-border rounded-3xl focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none resize-none text-natural-text leading-relaxed shadow-inner"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-bold uppercase tracking-widest text-primary mr-2">التوصيات التربوية والنفسية</label>
                    <textarea 
                      value={recommendations}
                      onChange={(e) => setRecommendations(e.target.value)}
                      placeholder="ما هي الخطوات القادمة المناسبة لهذا الطفل؟ (مثال: تنمية مهارات بصرية، تعزيز الثقة...)"
                      className="w-full h-40 p-6 bg-natural-bg border border-natural-border rounded-3xl focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none resize-none text-natural-text leading-relaxed shadow-inner"
                    />
                  </div>
                </div>

                <div className="flex gap-6 mt-14">
                  <button onClick={handlePrev} className="flex-1 py-5 border-2 border-natural-border rounded-full font-bold text-xs uppercase tracking-widest hover:bg-natural-bg transition-all">السابق</button>
                  <button onClick={handleNext} className="flex-[2] bg-primary text-white rounded-full font-bold text-xs uppercase tracking-widest hover:scale-[1.02] shadow-xl shadow-primary/30 flex items-center justify-center gap-3 transition-all">
                    توليد التقرير النهائي
                    <ChevronLeft size={18} />
                  </button>
                </div>
              </div>
            )}

            {step === 5 && iqResult !== null && (
              <div dir="rtl" className="report-container">
                <SectionTitle 
                  title="التقرير النفسي النهائي" 
                  icon={FileText} 
                  subtitle="تحليل متكامل للقدرة العقلية بناءً على معايير جودانف"
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  {/* Results Sidebar */}
                  <div className="lg:col-span-1 space-y-8">
                    <div className="bg-primary text-white p-10 rounded-[40px] shadow-2xl shadow-primary/30 overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-natural-muted/5 rounded-full -ml-16 -mb-16 blur-2xl" />
                      <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.3em] mb-2">معامل الذكاء (IQ)</p>
                      <h3 className="text-7xl font-serif font-bold mb-6 tracking-tighter">{iqResult}</h3>
                      <div className="bg-white/15 px-6 py-3 rounded-2xl inline-block backdrop-blur-xl border border-white/20">
                        <p className="text-sm font-bold tracking-wide">{getInterpretation(iqResult)}</p>
                      </div>
                    </div>

                    <div className="bg-natural-bg border-2 border-natural-border p-8 rounded-[32px] space-y-6 shadow-sm">
                      <div className="flex justify-between items-center pb-5 border-b border-natural-border/50">
                        <span className="text-natural-light-text text-xs font-bold uppercase tracking-widest">الدرجة الخام</span>
                        <span className="font-serif font-bold text-xl text-natural-text">{rawScore}</span>
                      </div>
                      <div className="flex justify-between items-center pb-5 border-b border-natural-border/50">
                        <span className="text-natural-light-text text-xs font-bold uppercase tracking-widest">العمر العقلي</span>
                        <span className="font-serif font-bold text-xl text-primary">
                          {mentalAgeResult.years} س و {mentalAgeResult.months} ش
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-natural-light-text text-xs font-bold uppercase tracking-widest">العمر الزمني</span>
                        <span className="font-serif font-bold text-xl text-natural-text">
                          {currentAge?.years} س و {currentAge?.months} ش
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Interpretation & Details */}
                  <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-10 rounded-[40px] border-2 border-natural-border/50 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-1 h-full bg-primary/20" />
                      <h4 className="text-xl font-serif font-bold text-natural-text mb-8 flex items-center gap-4">
                        <Info size={24} className="text-primary" />
                        التحليل والتوصيات المهنية
                      </h4>
                      <div className="space-y-8 text-natural-text/90 leading-relaxed font-light">
                        <div className="bg-natural-bg p-8 rounded-[24px] border border-natural-border shadow-inner">
                          <p className="font-serif font-bold text-primary text-lg mb-3">ملخص الحالة:</p>
                          <p className="text-lg">
                            بناءً على التقييم الرقمي، حصل الطفل ({childInfo.name}) على درجة خام ({rawScore}) نقطة. 
                            تعكس هذه النتيجة نضجاً عقلياً يوازي مستوى ({mentalAgeResult.years} سنوات و {mentalAgeResult.months} أشهر).
                            تقع نسبة الذكاء ({iqResult}) ضمن النطاق المعياري لمركز ({getInterpretation(iqResult)}).
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-8">
                          <div className="p-8 bg-natural-muted rounded-[32px] border border-natural-border transition-all hover:shadow-md">
                            <h5 className="font-serif font-bold text-primary text-xl mb-8 flex items-center gap-3">
                              <TrendingUp size={24} />
                              تحليل العلاقة بين العمر الزمني والنضج العقلي
                            </h5>
                            <div className="w-full h-[350px] mt-6">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={[
                                    { name: 'العمر الزمني', value: currentAge?.totalMonths || 0, unit: 'شهر', desc: 'العمر الفعلي للطفل' },
                                    { name: 'العمر العقلي', value: (mentalAgeResult.years * 12 + mentalAgeResult.months), unit: 'شهر', desc: 'مستوى النضج الإدراكي' },
                                    { name: 'الدرجة الخام', value: rawScore, unit: 'نقطة', desc: 'مجموع بنود الرسم' }
                                  ]}
                                  margin={{ top: 20, right: 30, left: 40, bottom: 30 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e2d8" opacity={0.5} />
                                  <XAxis 
                                    dataKey="name" 
                                    axisLine={{ stroke: '#e2e2d8' }}
                                    tickLine={false} 
                                    tick={{ fill: '#7c7c72', fontSize: 13, fontWeight: '600' }}
                                    dy={10}
                                    label={{ value: 'مؤشرات التقييم', position: 'insideBottom', offset: -20, fill: '#5A5A40', fontSize: 12, fontWeight: 'bold' }}
                                  />
                                  <YAxis 
                                    axisLine={{ stroke: '#e2e2d8' }}
                                    tickLine={false} 
                                    tick={{ fill: '#7c7c72', fontSize: 11 }}
                                    label={{ value: 'القيمة (أشهر/نقاط)', angle: -90, position: 'insideLeft', offset: -20, fill: '#5A5A40', fontSize: 12, fontWeight: 'bold' }}
                                  />
                                  <Tooltip 
                                    contentStyle={{ 
                                      borderRadius: '20px', 
                                      border: '1px solid #e2e2d8', 
                                      boxShadow: '0 20px 40px rgba(90,90,64,0.12)', 
                                      direction: 'rtl',
                                      padding: '12px'
                                    }}
                                    itemStyle={{ color: '#5A5A40', fontWeight: 'bold' }}
                                    cursor={{ fill: '#f5f5f0', opacity: 0.5 }}
                                    formatter={(value: any, name: any, props: any) => [`${value} ${props.payload.unit}`, props.payload.desc]}
                                  />
                                  <Bar dataKey="value" radius={[15, 15, 0, 0]} barSize={60}>
                                    {[
                                      { color: '#7c7c72' }, // Chronological
                                      { color: '#5A5A40' }, // Mental
                                      { color: '#d16a5a' }  // Raw Score
                                    ].map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="flex justify-center gap-6 mt-8 flex-wrap">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#7c7c72]" />
                                <span className="text-[10px] font-bold text-natural-light-text uppercase tracking-widest">العمر الزمني (بالأشهر)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#5A5A40]" />
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">العمر العقلي (بالأشهر)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#d16a5a]" />
                                <span className="text-[10px] font-bold text-[#d16a5a] uppercase tracking-widest">الدرجة الخام (نقاط)</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-natural-light-text text-center mt-6 italic font-medium opacity-70">
                              * تعبر الفجوة بين العمر الزمني والعقلي عن مدى التسارع أو التأخر في النضج الإدراكي للطفل
                            </p>
                          </div>

                          <div className="p-8 bg-natural-muted rounded-[32px] border border-natural-border transition-all hover:shadow-md">
                            <h5 className="font-serif font-bold text-primary text-lg mb-4 flex items-center gap-2">
                              <MessageSquareQuote size={20} />
                              ملاحظات الفاحص التفصيلية:
                            </h5>
                            <p className="text-natural-text/100 text-base leading-relaxed whitespace-pre-wrap">
                              {examinerNotes || "لم يتم تسجيل ملاحظات إضافية."}
                            </p>
                          </div>
                          <div className="p-8 bg-natural-muted rounded-[32px] border border-natural-border transition-all hover:shadow-md">
                            <h5 className="font-serif font-bold text-primary text-lg mb-4 flex items-center gap-2">
                              <CheckCircle2 size={20} />
                              التوصيات المقترحة:
                            </h5>
                            <p className="text-natural-text/100 text-base leading-relaxed whitespace-pre-wrap">
                              {recommendations || "لم يتم تسجيل توصيات إضافية."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-6">
                      <button 
                        onClick={() => window.print()}
                        className="flex-1 bg-white border-2 border-natural-border p-5 rounded-full font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-natural-bg transition-all shadow-sm"
                      >
                        <Printer size={20} />
                        طباعة التقرير
                      </button>
                      <button 
                        onClick={() => {
                          const data = {
                            childInfo,
                            rawScore,
                            mentalAge: mentalAgeResult,
                            iq: iqResult,
                            interpretation: getInterpretation(iqResult!),
                            examinerNotes,
                            recommendations,
                            date: new Date().toISOString()
                          };
                          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `report-${childInfo.name || 'unnamed'}.json`;
                          a.click();
                        }}
                        className="flex-1 bg-primary text-white p-5 rounded-full font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-xl shadow-primary/20"
                      >
                        <Download size={20} />
                        حفظ البيانات
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-16 text-center text-natural-light-text text-[10px] font-bold uppercase tracking-[0.3em] border-t border-natural-border pt-10">
                   نظام التقييم الإكلينيكي الرقمي الموحد - مرسم.
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-16 text-center text-natural-light-text">
        <div className="w-12 h-1 bg-primary/20 mx-auto mb-8 rounded-full" />
        <p className="text-sm font-bold text-natural-text mb-6">
          إعداد وبرمجة: دكتور. أحمد حمدي عاشور الغول ـ دكتوراه في علم النفس التربوي وخبير مايكروسوفت لتكنولوجيا المعلومات
        </p>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2">© {new Date().getFullYear()} مرسم للحلول الإبداعية والتقييم النفسي</p>
        <p className="text-[10px] uppercase opacity-60">Professional Grade Clinical Assessment Environment</p>
      </footer>

      {/* Global CSS adjustments */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: var(--color-natural-bg); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-natural-border); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--color-primary); opacity: 0.5; }
        
        @media print {
          header, footer, .mb-16, button, .no-print { display: none !important; }
          main { padding: 0 !important; }
          .report-container { box-shadow: none !important; border: none !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .bg-white { background: white !important; }
          body { background: white !important; color: black !important; }
          .bg-primary { border: 2px solid black !important; color: black !important; background: transparent !important; }
          .text-white { color: black !important; }
        }
      `}</style>
    </div>
  );
}
