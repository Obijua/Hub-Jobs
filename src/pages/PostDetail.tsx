import { auth } from '../lib/firebase';
import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Post } from '../types';
import {
  Calendar,
  ArrowLeft,
  ExternalLink,
  Share2,
  Briefcase,
  TrendingUp,
  Clock,
  Tag as TagIcon,
  ChevronRight,
  Home as HomeIcon,
  MessageCircle,
  Twitter,
  Copy,
  CheckCircle2,
  Mail,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import { format, formatDistanceToNow, intervalToDuration } from 'date-fns';
import { motion } from 'motion/react';
import { getPostBySlug, incrementViews, getAllPosts, subscribe, injectAdsIntoContent } from '../lib/posts';
import { PostCard } from '../components/PostCard';
import { cn } from '../lib/utils';
import { SEO } from '../components/SEO';
import { FloatingActions } from '../components/FloatingActions';
import { AdSlot } from '../components/ads/AdSlot';
import AdUnit from '../components/AdUnit';
import InArticleAd from '../components/InArticleAd';
import { useBookmarks } from '../hooks/useBookmarks';
import { toast } from 'sonner';
import { sendWelcomeEmail } from '../lib/email';
import { trackEvent } from '../lib/analytics';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MonetizationConfig } from '../types';

export const PostDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const isAdmin = auth.currentUser?.email === 'clementegrinya@gmail.com';
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const [monetization, setMonetization] = useState<MonetizationConfig | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'monetization'), (doc) => {
      if (doc.exists()) {
        setMonetization(doc.data() as MonetizationConfig);
      }
    });
    return () => unsub();
  }, []);

  // Countdown state
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number } | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const fetchedPost = await getPostBySlug(slug);
        if (fetchedPost) {
          setPost(fetchedPost);
          incrementViews(fetchedPost.id);
          trackEvent('Post', 'view', fetchedPost.title);

          // Fetch related posts
          const related = await getAllPosts({
            category: fetchedPost.category,
            limitCount: 4
          });
          setRelatedPosts(related.filter(p => p.id !== fetchedPost.id).slice(0, 3));
        }
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
    window.scrollTo(0, 0);
  }, [slug]);

  // Countdown Timer Logic
  useEffect(() => {
    if (!post?.deadline) return;

    const timer = setInterval(() => {
      const now = new Date();
      const deadline = post.deadline.toDate();

      if (deadline > now) {
        const duration = intervalToDuration({ start: now, end: deadline });
        setTimeLeft({
          days: duration.days || 0,
          hours: duration.hours || 0,
          minutes: duration.minutes || 0
        });
      } else {
        setTimeLeft(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [post]);

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
        source: 'post_detail_sidebar',
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = useMemo(() => {
    if (!post) return [];
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this opportunity: ${post.title}`);

    return [
      { name: 'WhatsApp', icon: MessageCircle, color: 'bg-[#25D366]', url: `https://wa.me/?text=${text}%20${url}` },
      { name: 'Twitter', icon: Twitter, color: 'bg-[#1DA1F2]', url: `https://twitter.com/intent/tweet?url=${url}&text=${text}` },
    ];
  }, [post]);

  const getCtaLabel = (category: string) => {
    switch (category) {
      case 'job':
      case 'internship':
        return 'Apply Now';
      case 'scholarship':
        return 'Apply for Scholarship';
      case 'free-course':
      case 'udemy-coupon':
        return 'Get Free Access';
      default:
        return 'Learn More';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Opportunity Not Found</h1>
        <Link to="/blog" className="text-primary hover:underline flex items-center justify-center">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to all opportunities
        </Link>
      </div>
    );
  }

  const isExpiringSoon = post.deadline && (post.deadline.toDate().getTime() - new Date().getTime()) < 3 * 24 * 60 * 60 * 1000;
  const isExpired = post.deadline && post.deadline.toDate().getTime() < new Date().getTime();

  const jobPostingSchema = post.category === 'job' ? {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": post.title,
    "description": post.description,
    "datePosted": post.createdAt.toDate().toISOString(),
    "validThrough": post.deadline ? post.deadline.toDate().toISOString() : undefined,
    "employmentType": post.tags?.includes('full-time') ? 'FULL_TIME' : post.tags?.includes('part-time') ? 'PART_TIME' : 'OTHER',
    "hiringOrganization": {
      "@type": "Organization",
      "name": "Hub & Jobs",
      "sameAs": "https://hubandjobs.com"
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "NG",
        "addressLocality": post.location || "Nigeria"
      }
    },
    "applicantLocationRequirements": {
      "@type": "Country",
      "name": "Nigeria"
    }
  } : undefined;

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen pb-20 transition-colors duration-300">
      <SEO
        title={post.seoTitle || post.title}
        description={post.metaDescription || post.description.replace(/[#*`]/g, '').slice(0, 160)}
        image={post.ogImage || post.thumbnail}
        type="article"
        keywords={[post.focusKeyword, ...(post.tags || [])].filter(Boolean).join(', ')}
        schema={jobPostingSchema}
      />

      <FloatingActions />

      {/* 1. BREADCRUMB */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center text-xs font-medium text-gray-500 space-x-2">
            <Link to="/" className="hover:text-primary flex items-center">
              <HomeIcon className="h-3 w-3 mr-1" /> Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link to={`/category/${post.category}`} className="hover:text-primary capitalize">
              {post.category.replace('-', ' ')}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-900 dark:text-white truncate max-w-[200px]">{post.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800"
            >
              {/* 2. THUMBNAIL */}
              {post.thumbnail && post.thumbnail.trim() !== '' && (
                <div className="w-full aspect-video overflow-hidden rounded-2xl mb-8">
                  <img
                    src={post.thumbnail}
                    alt={post.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // If image fails to load, hide entire container
                      const target = e.target as HTMLImageElement;
                      if (target.parentElement) {
                        target.parentElement.style.display = 'none';
                      }
                    }}
                  />
                </div>
              )}

              {/* 3. POST HEADER */}
              <div className="p-8 md:p-12">
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <div className="flex items-center text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                    <Calendar className="h-3.5 w-3.5 mr-2 text-primary" />
                    Posted: {format(post.createdAt.toDate(), 'MMM dd, yyyy')}
                  </div>
                  {post.deadline && (
                    <div className={cn(
                      "flex items-center text-xs font-bold px-3 py-1.5 rounded-lg",
                      isExpired ? "bg-red-50 text-red-600" : isExpiringSoon ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"
                    )}>
                      <Clock className="h-3.5 w-3.5 mr-2" />
                      {isExpired ? 'Expired' : `Deadline: ${format(post.deadline.toDate(), 'MMM dd, yyyy')}`}
                    </div>
                  )}
                  {isAdmin && (
                    <div className="flex items-center text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                      <TrendingUp className="h-3.5 w-3.5 mr-2 text-primary" />
                      {post.views || 0} Views
                    </div>
                  )}
                </div>

                <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-8">
                  {post.title}
                </h1>

                <AdUnit slot="post_top" />

                <AdSlot zone="post-detail-top" />

                {/* Share Buttons */}
                <div className="flex flex-wrap gap-3 mb-10 pb-8 border-b border-gray-100 dark:border-gray-800">
                  <span className="w-full text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Share this opportunity</span>
                  {shareLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn("flex items-center px-4 py-2 rounded-xl text-white text-sm font-bold transition-transform hover:scale-105", link.color)}
                    >
                      <link.icon className="h-4 w-4 mr-2" /> {link.name}
                    </a>
                  ))}
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>

                  <button
                    onClick={() => {
                      toggleBookmark(post.id);
                      trackEvent('Post', 'bookmark', post.title);
                      toast.success(isBookmarked(post.id)
                        ? 'Removed from saved'
                        : '🔖 Saved!');
                    }}
                    className={cn(
                      "flex items-center gap-2 px-5 py-3 rounded-2xl",
                      "font-black text-sm transition-all",
                      isBookmarked(post.id)
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    )}
                  >
                    {isBookmarked(post.id)
                      ? <><BookmarkCheck className="w-4 h-4" /> Saved</>
                      : <><Bookmark className="w-4 h-4" /> Save</>
                    }
                  </button>
                </div>

                {/* 4. POST BODY */}
                <div className="prose prose-lg max-w-none prose-blue dark:prose-invert prose-img:rounded-xl prose-a:text-blue-600 prose-headings:font-bold">
                  {(() => {
                    const frequency = monetization?.articleAdFrequency || 2;
                    const maxAds = monetization?.articleMaxAds || 6;

                    // Split by paragraphs
                    const paragraphs = (post.description || '').split(/<\/p>/i).filter(p => p.trim() !== '');

                    return paragraphs.map((para, index) => (
                      <div key={index}>
                        <div dangerouslySetInnerHTML={{ __html: para.includes('<p') ? para + '</p>' : `<p>${para}</p>` }} />
                        {(index + 1) % frequency === 0 && (index + 1) / frequency <= maxAds && index < paragraphs.length - 1 && (
                          <InArticleAd position={index + 1} />
                        )}
                      </div>
                    ));
                  })()}
                </div>

                <AdSlot zone="post-detail-bottom" />

                <AdUnit slot="post_bottom" />

                {/* 6. TAGS */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-12">
                    {post.tags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => navigate(`/search?q=${tag}`)}
                        className="flex items-center text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:text-white dark:hover:bg-accent dark:hover:text-primary px-3 py-1.5 rounded-lg transition-all"
                      >
                        <TagIcon className="h-3 w-3 mr-1.5" /> {tag}
                      </button>
                    ))}
                  </div>
                )}

                {/* 5. APPLY / ACCESS BUTTONS */}
                {(post.externalLink || post.whatsappNumber) && (
                  <div className="pt-8 border-t border-gray-100 dark:border-gray-800 space-y-4">
                    {post.externalLink && (
                      <div>
                        <a
                          href={post.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ backgroundColor: post.ctaColor || undefined }}
                          onClick={() => trackEvent('Post', 'apply_click', post.title)}
                          className={cn(
                            "w-full inline-flex items-center justify-center px-6 py-3.5 text-white text-sm font-bold rounded-xl transition-all shadow-lg group",
                            !post.ctaColor && "bg-primary hover:bg-blue-900 shadow-primary/20"
                          )}
                        >
                          {post.externalLinkText || post.ctaText || getCtaLabel(post.category)}
                          <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </a>
                        <p className="text-center text-gray-400 text-[10px] mt-3">
                          You will be redirected to the official application page.
                        </p>
                      </div>
                    )}

                    {post.whatsappNumber && (
                      <a
                        href={`https://wa.me/${post.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello, I am interested in: ${post.title}\n\n${window.location.href}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackEvent('Post', 'whatsapp_click', post.title)}
                        className="w-full inline-flex items-center justify-center px-6 py-3.5 bg-[#25D366] hover:bg-[#20ba5a] text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-green-500/20 group"
                      >
                        <MessageCircle className="mr-2 h-5 w-5" />
                        {post.whatsappButtonText || 'Send CV on WhatsApp'}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* 7. RELATED POSTS */}
            {relatedPosts.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center">
                  <Star className="h-6 w-6 text-accent mr-2 fill-accent" />
                  Related Opportunities
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedPosts.map(p => (
                    <PostCard key={p.id} post={p} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <AdSlot zone="sidebar" />

            {/* 8. DEADLINE COUNTDOWN */}
            {post.deadline && timeLeft && !isExpired && (
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm text-center">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">Application Deadline</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl">
                    <div className="text-2xl font-black text-red-600">{timeLeft.days}</div>
                    <div className="text-[10px] font-bold text-red-400 uppercase">Days</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl">
                    <div className="text-2xl font-black text-red-600">{timeLeft.hours}</div>
                    <div className="text-[10px] font-bold text-red-400 uppercase">Hours</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl">
                    <div className="text-2xl font-black text-red-600">{timeLeft.minutes}</div>
                    <div className="text-[10px] font-bold text-red-400 uppercase">Mins</div>
                  </div>
                </div>
                <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                  Hurry up! The application closes on <br />
                  <span className="font-bold text-gray-900 dark:text-white">{format(post.deadline.toDate(), 'MMMM dd, yyyy')}</span>
                </p>
              </div>
            )}

            {/* Newsletter Sidebar */}
            <div className="bg-primary rounded-3xl p-8 text-white relative overflow-hidden">
              <Mail className="h-10 w-10 text-accent mb-6" />
              <h3 className="text-2xl font-bold mb-4">Get Opportunities in Your Inbox</h3>
              <p className="text-blue-100 text-sm mb-8">Join thousands of Nigerians who get daily job and scholarship alerts from Hub & Jobs</p>

              {subscribed ? (
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl text-accent font-bold text-center">
                  Successfully Subscribed!
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <input
                    type="email"
                    required
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-blue-200 focus:ring-2 focus:ring-accent outline-none"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-accent text-primary font-bold py-3 rounded-xl hover:bg-yellow-500 transition-all flex items-center justify-center"
                  >
                    {submitting ? 'Subscribing...' : 'Subscribe Now'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Star = ({ className, fill }: { className?: string; fill?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={fill || "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
