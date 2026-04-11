import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Menu, X, Search, Sun, Moon, User, LayoutDashboard, LogOut, Bookmark } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { useTheme } from './ThemeProvider';
import { useAuth } from './AuthProvider';
import { auth, db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { CategoryConfig, SiteConfig } from '../types';
import { useBookmarks } from '../hooks/useBookmarks';
import { trackEvent } from '../lib/analytics';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, profile } = useAuth();
  const { bookmarks } = useBookmarks();
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [siteName, setSiteName] = useState('Hub & Jobs');

  useEffect(() => {
    // Fetch active categories
    const q = query(
      collection(db, 'categories'), 
      where('isActive', '==', true),
      orderBy('displayOrder', 'asc')
    );
    const unsubCategories = onSnapshot(q, (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryConfig)));
    }, (error) => {
      console.error('Error fetching categories:', error);
    });

    // Fetch site name
    const unsubSite = onSnapshot(doc(db, 'settings', 'siteConfig'), (doc) => {
      if (doc.exists()) {
        setSiteName(doc.data().siteName || 'Hub & Jobs');
      }
    }, (error) => {
      console.error('Error fetching site config:', error);
    });

    return () => {
      unsubCategories();
      unsubSite();
    };
  }, []);

  const staticLinks = [
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: 'Documents', path: '/documents' },
    { name: 'About', path: '/about' },
  ];

  const navLinks = [
    ...staticLinks,
    ...categories.map(cat => ({
      name: cat.name,
      path: `/category/${cat.slug}`
    }))
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <nav className="bg-primary dark:bg-gray-900 text-white sticky top-0 z-50 shadow-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            {/* Bridge Icon */}
            <div className="w-9 h-9 bg-primary rounded-xl 
              flex items-center justify-center flex-shrink-0
              shadow-md shadow-primary/30 border border-white/10">
              <svg width="22" height="22" viewBox="0 0 32 32">
                <rect x="2" y="17" width="4" height="11" 
                  rx="1.5" fill="white"/>
                <rect x="26" y="17" width="4" height="11" 
                  rx="1.5" fill="white"/>
                <rect x="1" y="20" width="30" height="4" 
                  rx="2" fill="white"/>
                <path d="M4 20 Q16 6 28 20" fill="none" 
                  stroke="white" strokeWidth="2.5" 
                  strokeLinecap="round"/>
                <line x1="10" y1="13" x2="10" y2="20" 
                  stroke="white" strokeWidth="1.5" 
                  strokeOpacity="0.6"/>
                <line x1="16" y1="8" x2="16" y2="20" 
                  stroke="white" strokeWidth="1.5" 
                  strokeOpacity="0.6"/>
                <line x1="22" y1="13" x2="22" y2="20" 
                  stroke="white" strokeWidth="1.5" 
                  strokeOpacity="0.6"/>
                <circle cx="16" cy="5" r="2.5" fill="#F59E0B"/>
                <polygon points="16,0 13,5 19,5" fill="#F59E0B"/>
              </svg>
            </div>
            {/* Wordmark */}
            <div className="flex items-baseline gap-0">
              <span className="font-black text-white 
                dark:text-white text-xl tracking-tight"
                style={{fontFamily: "Montserrat, sans-serif"}}>
                Hub
              </span>
              <span className="font-black text-amber-400 
                text-xl mx-0.5 tracking-tight">
                &amp;
              </span>
              <span className="font-black text-white 
                dark:text-white text-xl tracking-tight"
                style={{fontFamily: "Montserrat, sans-serif"}}>
                Jobs
              </span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {staticLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => trackEvent('Navigation', 'static', link.name)}
                  className="px-3 py-2 rounded-md text-sm font-medium hover:text-accent transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Icons & Mobile Toggle */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-blue-800 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>

            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 rounded-full hover:bg-blue-800 dark:hover:bg-gray-800 transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>

            <Link to="/saved" className="relative p-2 rounded-full hover:bg-blue-800 dark:hover:bg-gray-800 transition-colors">
              <Bookmark className="h-5 w-5" />
              {bookmarks.length > 0 && (
                <span className="absolute top-1 right-1 
                  w-4 h-4 bg-amber-500 text-white 
                  text-[10px] font-black rounded-full 
                  flex items-center justify-center shadow-lg">
                  {bookmarks.length > 9 ? '9+' : bookmarks.length}
                </span>
              )}
            </Link>
            
            {/* Desktop Auth */}
            <div className="hidden lg:flex items-center ml-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  {profile?.role === 'admin' && (
                    <Link 
                      to="/admin" 
                      className="flex items-center text-sm font-bold text-accent hover:text-white transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4 mr-1.5" /> Dashboard
                    </Link>
                  )}
                  <button 
                    onClick={() => auth.signOut()}
                    className="flex items-center text-sm font-bold text-gray-300 hover:text-white transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-1.5" /> Logout
                  </button>
                </div>
              ) : (
                <Link 
                  to="/admin/login" 
                  className="flex items-center px-4 py-2 bg-accent text-primary rounded-xl text-sm font-black hover:bg-yellow-500 transition-all shadow-lg shadow-accent/20"
                >
                  <User className="h-4 w-4 mr-1.5" /> Login
                </Link>
              )}
            </div>

            <div className="lg:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md hover:bg-blue-800 dark:hover:bg-gray-800 focus:outline-none"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="absolute top-16 left-0 w-full bg-primary p-4 border-t border-blue-800 shadow-xl animate-in slide-in-from-top duration-200">
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto relative">
            <input
              autoFocus
              type="text"
              placeholder="Search opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-blue-900 border-none rounded-lg py-3 pl-4 pr-12 text-white placeholder-blue-300 focus:ring-2 focus:ring-accent outline-none"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-accent">
              <Search className="h-5 w-5" />
            </button>
          </form>
        </div>
      )}

      {/* Mobile Menu */}
      <div className={cn("lg:hidden", isOpen ? "block" : "hidden")}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-primary border-t border-blue-800">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => {
                setIsOpen(false);
                trackEvent('Navigation', 'category', link.name);
              }}
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800"
            >
              {link.name}
            </Link>
          ))}
          <Link
            to="/saved"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-between px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800"
          >
            <span className="flex items-center">
              <Bookmark className="h-5 w-5 mr-2" /> Saved Opportunities
            </span>
            {bookmarks.length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {bookmarks.length}
              </span>
            )}
          </Link>
          {user ? (
            <>
              {profile?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-accent hover:bg-blue-800"
                >
                  Admin Dashboard
                </Link>
              )}
              <button
                onClick={() => {
                  auth.signOut();
                  setIsOpen(false);
                }}
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-blue-800"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/admin/login"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-accent hover:bg-blue-800"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
