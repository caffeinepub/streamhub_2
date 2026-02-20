import { Link, useNavigate } from '@tanstack/react-router';
import { Search, Upload, TrendingUp, History, User, Menu, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import LoginButton from './LoginButton';
import CategoryNav from './CategoryNav';
import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin } from '../hooks/useQueries';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: isAdmin } = useIsCallerAdmin();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate({ to: '/search', search: { q: searchTerm } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4 px-4">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col gap-4 p-6">
                <CategoryNav />
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/assets/generated/logo.dim_256x256.png" alt="StreamHub" className="h-8 w-8" />
            <span className="hidden font-bold text-xl bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent sm:inline-block">
              StreamHub
            </span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search videos..."
                className="pl-10 bg-muted/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </form>

          {/* Navigation */}
          <nav className="flex items-center gap-2">
            {isAuthenticated && (
              <Button variant="ghost" size="icon" asChild>
                <Link to="/upload">
                  <Upload className="h-5 w-5" />
                </Link>
              </Button>
            )}
            <LoginButton />
          </nav>
        </div>
      </header>

      <div className="container flex gap-6 px-4 py-6">
        {/* Sidebar */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-20 space-y-6">
            {/* Main Navigation */}
            <nav className="space-y-1">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link to="/trending">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Trending
                </Link>
              </Button>
              {isAuthenticated && (
                <>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link to="/history">
                      <History className="mr-2 h-4 w-4" />
                      History
                    </Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link 
                      to="/profile/$userId" 
                      params={{ userId: identity?.getPrincipal().toString() || '' }}
                    >
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </Link>
                  </Button>
                </>
              )}
              {isAdmin && (
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link to="/admin">
                    <User className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </Link>
                </Button>
              )}
            </nav>

            {/* Categories */}
            <div>
              <h3 className="mb-2 px-3 text-sm font-semibold text-muted-foreground">Categories</h3>
              <CategoryNav />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/30 mt-12">
        <div className="container px-4 py-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} StreamHub. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Built with ❤️ using{' '}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                  window.location.hostname
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-foreground transition-colors"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
