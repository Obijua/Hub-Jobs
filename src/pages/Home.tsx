import React, { useState, useEffect, useRef } from 'react';
import { Post, Category, CategoryConfig, SiteConfig, MonetizationConfig } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Calendar, 
  Briefcase, 
  TrendingUp, 
  Search, 
  GraduationCap, 
  BookOpen, 
  Ticket, 
  Building2, 
  Star,
  Clock,
  ChevronRight,
  Mail,
  Send,
  Music2,
  Facebook,
  Youtube,
  MessageCircle,
  Twitter,
  Linkedin,
  Instagram
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { getAllPosts, subscribe } from '../lib/posts';
import { cn } from '../lib/utils';
import { collection, query, orderBy, limit, onSnapshot, where, doc, getDocs, addDoc, serverTimestamp, startAfter } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { AdSlot } from '../components/ads/AdSlot';
import { toast } from 'sonner';
import { sendWelcomeEmail } from '../lib/email';
import { trackEvent } from '../lib/analytics';
import AdUnit from '../components/AdUnit';

import { PostCard } from '../components/PostCard';
import { Sidebar } from '../components/Sidebar';
import { Sparkles, X as CloseIcon, FileText } from 'lucide-react';

const MobileDocPromo = React.forwardRef<HTMLDivElement, { prices: any }>(({ prices }, ref) => (
  <div ref={ref} className="lg:hidden my-6 p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl text-white shadow-lg">
    <div className="flex items-center space-x-2 mb-2">
      <Sparkles className="h-3 w-3 text-yellow-200" />
      <span className="text-[9px] font-black uppercase tracking-widest">Premium Tools</span>
    </div>
    <h3 className="text-base font-black mb-1">Professional Documents</h3>
    <p className="text-amber-50 text-[10px] mb-3 opacity-90">Get hired faster with expert CVs and Plans.</p>
    <div className="grid grid-cols-2 gap-2 mb-3">
      <div className="p-1.5 bg-white/10 rounded-lg text-center">
        <div className="text-[9px] opacity-80">CV</div>
        <div className="font-black text-xs">₦{prices?.cvPrice || '1,500'}</div>
      </div>
      <div className="p-1.5 bg-white/10 rounded-lg text-center">
        <div className="text-[9px] opacity-80">Plan</div>
        <div className="font-black text-xs">₦{prices?.planPrice || '5,000'}</div>
      </div>
    </div>
    <Link to="/documents" className="block w-full bg-white text-amber-600 text-center font-black py-2.5 rounded-xl text-xs">
      Build My Document ✨
    </Link>
  </div>
));

const MobilePopup = ({ prices }: { prices: any }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const hasSeen = sessionStorage.getItem('mobile_doc_popup_seen');
    if (hasSeen) return;

    const handleScroll = () => {
      if (window.scrollY > 600 && !isVisible && !isDismissed) {
        setIsVisible(true);
        sessionStorage.setItem('mobile_doc_popup_seen', 'true');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isVisible, isDismissed]);

  if (!isVisible || isDismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-2 lg:hidden">
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        className="bg-white rounded-t-xl shadow-[0_-10px_40px_-12px_rgba(0,0,0,0.3)] p-4 relative"
      >
        {/* Drag Handle */}
        <div className="w-8 h-1 bg-gray-200 rounded-full mx-auto mb-4"></div>
        
        <button 
          onClick={() => setIsDismissed(true)}
          className="absolute top-3 right-3 p-1.5 bg-gray-50 rounded-full text-gray-400"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-amber-50 rounded-xl">
            <FileText className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900">Need a Professional CV?</h3>
            <p className="text-xs text-gray-500">Stand out from the crowd today!</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-2 bg-gray-50 rounded-xl text-center">
            <div className="text-[9px] text-gray-400 font-bold uppercase">CV</div>
            <div className="font-black text-primary text-sm">₦{prices?.cvPrice || '1,500'}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded-xl text-center">
            <div className="text-[9px] text-gray-400 font-bold uppercase">Plan</div>
            <div className="font-black text-primary text-sm">₦{prices?.planPrice || '5,000'}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded-xl text-center">
            <div className="text-[9px] text-gray-400 font-bold uppercase">Bundle</div>
            <div className="font-black text-primary text-sm">₦{prices?.bundlePrice || '7,500'}</div>
          </div>
        </div>

        <Link 
          to="/documents"
          className="w-full bg-primary text-white font-black py-3 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-primary/20 text-sm"
        >
          <span>Build My Document ✨</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </div>
  );
};

import InArticleAd from '../components/InArticleAd';

