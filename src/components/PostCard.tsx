import { Link } from 'react-router-dom';
import { Post } from '../types';
import { cn } from '../lib/utils';
import { TrendingUp, MapPin } from 'lucide-react';

interface PostCardProps {
  post: Post;
  featured?: boolean;
}

const getSnippet = (html: string): string => {
  if (!html) return '';
  return html
    .replace(/<\/?(p|div|h[1-6]|li|br)[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
};

const getApplyLabel = (category: string): string => {
  const cat = category?.toLowerCase();
  if (cat === 'job' || cat === 'internship') 
    return 'Apply Now';
  if (cat === 'scholarship') 
    return 'Apply Now';
  if (cat === 'free-course' || cat === 'udemy-coupon') 
    return 'Get Free';
  if (cat === 'opportunity') 
    return 'Learn More';
  return 'View Details';
};

const formatDeadline = (deadline: any): string => {
  if (!deadline) return '';
  try {
    const d = deadline?.seconds
      ? new Date(deadline.seconds * 1000)
      : new Date(deadline);
    const diff = Math.ceil(
      (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (diff < 0) return 'Expired';
    if (diff === 0) return 'Closes today!';
    if (diff <= 3) return `⚠️ ${diff} days left`;
    if (diff <= 7) return `${diff} days left`;
    return d.toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short'
    });
  } catch { return ''; }
};

const isJob = (category: string): boolean => {
  const cat = category?.toLowerCase();
  return cat === 'job' || cat === 'internship';
};

export const PostCard = ({ post, featured = false }: PostCardProps) => {
  const snippet = getSnippet(post.description);
  const deadlineText = formatDeadline(post.deadline);
  const jobPost = isJob(post.category);

  return (
    <Link to={`/post/${post.slug}`} className="block">
      <div className={cn(
        "rounded-2xl flex flex-col gap-2.5 p-3.5 md:p-5",
        "border relative overflow-hidden",
        "transition-all duration-200",
        "hover:-translate-y-1 hover:shadow-xl",
        "active:scale-98 cursor-pointer",
        featured
          ? [
              "bg-primary border-primary text-white",
              "shadow-xl shadow-primary/30",
              "hover:shadow-2xl hover:shadow-primary/40",
            ].join(' ')
          : [
              "bg-white dark:bg-gray-900",
              "border-gray-100 dark:border-gray-800",
              "hover:border-primary",
              "hover:shadow-primary/10",
            ].join(' ')
      )}>

        {/* Sparkle for featured */}
        {featured && (
          <span className="absolute top-3 right-3 
            text-white/70 text-lg">✦</span>
        )}

        {/* Image — only for non-job posts */}
        {!jobPost && post.thumbnail && (
          <div className="w-full h-24 md:h-32 
            rounded-xl overflow-hidden -mt-0">
            <img
              src={post.thumbnail}
              alt={post.title}
              className="w-full h-full object-cover
                transition-transform duration-300
                group-hover:scale-105"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement)
                  .parentElement!.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Category label */}
        <div>
          <p className={cn(
            "text-[10px] font-black uppercase tracking-wide",
            featured ? "text-blue-200" : "text-gray-400"
          )}>
            {post.category}
          </p>
          {featured && (
            <p className="text-[9px] text-blue-200 mt-0.5">
              Featured opportunity
            </p>
          )}
        </div>

        {/* Title */}
        <h3 className={cn(
          "font-black leading-tight line-clamp-3",
          "text-[13px] md:text-base lg:text-[15px]",
          featured 
            ? "text-white" 
            : "text-gray-900 dark:text-white"
        )}>
          {post.title}
        </h3>

        {/* Checkmark list */}
        <div className="flex flex-col gap-1.5">

          {post.location && (
            <CheckItem 
              text={post.location} 
              featured={featured} 
            />
          )}

          {deadlineText && (
            <CheckItem 
              text={deadlineText} 
              featured={featured} 
            />
          )}

          {snippet && (
            <CheckItem 
              text={snippet + '...'} 
              featured={featured}
              truncate 
            />
          )}

          <CheckItem
            text={`${post.views || 0} people viewed`}
            featured={featured}
          />
        </div>

        {/* Apply button */}
        <button className={cn(
          "w-full py-2.5 md:py-3 rounded-xl",
          "font-black text-xs md:text-sm",
          "transition-all mt-1",
          "hover:scale-105 active:scale-95",
          featured
            ? "bg-white text-primary hover:bg-blue-50 shadow-sm"
            : "bg-primary text-white hover:bg-blue-900 shadow-sm"
        )}>
          {getApplyLabel(post.category)}
        </button>
      </div>
    </Link>
  );
};

// Reusable checkmark item
const CheckItem = ({ 
  text, 
  featured, 
  truncate 
}: { 
  text: string; 
  featured: boolean;
  truncate?: boolean;
}) => (
  <div className="flex items-start gap-1.5">
    <div className={cn(
      "w-3.5 h-3.5 md:w-4 md:h-4 rounded-full",
      "flex items-center justify-center",
      "flex-shrink-0 mt-0.5 text-[8px] font-black",
      featured
        ? "bg-white/20 text-white"
        : "bg-primary/10 text-primary"
    )}>
      ✓
    </div>
    <span className={cn(
      "text-[10px] md:text-xs font-medium leading-tight",
      truncate ? "line-clamp-2" : "line-clamp-1",
      featured ? "text-blue-100" : "text-gray-500"
    )}>
      {text}
    </span>
  </div>
);

export default PostCard;
