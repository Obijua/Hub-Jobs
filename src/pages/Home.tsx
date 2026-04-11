
/*
import { useState, useEffect, Fragment } from 'react';
import { Post, Category, CategoryConfig, SiteConfig } from '../types';
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
import { collection, query, orderBy, limit, onSnapshot, where, doc, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { AdSlot } from '../components/ads/AdSlot';
import { toast } from 'sonner';
import { sendWelcomeEmail } from '../lib/email';
import { trackEvent } from '../lib/analytics';
import AdUnit from '../components/AdUnit';

const getSnippet = (html: string): string => {
  if (!html) return '';
  return html
    .replace(/<\/?(h[1-6]|p|div|li|br|tr)[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
};

import { Sidebar } from '../components/Sidebar';
import { Sparkles, X as CloseIcon, FileText } from 'lucide-react';

const MobileDocPromo = ({ prices }: { prices: any }) => (
  <div className="lg:hidden my-6 p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl text-white shadow-lg">
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
);

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
        {/* Drag Handle *}
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

export const Home = () => {
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [docPrices, setDocPrices] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch doc prices
    const unsubDocs = onSnapshot(doc(db, 'settings', 'documents'), (doc) => {
      if (doc.exists()) setDocPrices(doc.data());
    });
    // Fetch active categories
    const catQuery = query(
      collection(db, 'categories'), 
      where('isActive', '==', true),
      orderBy('displayOrder', 'asc')
    );
    const unsubCategories = onSnapshot(catQuery, (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryConfig)));
    }, (error) => {
      console.error('Error fetching categories in home:', error);
    });

    // Fetch site config
    const unsubSite = onSnapshot(doc(db, 'settings', 'siteConfig'), (doc) => {
      if (doc.exists()) {
        setSiteConfig(doc.data() as SiteConfig);
      }
    }, (error) => {
      console.error('Error fetching site config in home:', error);
    });

    // Real-time listener for featured posts
    const featuredQuery = query(
      collection(db, 'posts'),
      where('isActive', '==', true),
      where('isFeatured', '==', true),
      orderBy('createdAt', 'desc'),
      limit(6)
    );

    const unsubscribeFeatured = onSnapshot(featuredQuery, (snapshot) => {
      setFeaturedPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
    });

    // Real-time listener for latest posts
    const latestQuery = query(
      collection(db, 'posts'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribeLatest = onSnapshot(latestQuery, (snapshot) => {
      setLatestPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
      setLoading(false);
    });

    return () => {
      unsubscribeFeatured();
      unsubscribeLatest();
      unsubCategories();
      unsubSite();
      unsubDocs();
    };
  }, []);

  const categoryIcons: any = {
    Briefcase: Briefcase,
    GraduationCap: GraduationCap,
    BookOpen: BookOpen,
    Ticket: Ticket,
    Building2: Building2,
    Star: Star,
    TrendingUp: TrendingUp,
    Clock: Clock,
    Music2: Music2,
    Facebook: Facebook,
    Youtube: Youtube,
    MessageCircle: MessageCircle,
    Twitter: Twitter,
    Linkedin: Linkedin,
    Instagram: Instagram
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/blog?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSubmitting(true);
    try {
      // Check for duplicate
      const q = query(
        collection(db, 'subscribers'),
        where('email', '==', email.toLowerCase())
      );
      const existing = await getDocs(q);
      if (!existing.empty) {
        toast.info('You are already subscribed! 🎉');
        setSubscribed(true);
        return;
      }
      // Save to Firestore
      await addDoc(collection(db, 'subscribers'), {
        email: email.toLowerCase(),
        subscribedAt: serverTimestamp(),
        source: 'homepage_sidebar',
      });
      // Send welcome email
      await sendWelcomeEmail(email);
      trackEvent('Newsletter', 'subscribe');
      toast.success(
        '🎉 Subscribed! Check your inbox for a welcome email.'
      );
      setSubscribed(true);
      setEmail('');
    } catch (err: any) {
      toast.error('Failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-20 pb-20">
      {/* 1. HERO SECTION *}
      <section 
        className="relative pt-20 pb-24 overflow-hidden transition-colors"
        style={{ 
          backgroundColor: siteConfig?.heroBgColor || '#1E3A8A',
          color: siteConfig?.heroTextColor || '#ffffff'
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {siteConfig?.showHeroText && (
            <div className="mb-12">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight"
              >
                {siteConfig?.heroHeadline || siteConfig?.siteName || 'Your Hub for Jobs & Opportunities'}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto"
              >
                {siteConfig?.heroSubtitle || siteConfig?.metaDescription}
              </motion.p>
            </div>
          )}
          
          {/* Search Bar *}
          <motion.form 
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto relative mb-12"
          >
            <div className="flex p-2 bg-white rounded-3xl shadow-2xl">
              <div className="flex-grow relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs, scholarships, courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-4 py-5 text-gray-900 bg-transparent outline-none text-xl font-medium"
                />
              </div>
              <button 
                type="submit"
                className="bg-primary text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-blue-900 transition-all hidden sm:block"
              >
                Search
              </button>
            </div>
          </motion.form>

          {/* Category Pills *}
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((cat, i) => (
              <motion.button
                key={cat.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                onClick={() => navigate(`/category/${cat.slug}`)}
                className="px-6 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-bold hover:bg-accent hover:text-primary transition-all"
              >
                {cat.name}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdUnit slot="homepage_hero" />
      </div>

      <AdSlot zone="homepage-hero-bottom" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" />

      {/* 2. FEATURED OPPORTUNITIES *}
      {((siteConfig?.showFeaturedOnHome) || (auth.currentUser)) && featuredPosts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
              <Star className="h-6 w-6 text-accent mr-2 fill-accent" />
              Featured Opportunities
              {!siteConfig?.showFeaturedOnHome && auth.currentUser && (
                <span className="ml-3 text-[10px] bg-amber-100 text-amber-600 px-2 py-1 rounded-full font-bold uppercase tracking-widest">Admin Preview (Hidden for Public)</span>
              )}
            </h2>
            <Link to="/blog" className="text-primary font-bold hover:underline hidden sm:flex items-center">
              View all <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          {/* Horizontal Scroll on Mobile, Grid on Desktop *}
          <div className="flex overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide md:grid md:grid-cols-3 md:gap-8 md:overflow-visible">
            {featuredPosts.map((post, index) => (
              <Fragment key={post.id}>
                <div className="min-w-[300px] mr-6 md:mr-0 md:min-w-0">
                  <FeaturedCard post={post} />
                </div>
                {(index + 1) % 2 === 0 && (
                  <div className="min-w-[300px] mr-6 md:mr-0 md:min-w-0 md:col-span-full">
                    <AdUnit slot={`homepage_featured_${Math.floor(index / 2)}`} />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </section>
      )}

      <AdSlot zone="homepage-mid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" />

      {/* 4. LATEST POSTS *}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content: Latest Posts *}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {latestPosts.map((post, index) => (
                <Fragment key={post.id}>
                  <LatestPostItem post={post} />
                  
                  {/* Mobile Doc Promo after every 3rd post *}
                  {(index + 1) % 3 === 0 && (
                    <MobileDocPromo prices={docPrices} />
                  )}

                  {(index + 1) % 2 === 0 && (
                    <div className="py-4">
                      <AdUnit slot={`homepage_feed_${Math.floor(index / 2)}`} />
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link 
                to="/blog" 
                className="inline-flex items-center px-4 py-1.5 bg-gray-100 text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary hover:text-white transition-all"
              >
                Load More Opportunities
              </Link>
            </div>
          </div>

          {/* Sidebar *}
          <div className="hidden lg:block">
            <Sidebar />
          </div>
        </div>
      </section>

      {/* Mobile Bottom Sheet Popup *}
      <MobilePopup prices={docPrices} />
    </div>
  );
};

const FeaturedCard = ({ post }: { post: Post }) => {
  const isAdmin = auth.currentUser?.email === 'clementegrinya@gmail.com';

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 h-full flex flex-col"
    >
      <Link to={`/post/${post.slug}`} className="block flex-grow">
        {/* Image — only if thumbnail exists *}
        {post.thumbnail && (
          <div className="w-full h-40 overflow-hidden rounded-t-2xl relative">
            <img
              src={post.thumbnail}
              alt={post.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.style.display = 'none';
              }}
            />
            <div className="absolute top-3 left-3">
              <span className="bg-accent text-primary text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                {post.category.replace('-', ' ')}
              </span>
            </div>
          </div>
        )}
        
        {/* Text content *}
        <div className="p-4">
          {!post.thumbnail && (
            <div className="mb-3">
              <span className="bg-blue-50 text-primary text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {post.category.replace('-', ' ')}
              </span>
            </div>
          )}
          <h3 className="font-black text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">
            {post.title}
          </h3>

          {/* Snippet only when no thumbnail *}
          {!post.thumbnail && post.description && (
            <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2 leading-relaxed">
              {getSnippet(post.description)}
              {post.description?.length > 120 ? '...' : ''}
            </p>
          )}
          
          <div className="mt-4 flex items-center justify-between text-[10px] text-gray-500">
            {post.deadline && (
              <span className="flex items-center text-red-600 font-semibold">
                <Clock className="h-3 w-3 mr-1" />
                {format(post.deadline.toDate(), 'MMM dd')}
              </span>
            )}
            {isAdmin && (
              <span className="flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                {post.views || 0} views
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const LatestPostItem = ({ post }: { post: Post }) => {
  const isAdmin = auth.currentUser?.email === 'clementegrinya@gmail.com';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative"
    >
      <Link 
        to={`/post/${post.slug}`}
        className="flex gap-3 items-start p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group bg-white shadow-sm"
      >
        {/* Thumbnail — left side, only if exists *}
        {post.thumbnail && (
          <div className="w-20 h-16 flex-shrink-0 overflow-hidden rounded-xl">
            <img
              src={post.thumbnail}
              alt={post.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Text — right side, full width if no image *}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
              {post.category.replace('-', ' ')}
            </span>
            <span className="text-[10px] text-gray-400 flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {post.createdAt?.toDate ? format(post.createdAt.toDate(), 'MMM dd, yyyy') : 'Recently'}
            </span>
          </div>

          <h3 className="font-black text-gray-900 dark:text-white text-sm line-clamp-2 leading-snug mb-1">
            {post.title}
          </h3>

          {/* Snippet only when no thumbnail *}
          {!post.thumbnail && post.description && (
            <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2 leading-relaxed">
              {getSnippet(post.description)}
              {post.description?.length > 120 ? '...' : ''}
            </p>
          )}

          <div className="flex items-center text-[10px] text-gray-500 space-x-4 mt-2">
            {isAdmin && (
              <span className="flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                {post.views || 0} views
              </span>
            )}
            {post.deadline && (
              <span className="flex items-center text-red-500 font-semibold">
                <Clock className="h-3 w-3 mr-1" />
                {format(post.deadline.toDate(), 'MMM dd')}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

*/