const SkeletonCard = () => (
  <div className="rounded-2xl p-3.5 md:p-5 border border-gray-100 bg-white space-y-2.5 md:space-y-3 animate-pulse">
    <div className="h-3 md:h-4 bg-gray-100 rounded-full w-16"/>
    <div className="h-4 md:h-6 bg-gray-100 rounded-full w-full"/>
    <div className="h-4 md:h-6 bg-gray-100 rounded-full w-3/4"/>
    <div className="space-y-1.5 md:space-y-2">
      <div className="h-2.5 md:h-3 bg-gray-100 rounded-full"/>
      <div className="h-2.5 md:h-3 bg-gray-100 rounded-full w-4/5"/>
      <div className="h-2.5 md:h-3 bg-gray-100 rounded-full w-3/5"/>
    </div>
    <div className="h-8 md:h-10 bg-gray-100 rounded-xl"/>
  </div>
);

export const Home = () => {
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [monetization, setMonetization] = useState<MonetizationConfig | null>(null);
  const [docPrices, setDocPrices] = useState<any>(null);
  const navigate = useNavigate();
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch doc prices
    const unsubDocs = onSnapshot(doc(db, 'settings', 'documents'), (doc) => {
      if (doc.exists()) setDocPrices(doc.data());
    });

    // Fetch monetization config
    const unsubMonetization = onSnapshot(doc(db, 'settings', 'monetization'), (doc) => {
      if (doc.exists()) setMonetization(doc.data() as MonetizationConfig);
    });

    // Fetch active categories
    const catQuery = query(
      collection(db, 'categories'), 
      where('isActive', '==', true),
      orderBy('displayOrder', 'asc')
    );
    const unsubCategories = onSnapshot(catQuery, (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryConfig)));
    });

    // Fetch category counts
    const fetchCounts = async () => {
      const counts: Record<string, number> = {};
      const postsSnap = await getDocs(query(collection(db, 'posts'), where('isActive', '==', true)));
      postsSnap.docs.forEach(doc => {
        const cat = doc.data().category;
        counts[cat] = (counts[cat] || 0) + 1;
      });
      setCategoryCounts(counts);
    };
    fetchCounts();

    // Fetch site config
    const unsubSite = onSnapshot(doc(db, 'settings', 'siteConfig'), (doc) => {
      if (doc.exists()) setSiteConfig(doc.data() as SiteConfig);
    });

    // Initial fetch for posts
    const initialQuery = query(
      collection(db, 'posts'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(12)
    );

    const unsubPosts = onSnapshot(initialQuery, (snap) => {
      const posts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      setLatestPosts(posts);
      setLastDoc(snap.docs[snap.docs.length - 1]);
      setHasMore(snap.docs.length === 12);
      setLoading(false);
    });

    // Featured posts
    const featuredQuery = query(
      collection(db, 'posts'),
      where('isActive', '==', true),
      where('isFeatured', '==', true),
      orderBy('createdAt', 'desc'),
      limit(6)
    );
    const unsubFeatured = onSnapshot(featuredQuery, (snap) => {
      setFeaturedPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
    });

    return () => {
      unsubCategories();
      unsubSite();
      unsubDocs();
      unsubMonetization();
      unsubPosts();
      unsubFeatured();
    };
  }, []);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, lastDoc]);

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextQuery = query(
        collection(db, 'posts'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(12)
      );
      const snap = await getDocs(nextQuery);
      const newPosts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      setLatestPosts(prev => [...prev, ...newPosts]);
      setLastDoc(snap.docs[snap.docs.length - 1]);
      setHasMore(snap.docs.length === 12);
    } catch (e) {
      console.error('Load more error:', e);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/blog?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="h-64 bg-primary/10 animate-pulse mb-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <div className="grid grid-cols-2 gap-2.5 md:gap-4 px-3 lg:px-0">
                {Array.from({ length: 12 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div className="h-64 bg-white rounded-2xl animate-pulse border border-gray-100" />
              <div className="h-40 bg-white rounded-2xl animate-pulse border border-gray-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isJobCategory = (category: string): boolean => {
    if (!category) return false;
    const cat = category.toLowerCase().trim();
    return (
      cat === 'job' ||
      cat === 'jobs' ||
      cat === 'internship' ||
      cat === 'internships' ||
      cat.includes('job') ||
      cat.includes('internship') ||
      cat.includes('vacancy') ||
      cat.includes('vacancies') ||
      cat.includes('hiring') ||
      cat.includes('remote-job') ||
      cat.includes('career')
    );
  };

  const jobPosts = latestPosts.filter(p => 
    isJobCategory(p.category)
  );
  const otherPosts = latestPosts.filter(p => 
    !isJobCategory(p.category)
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* 1. COMPACT HERO */}
      <section 
        className="relative pt-12 pb-16 overflow-hidden"
        style={{ 
          backgroundColor: siteConfig?.heroBgColor || '#1E3A8A',
          color: siteConfig?.heroTextColor || '#ffffff'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-5xl font-black tracking-tight mb-4"
            >
              {siteConfig?.heroHeadline || 'Find Your Next Opportunity'}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-base opacity-90"
            >
              {siteConfig?.heroSubtitle || 'Browse thousands of jobs, scholarships, and courses.'}
            </motion.p>
          </div>

          {/* Integrated Search */}
          <motion.form 
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto relative mb-8"
          >
            <div className="flex items-center bg-white rounded-2xl shadow-xl p-1.5">
              <div className="flex-grow relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs, courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 text-gray-900 bg-transparent outline-none text-lg font-medium"
                />
              </div>
              <button 
                type="submit"
                className="bg-primary text-white px-8 py-3.5 rounded-xl font-black hover:bg-blue-900 transition-all hidden sm:block"
              >
                Search
              </button>
            </div>
          </motion.form>

          {/* Category Pills with Counts */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat, i) => (
              <motion.button
                key={cat.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                onClick={() => navigate(`/category/${cat.slug}`)}
                className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-bold hover:bg-accent hover:text-primary transition-all flex items-center gap-2"
              >
                {cat.name}
                {categoryCounts[cat.slug] > 0 && (
                  <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-black">
                    {categoryCounts[cat.slug]}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. MAIN CONTENT AREA - TWO COLUMNS DESKTOP */}
      <div className="lg:flex lg:gap-6 lg:max-w-7xl lg:mx-auto lg:px-6">
        
        {/* Main content — two column cards */}
        <div className="flex-1 min-w-0">
          
          {/* HERO AD SLOT */}
          <div className="px-4 sm:px-6 lg:px-0 py-6">
            <AdSlot zone="homepage-hero-bottom" />
          </div>

          {/* TWO INDEPENDENT COLUMNS */}
          <div className="flex gap-2.5 px-3 py-4 
            md:gap-4 md:px-6 md:py-6 
            lg:gap-5 lg:px-0 lg:py-8
            items-start">

            {/* LEFT COLUMN — Courses & Opportunities */}
            <div className="flex-1 flex flex-col gap-2.5 
              md:gap-4 min-w-0">
              
              {/* Column header */}
              <div className="flex items-center gap-1.5 px-1">
                <span className="text-[10px] md:text-xs 
                  font-black text-gray-400 uppercase 
                  tracking-widest">
                  📚 Courses & More
                </span>
              </div>

              {/* Cards */}
              {otherPosts.length > 0 ? (
                otherPosts.map((post, i) => (
                  <div key={post.id}>
                    <PostCard
                      post={post}
                      featured={i === 0 || post.isFeatured}
                    />
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed 
                  border-gray-200 p-6 text-center">
                  <p className="text-gray-400 text-xs">
                    No courses posted yet
                  </p>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN — Jobs */}
            <div className="flex-1 flex flex-col gap-2.5 
              md:gap-4 min-w-0">

              {/* Column header */}
              <div className="flex items-center gap-1.5 px-1">
                <span className="text-[10px] md:text-xs 
                  font-black text-gray-400 uppercase 
                  tracking-widest">
                  💼 Jobs
                </span>
              </div>

              {/* Cards */}
              {jobPosts.length > 0 ? (
                jobPosts.map((post, i) => (
                  <div key={post.id}>
                    <PostCard
                      post={post}
                      featured={i === 1 || post.isFeatured}
                    />
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed 
                  border-gray-200 p-6 text-center">
                  <p className="text-gray-400 text-xs">
                    No jobs posted yet
                  </p>
                </div>
              )}

              {/* Ad after every 4 job cards */}
              {jobPosts.length > 4 && 
               monetization?.masterSwitch && (
                <div className="mt-2">
                  <InArticleAd position={4} />
                </div>
              )}
            </div>
          </div>

          {/* INFINITE SCROLL LOADER */}
          <div ref={loaderRef} className="py-10 flex justify-center">
            {loadingMore && (
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            )}
            {!hasMore && latestPosts.length > 0 && (
              <p className="text-gray-400 text-xs font-medium italic">You've reached the end of the feed ✨</p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: SIDEBAR (Desktop only) */}
        <div className="hidden lg:block w-72 xl:w-80 flex-shrink-0 py-6">
          <Sidebar />
        </div>
      </div>

      {/* MOBILE POPUP */}
      <MobilePopup prices={docPrices} />
    </div>
  );
};
