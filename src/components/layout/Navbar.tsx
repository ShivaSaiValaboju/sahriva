import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import {
  ShoppingBag,
  Bookmark,
  Sun,
  Moon,
  User,
  Shield,
  LogOut,
  Search,
  Menu,
  X,
  Sparkles,
  CheckCircle2,
  Palette,
  Monitor,
  Check,
} from 'lucide-react';
import type { ThemeMode, AccentColor } from '../../context/ThemeContext';

interface NavbarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, onNavigate, onOpenSearch }) => {
  const { user, openAuthModal, logout, loginAsDemoUser, loginAsDemoAdmin } = useAuth();
  const { itemCount, wishlistIds, openCart } = useCart();
  const { theme, resolvedTheme, accent, toggleTheme, setTheme, setAccent } = useTheme();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Discover', route: '/' },
    { label: 'All Apps', route: '/apps' },
    { label: 'Categories', route: '/categories' },
    { label: 'Updates', route: '/updates' },
    { label: 'My Apps', route: '/library' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/90 dark:bg-[#0A0D14]/90 border-b border-neutral-200/80 dark:border-neutral-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-6">
        {/* Zone 1: Brand Wordmark & Prominent Owner / Author Highlight */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2 sm:gap-2.5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg p-1"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-sky-400 flex items-center justify-center shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-neutral-900 dark:text-white whitespace-nowrap">
                SAHRIVA<span className="text-violet-600 dark:text-violet-400 font-semibold ml-1">Store</span>
              </span>
              <span className="block sm:hidden text-[10px] -mt-0.5 tracking-tight flex items-center gap-1">
                <span className="text-neutral-500 dark:text-neutral-400">By</span>
                <span className="sahriva-author-badge px-1.5 py-0.2 text-[9px]">
                  <span className="sahriva-author-name">Shiva Sai Valaboju</span>
                  <CheckCircle2 className="w-2.5 h-2.5 text-violet-500 ml-0.5 inline shrink-0" />
                </span>
              </span>
            </div>
          </button>

          {/* Owner & Author Highlight on Tablet/Desktop with Shimmer & Aura */}
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-neutral-200 dark:border-neutral-800 text-[11px] whitespace-nowrap">
            <span className="text-neutral-500 dark:text-neutral-400">By</span>
            <div className="sahriva-author-badge px-3 py-1 shadow-sm cursor-default">
              <Sparkles className="w-3 h-3 text-amber-500 sahriva-sparkle-icon mr-1 shrink-0" />
              <span className="sahriva-author-name font-extrabold">Shiva Sai Valaboju</span>
              <CheckCircle2 className="w-3 h-3 text-violet-500 ml-1 shrink-0" />
            </div>
          </div>
        </div>

        {/* Zone 2: 4-5 Clean Nav Links */}
        <nav
          className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600 dark:text-neutral-400"
          aria-label="Main Navigation"
        >
          {navLinks.map((link) => {
            const isActive = currentRoute === link.route;
            return (
              <button
                key={link.route}
                onClick={() => onNavigate(link.route)}
                className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
                  isActive
                    ? 'text-neutral-900 dark:text-white font-semibold border-b-2 border-violet-600 dark:border-violet-500'
                    : 'hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions Cluster */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-neutral-900/60 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            aria-label="Search applications"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] text-neutral-500 bg-neutral-200 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 font-mono">
              ⌘K
            </kbd>
          </button>

          {/* Wishlist - desktop */}
          <button
            onClick={() => onNavigate('/wishlist')}
            className="hidden sm:flex relative p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60 rounded-lg transition-colors cursor-pointer"
            aria-label={`Wishlist (${wishlistIds.length} items)`}
          >
            <Bookmark className="w-4 h-4" />
            {wishlistIds.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-600" />
            )}
          </button>

          {/* Cart Drawer - desktop */}
          <button
            onClick={openCart}
            className="hidden sm:flex relative p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60 rounded-lg transition-colors cursor-pointer"
            aria-label={`Cart (${itemCount} items)`}
          >
            <ShoppingBag className="w-4 h-4" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[10px] font-bold bg-violet-600 text-white rounded-full">
                {itemCount}
              </span>
            )}
          </button>

          {/* User Account / Sign In Component (Placed before Theme) */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 sm:gap-2 pl-2 pr-2.5 sm:pr-3 py-1.5 bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer shrink-0"
                aria-expanded={isUserMenuOpen}
                aria-label="User profile menu"
              >
                <div className="w-5 h-5 rounded-full bg-violet-600/20 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                  {user.name.charAt(0)}
                </div>
                <span className="max-w-[75px] sm:max-w-[90px] truncate">{user.name}</span>
              </button>

              {isUserMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl py-1 text-xs text-neutral-800 dark:text-neutral-200 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800">
                    <p className="font-semibold text-neutral-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
                    {user.role === 'admin' && (
                      <span className="inline-block mt-1 text-[10px] text-violet-600 dark:text-violet-400 font-mono">
                        ADMINISTRATOR
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onNavigate('/library');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-neutral-500" />
                    My Apps Library
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onNavigate('/orders');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-neutral-500" />
                    Orders & Receipts
                  </button>

                  {user.role === 'admin' && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigate('/admin');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-violet-600 dark:text-violet-300 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                      Admin Console
                    </button>
                  )}

                  <div className="border-t border-neutral-200 dark:border-neutral-800 my-1" />

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors shadow-sm shadow-violet-600/30 whitespace-nowrap cursor-pointer active:scale-95 shrink-0"
            >
              Sign In
            </button>
          )}

          {/* Theme & Accent Palette Selector (Placed after Sign In at the far right) */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="relative p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              title="Theme and appearance settings"
              aria-label="Theme settings"
              aria-expanded={isThemeMenuOpen}
            >
              {resolvedTheme === 'dark' ? (
                <Moon className="w-4 h-4 text-violet-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              {/* Accent indicator dot */}
              <span
                className={`w-2 h-2 rounded-full ${
                  accent === 'emerald'
                    ? 'bg-emerald-500'
                    : accent === 'amber'
                    ? 'bg-amber-500'
                    : accent === 'rose'
                    ? 'bg-rose-500'
                    : accent === 'cyan'
                    ? 'bg-cyan-500'
                    : 'bg-violet-600'
                }`}
              />
            </button>

            {isThemeMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-3 text-xs text-neutral-800 dark:text-neutral-200 z-50 animate-in fade-in zoom-in-95 duration-100"
                onMouseLeave={() => setIsThemeMenuOpen(false)}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-violet-500" />
                    Appearance & Theme
                  </span>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                    {theme}
                  </span>
                </div>

                {/* Theme Mode selector: Light, Dark, System */}
                <div className="space-y-1 mb-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 px-1">
                    Mode (Light Default)
                  </div>
                  <div className="grid grid-cols-3 gap-1 bg-neutral-100 dark:bg-neutral-800/70 p-1 rounded-xl">
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        theme === 'light'
                          ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-bold'
                          : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5 mb-0.5 text-amber-500" />
                      Light
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        theme === 'dark'
                          ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-bold'
                          : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5 mb-0.5 text-violet-400" />
                      Dark
                    </button>
                    <button
                      onClick={() => setTheme('system')}
                      className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        theme === 'system'
                          ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-bold'
                          : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5 mb-0.5 text-sky-500" />
                      Auto
                    </button>
                  </div>
                </div>

                {/* Accent Color Palettes */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 px-1">
                    Store Accent Palette
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 px-0.5">
                    {(
                      [
                        { id: 'violet', label: 'Violet', colorClass: 'bg-violet-600 ring-violet-500' },
                        { id: 'emerald', label: 'Jade', colorClass: 'bg-emerald-600 ring-emerald-500' },
                        { id: 'amber', label: 'Solar', colorClass: 'bg-amber-500 ring-amber-500' },
                        { id: 'rose', label: 'Rose', colorClass: 'bg-rose-600 ring-rose-500' },
                        { id: 'cyan', label: 'Cyan', colorClass: 'bg-cyan-500 ring-cyan-500' },
                      ] as const
                    ).map((item) => {
                      const isSelected = accent === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setAccent(item.id as AccentColor)}
                          className={`group relative flex flex-col items-center p-1 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                            isSelected ? 'bg-neutral-100 dark:bg-neutral-800/80 font-bold' : ''
                          }`}
                          title={`${item.label} Accent`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full ${item.colorClass} flex items-center justify-center text-white transition-transform group-hover:scale-110 shadow-xs ${
                              isSelected ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900' : ''
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="text-[10px] mt-1 text-neutral-600 dark:text-neutral-400 capitalize">
                            {item.id}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