import React, { useState, useEffect, Fragment } from 'react';
import { Post, Category, CategoryConfig, SiteConfig } from '../types';
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
import { collection, query, orderBy, limit, onSnapshot, where, doc, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { AdSlot } from '../components/ads/AdSlot';
import { toast } from 'sonner';
import { sendWelcomeEmail } from '../lib/email';
import { trackEvent } from '../lib/analytics';
import AdUnit from '../components/AdUnit';

const getSnippet = (html: string): string => {
  if (!html) return '';
  return html
    .replace(/<\/?(h[1-6]|p|div|li|br|tr)[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
};

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

export const Home = () => {
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [docPrices, setDocPrices] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch doc prices
    const unsubDocs = onSnapshot(doc(db, 'settings', 'documents'), (doc) => {
      if (doc.exists()) setDocPrices(doc.data());
    });
    // Fetch active categories
    const catQuery = query(
      collection(db, 'categories'), 
      where('isActive', '==', true),
      orderBy('displayOrder', 'asc')
    );
    const unsubCategories = onSnapshot(catQuery, (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryConfig)));
    }, (error) => {
      console.error('Error fetching categories in home:', error);
    });

    // Fetch site config
    const unsubSite = onSnapshot(doc(db, 'settings', 'siteConfig'), (doc) => {
      if (doc.exists()) {
        setSiteConfig(doc.data() as SiteConfig);
      }
    }, (error) => {
      console.error('Error fetching site config in home:', error);
    });

    // Real-time listener for featured posts
    const featuredQuery = query(
      collection(db, 'posts'),
      where('isActive', '==', true),
      where('isFeatured', '==', true),
      orderBy('createdAt', 'desc'),
      limit(6)
    );

    const unsubscribeFeatured = onSnapshot(featuredQuery, (snapshot) => {
      setFeaturedPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
    });

    // Real-time listener for latest posts
    const latestQuery = query(
      collection(db, 'posts'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribeLatest = onSnapshot(latestQuery, (snapshot) => {
      setLatestPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
      setLoading(false);
    });

    return () => {
      unsubscribeFeatured();
      unsubscribeLatest();
      unsubCategories();
      unsubSite();
      unsubDocs();
    };
  }, []);

  const categoryIcons: any = {
    Briefcase: Briefcase,
    GraduationCap: GraduationCap,
    BookOpen: BookOpen,
    Ticket: Ticket,
    Building2: Building2,
    Star: Star,
    TrendingUp: TrendingUp,
    Clock: Clock,
    Music2: Music2,
    Facebook: Facebook,
    Youtube: Youtube,
    MessageCircle: MessageCircle,
    Twitter: Twitter,
    Linkedin: Linkedin,
    Instagram: Instagram
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/blog?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSubmitting(true);
    try {
      // Check for duplicate
      const q = query(
        collection(db, 'subscribers'),
        where('email', '==', email.toLowerCase())
      );
      const existing = await getDocs(q);
      if (!existing.empty) {
        toast.info('You are already subscribed! 🎉');
        setSubscribed(true);
        return;
      }
      // Save to Firestore
      await addDoc(collection(db, 'subscribers'), {
        email: email.toLowerCase(),
        subscribedAt: serverTimestamp(),
        source: 'homepage_sidebar',
      });
      // Send welcome email
      await sendWelcomeEmail(email);
      trackEvent('Newsletter', 'subscribe');
      toast.success(
        '🎉 Subscribed! Check your inbox for a welcome email.'
      );
      setSubscribed(true);
      setEmail('');
    } catch (err: any) {
      toast.error('Failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-20 pb-20">
      {/* 1. HERO SECTION */}
      <section 
        className="relative pt-20 pb-24 overflow-hidden transition-colors"
        style={{ 
          backgroundColor: siteConfig?.heroBgColor || '#1E3A8A',
          color: siteConfig?.heroTextColor || '#ffffff'
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {siteConfig?.showHeroText && (
            <div className="mb-12">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight"
              >
                {siteConfig?.heroHeadline || siteConfig?.siteName || 'Your Hub for Jobs & Opportunities'}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto"
              >
                {siteConfig?.heroSubtitle || siteConfig?.metaDescription}
              </motion.p>
            </div>
          )}
          
          {/* Search Bar */}
          <motion.form 
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto relative mb-12"
          >
            <div className="flex p-2 bg-white rounded-3xl shadow-2xl">
              <div className="flex-grow relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs, scholarships, courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-4 py-5 text-gray-900 bg-transparent outline-none text-xl font-medium"
                />
              </div>
              <button 
                type="submit"
                className="bg-primary text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-blue-900 transition-all hidden sm:block"
              >
                Search
              </button>
            </div>
          </motion.form>

          {/* Category Pills */}
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((cat, i) => (
              <motion.button
                key={cat.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                onClick={() => navigate(`/category/${cat.slug}`)}
                className="px-6 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-bold hover:bg-accent hover:text-primary transition-all"
              >
                {cat.name}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdUnit slot="homepage_hero" />
      </div>

      <AdSlot zone="homepage-hero-bottom" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" />

      {/* 2. FEATURED OPPORTUNITIES */}
      {((siteConfig?.showFeaturedOnHome) || (auth.currentUser)) && featuredPosts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
              <Star className="h-6 w-6 text-accent mr-2 fill-accent" />
              Featured Opportunities
              {!siteConfig?.showFeaturedOnHome && auth.currentUser && (
                <span className="ml-3 text-[10px] bg-amber-100 text-amber-600 px-2 py-1 rounded-full font-bold uppercase tracking-widest">Admin Preview (Hidden for Public)</span>
              )}
            </h2>
            <Link to="/blog" className="text-primary font-bold hover:underline hidden sm:flex items-center">
              View all <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          {/* Horizontal Scroll on Mobile, Grid on Desktop */}
          <div className="flex overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide md:grid md:grid-cols-3 md:gap-8 md:overflow-visible">
            {featuredPosts.map((post, index) => (
              <Fragment key={post.id}>
                <div className="min-w-[300px] mr-6 md:mr-0 md:min-w-0">
                  <FeaturedCard post={post} />
                </div>
                {(index + 1) % 2 === 0 && (
                  <div className="min-w-[300px] mr-6 md:mr-0 md:min-w-0 md:col-span-full">
                    <AdUnit slot={`homepage_featured_${Math.floor(index / 2)}`} />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </section>
      )}

      <AdSlot zone="homepage-mid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" />

      {/* 4. LATEST POSTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content: Latest Posts */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {latestPosts.map((post, index) => (
                <Fragment key={post.id}>
                  <LatestPostItem post={post} />
                  
                  {/* Mobile Doc Promo after every 3rd post */}
                  {(index + 1) % 3 === 0 && (
                    <MobileDocPromo prices={docPrices} />
                  )}

                  {(index + 1) % 2 === 0 && (
                    <div className="py-4">
                      <AdUnit slot={`homepage_feed_${Math.floor(index / 2)}`} />
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link 
                to="/blog" 
                className="inline-flex items-center px-4 py-1.5 bg-gray-100 text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary hover:text-white transition-all"
              >
                Load More Opportunities
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block">
            <Sidebar />
          </div>
        </div>
      </section>

      {/* Mobile Bottom Sheet Popup */}
      <MobilePopup prices={docPrices} />
    </div>
  );
};

const FeaturedCard = ({ post }: { post: Post }) => {
  const isAdmin = auth.currentUser?.email === 'clementegrinya@gmail.com';

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 h-full flex flex-col"
    >
      <Link to={`/post/${post.slug}`} className="block flex-grow">
        {/* Image — only if thumbnail exists */}
        {post.thumbnail && (
          <div className="w-full h-40 overflow-hidden rounded-t-2xl relative">
            <img
              src={post.thumbnail}
              alt={post.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.style.display = 'none';
              }}
            />
            <div className="absolute top-3 left-3">
              <span className="bg-accent text-primary text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                {post.category.replace('-', ' ')}
              </span>
            </div>
          </div>
        )}
        
        {/* Text content */}
        <div className="p-4">
          {!post.thumbnail && (
            <div className="mb-3">
              <span className="bg-blue-50 text-primary text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {post.category.replace('-', ' ')}
              </span>
            </div>
          )}
          <h3 className="font-black text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">
            {post.title}
          </h3>

          {/* Snippet only when no thumbnail */}
          {!post.thumbnail && post.description && (
            <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2 leading-relaxed">
              {getSnippet(post.description)}
              {post.description?.length > 120 ? '...' : ''}
            </p>
          )}
          
          <div className="mt-4 flex items-center justify-between text-[10px] text-gray-500">
            {post.deadline && (
              <span className="flex items-center text-red-600 font-semibold">
                <Clock className="h-3 w-3 mr-1" />
                {format(post.deadline.toDate(), 'MMM dd')}
              </span>
            )}
            {isAdmin && (
              <span className="flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                {post.views || 0} views
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const LatestPostItem = ({ post }: { post: Post }) => {
  const isAdmin = auth.currentUser?.email === 'clementegrinya@gmail.com';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative"
    >
      <Link 
        to={`/post/${post.slug}`}
        className="flex gap-3 items-start p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group bg-white shadow-sm"
      >
        {/* Thumbnail — left side, only if exists */}
        {post.thumbnail && (
          <div className="w-20 h-16 flex-shrink-0 overflow-hidden rounded-xl">
            <img
              src={post.thumbnail}
              alt={post.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Text — right side, full width if no image */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
              {post.category.replace('-', ' ')}
            </span>
            <span className="text-[10px] text-gray-400 flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {post.createdAt?.toDate ? format(post.createdAt.toDate(), 'MMM dd, yyyy') : 'Recently'}
            </span>
          </div>

          <h3 className="font-black text-gray-900 dark:text-white text-sm line-clamp-2 leading-snug mb-1">
            {post.title}
          </h3>

          {/* Snippet only when no thumbnail */}
          {!post.thumbnail && post.description && (
            <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2 leading-relaxed">
              {getSnippet(post.description)}
              {post.description?.length > 120 ? '...' : ''}
            </p>
          )}

          <div className="flex items-center text-[10px] text-gray-500 space-x-4 mt-2">
            {isAdmin && (
              <span className="flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                {post.views || 0} views
              </span>
            )}
            {post.deadline && (
              <span className="flex items-center text-red-500 font-semibold">
                <Clock className="h-3 w-3 mr-1" />
                {format(post.deadline.toDate(), 'MMM dd')}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

