
/*
import { auth } from '../lib/firebase';
import { Post } from '../types';
import { Link } from 'react-router-dom';
import { Briefcase, Calendar, TrendingUp, ArrowRight, Clock, AlertTriangle, Bookmark, BookmarkCheck } from 'lucide-react';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useBookmarks } from '../hooks/useBookmarks';
import { toast } from 'sonner';

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

interface PostCardProps {
  post: Post;
}

export const PostCard = ({ post }: PostCardProps) => {
  const deadlineDate = post.deadline?.toDate ? post.deadline.toDate() : null;
  const isExpired = deadlineDate ? deadlineDate < new Date() : false;
  const isExpiringSoon = deadlineDate && !isExpired && differenceInDays(deadlineDate, new Date()) <= 3;
  const isAdmin = auth.currentUser?.email === 'clementegrinya@gmail.com';
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const saved = isBookmarked(post.id);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      viewport={{ once: true }}
      className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all h-full flex flex-col group relative"
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleBookmark(post.id);
          toast.success(saved 
            ? 'Removed from saved' 
            : '🔖 Saved!');
        }}
        className={cn(
          "absolute top-3 right-3 p-2 rounded-xl z-20",
          "backdrop-blur-sm transition-all active:scale-90",
          saved
            ? "bg-primary text-white shadow-lg"
            : "bg-white/90 text-gray-400 hover:text-primary"
        )}
      >
        {saved 
          ? <BookmarkCheck className="w-4 h-4" />
          : <Bookmark className="w-4 h-4" />
        }
      </button>

      {isExpired && (
        <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
          <div className="bg-red-600 text-white px-6 py-2 rounded-full font-black uppercase tracking-widest shadow-2xl rotate-[-5deg]">
            Expired
          </div>
        </div>
      )}

      <Link to={`/post/${post.slug}`} className="flex flex-col h-full">
        {post.thumbnail ? (
          <div className="w-full h-44 overflow-hidden rounded-t-2xl flex-shrink-0 relative">
            <img
              src={post.thumbnail}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const t = e.target as HTMLImageElement;
                t.style.display = 'none';
                // Show snippet instead when image fails
                const parent = t.parentElement;
                if (parent) parent.style.display = 'none';
              }}
            />
            
            {/* Category Badge *}
            <div className="absolute top-3 left-3">
              <span className="bg-accent text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                {post.category.replace('-', ' ')}
              </span>
            </div>

            {/* Featured Badge *}
            {post.isFeatured && (
              <div className="absolute top-3 right-3">
                <span className="bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                  Featured
                </span>
              </div>
            )}

            {/* Expiring Soon Badge *}
            {isExpiringSoon && (
              <div className="absolute bottom-3 left-3">
                <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Expiring Soon
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 pb-0">
            <div className="flex items-center justify-between text-gray-400 text-[10px] mb-3">
              <div className="flex gap-2">
                <span className="bg-accent/10 text-primary dark:text-accent text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  {post.category.replace('-', ' ')}
                </span>
                {post.isFeatured && (
                  <span className="bg-primary/10 text-primary dark:text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    Featured
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-gray-400 text-[10px] mb-1">
            <span className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {post.createdAt?.toDate ? format(post.createdAt.toDate(), 'MMM dd, yyyy') : 'Recently'}
            </span>
            {isAdmin && (
              <span className="flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                {post.views || 0} views
              </span>
            )}
          </div>

          <h3 className="font-black text-gray-900 dark:text-white text-sm leading-snug line-clamp-2">
            {post.title}
          </h3>

          {/* Only show snippet when NO thumbnail *}
          {!post.thumbnail && (
            <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2 leading-relaxed">
              {getSnippet(post.description)}
              {post.description?.length > 120 ? '...' : ''}
            </p>
          )}
        </div>

        <div className="mt-auto pt-4 space-y-3">
          {/* Deadline *}
          <div className="flex items-center text-xs">
            {deadlineDate ? (
              <span className={cn(
                "font-bold flex items-center",
                isExpired ? "text-red-500" : isExpiringSoon ? "text-red-600" : "text-orange-600"
              )}>
                <Clock className="h-3 w-3 mr-1" />
                {isExpired ? 'Expired' : `Expires in ${formatDistanceToNow(deadlineDate)}`}
              </span>
            ) : (
              <span className="text-gray-400 italic">No Deadline</span>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-800">
            <span className="text-primary dark:text-accent font-bold text-xs flex items-center group-hover:translate-x-1 transition-transform">
              View Details <ArrowRight className="ml-1 h-3 w-3" />
            </span>
            {isAdmin && !post.thumbnail && (
              <span className="text-[10px] text-gray-400 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                {post.views || 0}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
*/










