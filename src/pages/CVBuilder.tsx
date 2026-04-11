import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  Wrench, 
  Eye, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  Lock,
  Smartphone,
  Monitor,
  Sparkles,
  Loader2,
  Wand2,
  FileText,
  X,
  AlertTriangle,
  Tag as TagIcon
} from 'lucide-react';
import DocumentPreview from '../components/DocumentPreview';
import { useDocumentPayment } from '../lib/payment';
import { generateWithGemini } from '../lib/gemini';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useDocumentSettings } from '../hooks/useDocumentSettings';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const CVBuilder = () => {
  const [step, setStep] = useState(1);
  const [isPaid, setIsPaid] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [email, setEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const navigate = useNavigate();
  const { settings, loading: settingsLoading } = useDocumentSettings();
  const [suggestions, setSuggestions] = useState<{
    titles: string[];
    skills: { technical: string[], soft: string[] };
  }>({
    titles: [],
    skills: { technical: [], soft: [] }
  });
  
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('cb_cv_draft');
    const defaultData = {
      id: `cv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fullName: '',
      professionalTitle: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      summary: '',
      experience: [],
      education: [],
      nyscStatus: '',
      technicalSkills: [],
      softSkills: [],
      languages: ['English'],
      certifications: '',
      referenceType: 'request',
      references: [],
      includeCoverLetter: false
    };
    return saved ? { ...defaultData, ...JSON.parse(saved) } : defaultData;
  });

  // Auto-save progress
  useEffect(() => {
    const timer = setInterval(() => {
      localStorage.setItem('cb_cv_draft', JSON.stringify(formData));
    }, 30000);
    return () => clearInterval(timer);
  }, [formData]);

  // Check if already paid
  useEffect(() => {
    const paidDocs = JSON.parse(localStorage.getItem('hj_paid_docs') || '{}');
    if (formData.id && paidDocs[formData.id]?.paid) {
      setIsPaid(true);
      setPaymentRef(paidDocs[formData.id].reference);
    }
  }, [formData.id]);

  const calculatePrice = () => {
    let basePrice = settings.pricing.cv;
    if (formData.includeCoverLetter) {
      basePrice += settings.pricing.coverLetter;
    }
    
    if (!appliedPromo) return basePrice;

    if (appliedPromo.discountType === 'percentage') {
      return basePrice * (1 - appliedPromo.value / 100);
    } else {
      return Math.max(0, basePrice - appliedPromo.value);
    }
  };

  const validatePromoCode = async () => {
    if (!promoCode) return;
    setIsValidatingPromo(true);
    try {
      const q = query(
        collection(db, 'promo_codes'), 
        where('code', '==', promoCode.toUpperCase()),
        where('isActive', '==', true)
      );
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast.error('Invalid or expired promo code');
        setAppliedPromo(null);
      } else {
        const promo = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
        if (promo.appliesTo !== 'all' && promo.appliesTo !== 'cv') {
          toast.error('This promo code is not valid for CVs');
          setAppliedPromo(null);
        } else {
          setAppliedPromo(promo);
          toast.success('Promo code applied!');
        }
      }
    } catch (error) {
      console.error('Error validating promo:', error);
      toast.error('Failed to validate promo code');
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const { pay } = useDocumentPayment({
    email,
    documentType: 'cv',
    documentId: formData.id,
    amount: calculatePrice(),
    promoCode: appliedPromo?.code,
    metadata: {
      includeCoverLetter: formData.includeCoverLetter
    },
    onSuccess: (reference: string) => {
      setPaymentRef(reference);
      setIsPaid(true);
      setShowEmailModal(false);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      toast.success('Payment successful! Your CV is unlocked.');

      // PDF Generation
      const element = document.getElementById('document-preview-content');
      if (element) {
        const opt = {
          margin: [10, 10, 10, 10] as [number, number, number, number],
          filename: `${formData.fullName || 'professional'}-cv.pdf`,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
        };
        html2pdf().from(element).set(opt).save();
      }

      // Redirect after a short delay
      setTimeout(() => {
        navigate('/documents/success');
      }, 3000);
    }
  });

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  // AI Functions
  const suggestTitles = async () => {
    if (!formData.fullName) return toast.error("Enter your name first");
    setIsGenerating('titles');
    try {
      const prompt = `Suggest 5 professional job titles for a CV based on: 
      Name: ${formData.fullName}
      Location: ${formData.location || 'Nigeria'}
      
      Return ONLY a JSON array of strings. 
      Example: ["Title 1", "Title 2"]
      No markdown, no backticks, no "json" prefix.`;
      const res = await generateWithGemini(prompt);
      const cleaned = res.replace(/^json/i, '').trim();
      const titles = JSON.parse(cleaned);
      setSuggestions(prev => ({ ...prev, titles }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to suggest titles");
    } finally {
      setIsGenerating(null);
    }
  };

  const generateSummary = async () => {
    if (!formData.professionalTitle) return toast.error("Enter your professional title first");
    setIsGenerating('summary');
    try {
      const prompt = `Write a powerful 3-sentence professional CV summary for:
      Title: ${formData.professionalTitle}
      Location: ${formData.location || 'Nigeria'}
      Experience: ${formData.experience.map((e: any) => e.jobTitle).join(', ')}
      Skills: ${[...formData.technicalSkills, ...formData.softSkills].join(', ')}
      
      Start directly with the job title.
      No intro sentence. No explanation. 
      Return the 3 sentences only.`;
      const summary = await generateWithGemini(prompt);
      setFormData(prev => ({ ...prev, summary }));
      toast.success("Summary generated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate summary");
    } finally {
      setIsGenerating(null);
    }
  };

  const improveText = async (field: string, currentText: string, path?: string) => {
    if (!currentText) return;
    setIsGenerating(field);
    try {
      const prompt = `Improve this CV text to be more professional, powerful, and specific: "${currentText}". 
      Keep it concise. Start directly with the content. No intro or explanation.`;
      const improved = await generateWithGemini(prompt);
      
      if (path === 'experience') {
        const [index, subField] = field.split('.');
        updateExperience(parseInt(index), subField, improved);
      } else if (path === 'education') {
        const [index, subField] = field.split('.');
        updateEducation(parseInt(index), subField, improved);
      } else {
        setFormData(prev => ({ ...prev, [field]: improved }));
      }
      toast.success("Text improved!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to improve text");
    } finally {
      setIsGenerating(null);
    }
  };

  const generateResponsibilities = async (index: number) => {
    const exp = formData.experience[index];
    if (!exp.jobTitle) return toast.error("Enter job title first");
    setIsGenerating(`exp-${index}`);
    try {
      const prompt = `Write exactly 4 job responsibilities for 
      a ${exp.jobTitle} at ${exp.companyName || 'a company'} in Nigeria.
      
      Format: one responsibility per line.
      Start each with an action verb.
      No numbering. No bullets. No intro text.
      Return the 4 lines only.`;
      const res = await generateWithGemini(prompt);
      updateExperience(index, 'responsibilities', res);
      toast.success("Responsibilities generated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate responsibilities");
    } finally {
      setIsGenerating(null);
    }
  };

  const suggestSkills = async () => {
    if (!formData.professionalTitle) return toast.error("Enter professional title first");
    setIsGenerating('skills');
    try {
      const prompt = `Suggest 8 technical and 4 soft skills for a ${formData.professionalTitle}. 
      Return ONLY a JSON object with "technical" and "soft" arrays.
      Example: {"technical": ["Skill 1"], "soft": ["Skill 2"]}
      No markdown, no backticks, no "json" prefix.`;
      const res = await generateWithGemini(prompt);
      const cleaned = res.replace(/^json/i, '').trim();
      const skills = JSON.parse(cleaned);
      setSuggestions(prev => ({ ...prev, skills }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to suggest skills");
    } finally {
      setIsGenerating(null);
    }
  };

  const addExperience = () => {
    if (formData.experience.length >= 5) {
      toast.error('Maximum 5 experiences allowed');
      return;
    }
    setFormData((prev: any) => ({
      ...prev,
      experience: [...prev.experience, { jobTitle: '', companyName: '', location: '', startDate: '', endDate: '', responsibilities: '' }]
    }));
  };

  const updateExperience = (index: number, field: string, value: string) => {
    const newExp = [...formData.experience];
    newExp[index][field] = value;
    setFormData((prev: any) => ({ ...prev, experience: newExp }));
  };

  const removeExperience = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      experience: prev.experience.filter((_: any, i: number) => i !== index)
    }));
  };

  const addEducation = () => {
    setFormData((prev: any) => ({
      ...prev,
      education: [...prev.education, { degree: '', institutionName: '', yearGraduated: '', grade: '' }]
    }));
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const newEdu = [...formData.education];
    newEdu[index][field] = value;
    setFormData((prev: any) => ({ ...prev, education: newEdu }));
  };

  const removeEducation = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      education: prev.education.filter((_: any, i: number) => i !== index)
    }));
  };

  const handleTagsInput = (field: string, value: string) => {
    if (value.endsWith(',')) {
      const tag = value.slice(0, -1).trim();
      if (tag && !formData[field].includes(tag)) {
        setFormData((prev: any) => ({ ...prev, [field]: [...prev[field], tag] }));
      }
      return '';
    }
    return value;
  };

  const removeTag = (field: string, tag: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: prev[field].filter((t: string) => t !== tag)
    }));
  };

  const steps = [
    { id: 1, title: 'Personal Info', icon: User },
    { id: 2, title: 'Experience', icon: Briefcase },
    { id: 3, title: 'Education', icon: GraduationCap },
    { id: 4, title: 'Skills & Others', icon: Wrench },
    { id: 5, title: 'Preview & Pay', icon: Eye },
  ];

  const states = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
  ];

  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!settings.availability.masterToggle || !settings.availability.cv) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
            <FileText size={40} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">CV Builder Offline</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">This builder is currently unavailable. Please check back later.</p>
          <Link to="/documents" className="px-8 py-4 bg-primary text-white font-black rounded-2xl">Back to Documents</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-24 pb-20">
      {settings.payment.testMode && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white py-2 px-4 text-center font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2">
          <AlertTriangle size={14} />
          <span>Test Mode Enabled - No real payments will be processed</span>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-6">
        {/* Header & Progress */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Professional CV Builder</h1>
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                  <Sparkles size={10} />
                  AI Powered
                </span>
              </div>
              <p className="text-gray-500">Build your ATS-friendly CV in minutes</p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="md:hidden px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold flex items-center gap-2"
              >
                {isPreviewMode ? <Smartphone size={18} /> : <Monitor size={18} />}
                {isPreviewMode ? 'Edit Form' : 'Preview CV'}
              </button>
            </div>
          </div>

          <div className="flex justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800 -translate-y-1/2 z-0" />
            <div 
              className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-500" 
              style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
            />
            {steps.map((s) => (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  step >= s.id ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
                } ${step === s.id ? 'ring-4 ring-primary/20' : ''}`}
              >
                <s.icon size={20} />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-wider whitespace-nowrap hidden md:block">
                  {s.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Form Side */}
          <div className={`${isPreviewMode ? 'hidden' : 'block'} lg:block`}>
            <div className="bg-white dark:bg-gray-900 rounded-[32px] p-8 border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Personal Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Full Name *</label>
                        <input 
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="e.g. John Doe"
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Professional Title</label>
                          <button 
                            onClick={suggestTitles}
                            disabled={isGenerating === 'titles'}
                            className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:opacity-80 disabled:opacity-50"
                          >
                            {isGenerating === 'titles' ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                            Suggest Titles
                          </button>
                        </div>
                        <input 
                          type="text"
                          name="professionalTitle"
                          value={formData.professionalTitle}
                          onChange={handleInputChange}
                          placeholder="e.g. Software Engineer"
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none"
                        />
                        {suggestions.titles.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {suggestions.titles.map(t => (
                              <button 
                                key={t}
                                onClick={() => setFormData(prev => ({ ...prev, professionalTitle: t }))}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-[10px] font-bold rounded-md hover:bg-primary hover:text-white transition-colors"
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Email Address</label>
                        <input 
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="john@example.com"
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Phone Number</label>
                        <input 
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+234 800 000 0000"
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Location (State)</label>
                        <select 
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="">Select State</option>
                          {states.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">LinkedIn URL</label>
                        <input 
                          type="url"
                          name="linkedin"
                          value={formData.linkedin}
                          onChange={handleInputChange}
                          placeholder="linkedin.com/in/johndoe"
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Professional Summary</label>
                          <div className="flex gap-3">
                            <button 
                              onClick={generateSummary}
                              disabled={isGenerating === 'summary'}
                              className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:opacity-80 disabled:opacity-50"
                            >
                              {isGenerating === 'summary' ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                              {formData.summary ? 'Make it Stronger' : 'Generate Summary'}
                            </button>
                          </div>
                        </div>
                        <div className="relative">
                          <textarea 
                            name="summary"
                            value={formData.summary}
                            onChange={handleInputChange}
                            rows={4}
                            placeholder="Write a brief overview of your career..."
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none resize-none"
                          />
                          {formData.summary && (
                            <button 
                              onClick={() => improveText('summary', formData.summary)}
                              className="absolute bottom-3 right-3 p-2 bg-white dark:bg-gray-900 shadow-lg rounded-lg text-primary hover:scale-110 transition-transform"
                              title="Improve with AI"
                            >
                              <Wand2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white">Work Experience</h2>
                      <button 
                        onClick={addExperience}
                        className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                    </div>

                    {formData.experience.map((exp: any, i: number) => (
                      <div key={i} className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 relative group">
                        <button 
                          onClick={() => removeExperience(i)}
                          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Job Title</label>
                            <input 
                              type="text"
                              value={exp.jobTitle}
                              onChange={(e) => updateExperience(i, 'jobTitle', e.target.value)}
                              placeholder="e.g. Senior Developer"
                              className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Company Name</label>
                            <input 
                              type="text"
                              value={exp.companyName}
                              onChange={(e) => updateExperience(i, 'companyName', e.target.value)}
                              placeholder="e.g. Google Nigeria"
                              className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Start Date</label>
                            <input 
                              type="text"
                              value={exp.startDate}
                              onChange={(e) => updateExperience(i, 'startDate', e.target.value)}
                              placeholder="Jan 2020"
                              className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">End Date</label>
                            <input 
                              type="text"
                              value={exp.endDate}
                              onChange={(e) => updateExperience(i, 'endDate', e.target.value)}
                              placeholder="Present"
                              className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none"
                            />
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-gray-500 uppercase">Key Responsibilities</label>
                            <button 
                              onClick={() => generateResponsibilities(i)}
                              disabled={isGenerating === `exp-${i}`}
                              className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:opacity-80 disabled:opacity-50"
                            >
                              {isGenerating === `exp-${i}` ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                              Generate Responsibilities
                            </button>
                          </div>
                          <div className="relative">
                            <textarea 
                              value={exp.responsibilities}
                              onChange={(e) => updateExperience(i, 'responsibilities', e.target.value)}
                              rows={3}
                              placeholder="Describe your key achievements..."
                              className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none resize-none"
                            />
                            {exp.responsibilities && (
                              <button 
                                onClick={() => improveText(`${i}.responsibilities`, exp.responsibilities, 'experience')}
                                className="absolute bottom-3 right-3 p-2 bg-white dark:bg-gray-900 shadow-lg rounded-lg text-primary hover:scale-110 transition-transform"
                                title="Improve with AI"
                              >
                                <Wand2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {formData.experience.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl">
                        <p className="text-gray-400 mb-4">No work experience added yet</p>
                        <button 
                          onClick={addExperience}
                          className="px-6 py-2 bg-primary text-white font-bold rounded-xl"
                        >
                          Add Experience
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div 
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white">Education</h2>
                      <button 
                        onClick={addEducation}
                        className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                    </div>

                    {formData.education.map((edu: any, i: number) => (
                      <div key={i} className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 relative group">
                        <button 
                          onClick={() => removeEducation(i)}
                          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Degree / Certificate</label>
                            <input 
                              type="text"
                              value={edu.degree}
                              onChange={(e) => updateEducation(i, 'degree', e.target.value)}
                              placeholder="e.g. B.Sc Computer Science"
                              className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Institution Name</label>
                            <input 
                              type="text"
                              value={edu.institutionName}
                              onChange={(e) => updateEducation(i, 'institutionName', e.target.value)}
                              placeholder="e.g. University of Lagos"
                              className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Year Graduated</label>
                            <input 
                              type="text"
                              value={edu.yearGraduated}
                              onChange={(e) => updateEducation(i, 'yearGraduated', e.target.value)}
                              placeholder="e.g. 2022"
                              className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Grade (Optional)</label>
                            <input 
                              type="text"
                              value={edu.grade}
                              onChange={(e) => updateEducation(i, 'grade', e.target.value)}
                              placeholder="e.g. First Class"
                              className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">NYSC Status</label>
                      <select 
                        name="nyscStatus"
                        value={formData.nyscStatus}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none"
                      >
                        <option value="">Select Status</option>
                        <option value="Completed">Completed</option>
                        <option value="Exempted">Exempted</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Not Applicable">Not Applicable</option>
                      </select>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div 
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white">Skills & Others</h2>
                      <button 
                        onClick={suggestSkills}
                        disabled={isGenerating === 'skills'}
                        className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:opacity-80 disabled:opacity-50"
                      >
                        {isGenerating === 'skills' ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                        Suggest Skills
                      </button>
                    </div>

                    {suggestions.skills.technical.length > 0 && (
                      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 mb-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">AI Suggestions</p>
                        <div className="flex flex-wrap gap-2">
                          {[...suggestions.skills.technical, ...suggestions.skills.soft].map(s => (
                            <button 
                              key={s}
                              onClick={() => {
                                const field = suggestions.skills.technical.includes(s) ? 'technicalSkills' : 'softSkills';
                                if (!formData[field].includes(s)) {
                                  setFormData((prev: any) => ({ ...prev, [field]: [...prev[field], s] }));
                                }
                              }}
                              className="px-3 py-1 bg-white dark:bg-gray-800 text-xs font-bold rounded-full border border-gray-100 dark:border-gray-700 hover:border-primary transition-colors"
                            >
                              + {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {['technicalSkills', 'softSkills', 'languages'].map((field) => (
                      <div key={field} className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 capitalize">
                          {field.replace(/([A-Z])/g, ' $1')} (Type and press comma)
                        </label>
                        <div className="flex flex-wrap gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                          {formData[field].map((tag: string) => (
                            <span key={tag} className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full flex items-center gap-2">
                              {tag}
                              <button onClick={() => removeTag(field, tag)}>✕</button>
                            </span>
                          ))}
                          <input 
                            type="text"
                            placeholder="Add..."
                            className="bg-transparent outline-none text-sm flex-grow min-w-[100px]"
                            onKeyDown={(e: any) => {
                              if (e.key === ',') {
                                e.preventDefault();
                                const val = e.target.value.trim();
                                if (val && !formData[field].includes(val)) {
                                  setFormData((prev: any) => ({ ...prev, [field]: [...prev[field], val] }));
                                  e.target.value = '';
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    ))}

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Certifications (One per line)</label>
                      <div className="relative">
                        <textarea 
                          name="certifications"
                          value={formData.certifications}
                          onChange={handleInputChange}
                          rows={3}
                          placeholder="e.g. Google Data Analytics Professional Certificate"
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none resize-none"
                        />
                        {formData.certifications && (
                          <button 
                            onClick={() => improveText('certifications', formData.certifications)}
                            className="absolute bottom-3 right-3 p-2 bg-white dark:bg-gray-900 shadow-lg rounded-lg text-primary hover:scale-110 transition-transform"
                            title="Improve with AI"
                          >
                            <Wand2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">References</label>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="referenceType" 
                            value="request" 
                            checked={formData.referenceType === 'request'}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-primary"
                          />
                          <span className="text-sm font-medium">Available on request</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="referenceType" 
                            value="add" 
                            checked={formData.referenceType === 'add'}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-primary"
                          />
                          <span className="text-sm font-medium">Add references</span>
                        </label>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 5 && (
                  <motion.div 
                    key="step5"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">CV Ready for Preview!</h2>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">Review your professional CV on the right. Once you're satisfied, pay to unlock the full document and download as PDF.</p>
                    
                    <div className="max-w-xs mx-auto mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-800">
                      {settings.availability.coverLetter && (
                        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                              <input 
                                type="checkbox"
                                checked={formData.includeCoverLetter}
                                onChange={(e) => setFormData(prev => ({ ...prev, includeCoverLetter: e.target.checked }))}
                                className="w-6 h-6 rounded-lg border-2 border-primary/30 appearance-none checked:bg-primary checked:border-primary transition-all cursor-pointer"
                              />
                              {formData.includeCoverLetter && (
                                <CheckCircle2 size={14} className="absolute left-1.5 text-white pointer-events-none" />
                              )}
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-black text-gray-900 dark:text-white">Add Cover Letter</p>
                              <p className="text-[10px] text-gray-500 font-bold">+ ₦{settings.pricing.coverLetter.toLocaleString()}</p>
                            </div>
                          </label>
                        </div>
                      )}

                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 text-left">Price to Unlock</p>
                      <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-4xl font-black text-gray-900 dark:text-white">₦{calculatePrice().toLocaleString()}</span>
                        {appliedPromo && (
                          <span className="text-gray-400 line-through text-lg">₦{settings.pricing.cv.toLocaleString()}</span>
                        )}
                      </div>

                      {/* Promo Code Input */}
                      {!appliedPromo ? (
                        <div className="flex gap-2">
                          <div className="relative flex-grow">
                            <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input 
                              type="text"
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                              placeholder="Promo Code"
                              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary text-xs font-bold"
                            />
                          </div>
                          <button 
                            onClick={validatePromoCode}
                            disabled={isValidatingPromo || !promoCode}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs hover:bg-gray-300 transition-all disabled:opacity-50"
                          >
                            {isValidatingPromo ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
                          </button>
                        </div>
                      ) : (
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <TagIcon size={14} />
                            <span className="text-[10px] font-bold">Code {appliedPromo.code} Applied!</span>
                          </div>
                          <button 
                            onClick={() => setAppliedPromo(null)}
                            className="text-green-600 dark:text-green-400 hover:text-green-700"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => setShowEmailModal(true)}
                      className="px-12 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center gap-3 mx-auto hover:bg-blue-900 transition-all active:scale-95"
                    >
                      <Lock size={20} />
                      Unlock Full CV
                    </button>

                    {settings.payment.testMode && (
                      <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20 max-w-sm mx-auto">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Test Card Details</p>
                        <p className="text-[10px] text-amber-700 dark:text-amber-500/70 font-medium leading-relaxed">
                          Use any valid expiry and CVV with card:<br/>
                          <span className="font-mono font-bold text-amber-900 dark:text-amber-400">4081 1111 1111 1111</span>
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="mt-12 flex justify-between gap-4">
                {step > 1 && (
                  <button 
                    onClick={() => setStep(prev => prev - 1)}
                    className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl flex items-center gap-2"
                  >
                    <ChevronLeft size={20} />
                    Back
                  </button>
                )}
                {step < 5 && (
                  <button 
                    onClick={() => setStep(prev => prev + 1)}
                    className="px-8 py-3 bg-primary text-white font-bold rounded-xl flex items-center gap-2 ml-auto"
                  >
                    Next Step
                    <ChevronRight size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Preview Side */}
          <div className={`${isPreviewMode ? 'block' : 'hidden'} lg:block sticky top-24`}>
            <div className="bg-gray-200 dark:bg-gray-800 rounded-[40px] p-4 shadow-inner">
              <div className="bg-white dark:bg-gray-900 rounded-[32px] overflow-hidden">
                <DocumentPreview 
                  documentData={formData}
                  documentType="cv"
                  isPaid={isPaid && !!paymentRef}
                  paymentRef={paymentRef}
                  onPayClick={() => setShowEmailModal(true)}
                  price={calculatePrice()}
                  filename={`${formData.fullName || 'professional'}-cv`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 rounded-[32px] p-8 w-full max-w-md shadow-2xl"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone size={32} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Unlock Your CV</h3>
              <p className="text-gray-500">Enter your email to receive your document and payment receipt.</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Email Address</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <button 
                onClick={pay}
                className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30"
              >
                Proceed to Payment — ₦2,000
              </button>
              <button 
                onClick={() => setShowEmailModal(false)}
                className="w-full py-2 text-gray-400 font-bold text-sm"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CVBuilder;