import React, { forwardRef } from 'react';
import { auth } from '../lib/firebase';
import { Post } from '../types';
import { Link } from 'react-router-dom';
import { Briefcase, Calendar, TrendingUp, ArrowRight, Clock, AlertTriangle, Bookmark, BookmarkCheck } from 'lucide-react';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useBookmarks } from '../hooks/useBookmarks';
import { toast } from 'sonner';

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

interface PostCardProps {
  post: Post;
}

export const PostCard = forwardRef<HTMLDivElement, PostCardProps>(({ post }, ref) => {
  const deadlineDate = post.deadline?.toDate ? post.deadline.toDate() : null;
  const isExpired = deadlineDate ? deadlineDate < new Date() : false;
  const isExpiringSoon = deadlineDate && !isExpired && differenceInDays(deadlineDate, new Date()) <= 3;
  const isAdmin = auth.currentUser?.email === 'clementegrinya@gmail.com';
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const saved = isBookmarked(post.id);

  return (
    <motion.div 
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      viewport={{ once: true }}
      className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all h-full flex flex-col group relative"
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleBookmark(post.id);
          toast.success(saved 
            ? 'Removed from saved' 
            : '🔖 Saved!');
        }}
        className={cn(
          "absolute top-3 right-3 p-2 rounded-xl z-20",
          "backdrop-blur-sm transition-all active:scale-90",
          saved
            ? "bg-primary text-white shadow-lg"
            : "bg-white/90 text-gray-400 hover:text-primary"
        )}
      >
        {saved 
          ? <BookmarkCheck className="w-4 h-4" />
          : <Bookmark className="w-4 h-4" />
        }
      </button>

      {isExpired && (
        <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
          <div className="bg-red-600 text-white px-6 py-2 rounded-full font-black uppercase tracking-widest shadow-2xl rotate-[-5deg]">
            Expired
          </div>
        </div>
      )}

      <Link to={`/post/${post.slug}`} className="flex flex-col h-full">
        {post.thumbnail ? (
          <div className="w-full h-44 overflow-hidden rounded-t-2xl flex-shrink-0 relative">
            <img
              src={post.thumbnail}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const t = e.target as HTMLImageElement;
                t.style.display = 'none';
                // Show snippet instead when image fails
                const parent = t.parentElement;
                if (parent) parent.style.display = 'none';
              }}
            />
            
            {/* Category Badge */}
            <div className="absolute top-3 left-3">
              <span className="bg-accent text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                {post.category.replace('-', ' ')}
              </span>
            </div>

            {/* Featured Badge */}
            {post.isFeatured && (
              <div className="absolute top-3 right-3">
                <span className="bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                  Featured
                </span>
              </div>
            )}

            {/* Expiring Soon Badge */}
            {isExpiringSoon && (
              <div className="absolute bottom-3 left-3">
                <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Expiring Soon
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 pb-0">
            <div className="flex items-center justify-between text-gray-400 text-[10px] mb-3">
              <div className="flex gap-2">
                <span className="bg-accent/10 text-primary dark:text-accent text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  {post.category.replace('-', ' ')}
                </span>
                {post.isFeatured && (
                  <span className="bg-primary/10 text-primary dark:text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    Featured
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-gray-400 text-[10px] mb-1">
            <span className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {post.createdAt?.toDate ? format(post.createdAt.toDate(), 'MMM dd, yyyy') : 'Recently'}
            </span>
            {isAdmin && (
              <span className="flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                {post.views || 0} views
              </span>
            )}
          </div>

          <h3 className="font-black text-gray-900 dark:text-white text-sm leading-snug line-clamp-2">
            {post.title}
          </h3>

          {/* Only show snippet when NO thumbnail */}
          {!post.thumbnail && (
            <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2 leading-relaxed">
              {getSnippet(post.description)}
              {post.description?.length > 120 ? '...' : ''}
            </p>
          )}
        </div>

        <div className="mt-auto pt-4 space-y-3">
          {/* Deadline */}
          <div className="flex items-center text-xs">
            {deadlineDate ? (
              <span className={cn(
                "font-bold flex items-center",
                isExpired ? "text-red-500" : isExpiringSoon ? "text-red-600" : "text-orange-600"
              )}>
                <Clock className="h-3 w-3 mr-1" />
                {isExpired ? 'Expired' : `Expires in ${formatDistanceToNow(deadlineDate)}`}
              </span>
            ) : (
              <span className="text-gray-400 italic">No Deadline</span>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-800">
            <span className="text-primary dark:text-accent font-bold text-xs flex items-center group-hover:translate-x-1 transition-transform">
              View Details <ArrowRight className="ml-1 h-3 w-3" />
            </span>
            {isAdmin && !post.thumbnail && (
              <span className="text-[10px] text-gray-400 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                {post.views || 0}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
});







