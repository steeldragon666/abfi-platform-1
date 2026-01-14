/**
 * ABFI Platform - Premium Header Component
 * "Australian Summer Dusk" Design System
 * 
 * High-end navigation header with distinctive styling
 */

import * as React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { 
  BankabilityIcon, 
  RegistryIcon, 
  GrowerIcon,
  DeveloperIcon,
  LenderIcon,
  BioenergyIcon 
} from '@/components/ui/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Bell, 
  HelpCircle,
  ChevronDown,
  Map,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  User,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string;
  children?: NavItem[];
}

const mainNavItems: NavItem[] = [
  {
    label: 'Marketplace',
    href: '/browse',
    icon: <RegistryIcon size="sm" />,
    children: [
      { label: 'Browse Feedstocks', href: '/browse', icon: <BioenergyIcon size="sm" /> },
      { label: 'Futures Market', href: '/futures', icon: <BarChart3 className="w-4 h-4" /> },
      { label: 'Demand Signals', href: '/demand-signals', icon: <FileText className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Bankability',
    href: '/bankability',
    icon: <BankabilityIcon size="sm" />,
  },
  {
    label: 'Map',
    href: '/map',
    icon: <Map className="w-5 h-5" />,
  },
  {
    label: 'Beema Bamboo',
    href: '/beema-bamboo',
    icon: <BioenergyIcon size="sm" variant="eucalyptus" />,
    badge: 'New',
  },
];

const portalItems = [
  { 
    label: 'Grower Portal', 
    href: '/grower/dashboard', 
    icon: <GrowerIcon size="sm" />,
    description: 'Manage feedstock and certifications',
  },
  { 
    label: 'Developer Portal', 
    href: '/developer/dashboard', 
    icon: <DeveloperIcon size="sm" />,
    description: 'Find suppliers and secure supply',
  },
  { 
    label: 'Lender Portal', 
    href: '/finance/dashboard', 
    icon: <LenderIcon size="sm" />,
    description: 'Risk analysis and market intelligence',
  },
];

export const PremiumHeader: React.FC = () => {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isActive = (href: string) => location === href || location.startsWith(href + '/');
  
  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-[#F59E0B] via-[#10B981] to-[#14B8A6]" />
      
      {/* Main header */}
      <div className="bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center gap-3 group"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center shadow-lg shadow-[#F59E0B]/20 group-hover:shadow-[#F59E0B]/40 transition-shadow">
                  <span className="text-black font-display font-black text-lg">AB</span>
                </div>
                {/* Pulse indicator */}
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#10B981] rounded-full border-2 border-background" />
              </div>
              <div className="hidden sm:block">
                <span className="font-display font-bold text-lg tracking-tight">ABFI</span>
                <span className="text-xs text-muted-foreground block -mt-0.5">Platform</span>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {mainNavItems.map((item) => (
                item.children ? (
                  <DropdownMenu key={item.href}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          'gap-2 px-3',
                          isActive(item.href) && 'bg-accent text-accent-foreground'
                        )}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                        <ChevronDown className="w-4 h-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {item.children.map((child) => (
                        <DropdownMenuItem key={child.href} asChild>
                          <Link to={child.href} className="flex items-center gap-2">
                            {child.icon}
                            {child.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link key={item.href} to={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        'gap-2 px-3',
                        isActive(item.href) && 'bg-accent text-accent-foreground'
                      )}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#F59E0B] text-black">
                          {item.badge}
                        </span>
                      )}
                    </Button>
                  </Link>
                )
              ))}
            </nav>
            
            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Portal Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
                    <span className="text-xs text-muted-foreground">Portal:</span>
                    <span className="font-semibold">Lender</span>
                    <ChevronDown className="w-4 h-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Switch Portal</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {portalItems.map((portal) => (
                    <DropdownMenuItem key={portal.href} asChild>
                      <Link to={portal.href} className="flex items-start gap-3 py-2">
                        <div className="mt-0.5">{portal.icon}</div>
                        <div>
                          <p className="font-medium">{portal.label}</p>
                          <p className="text-xs text-muted-foreground">{portal.description}</p>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleTheme?.()}
                className="relative"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
              
              {/* Help */}
              <Button variant="ghost" size="icon" asChild>
                <Link to="/explainers">
                  <HelpCircle className="h-5 w-5" />
                  <span className="sr-only">Help</span>
                </Link>
              </Button>
              
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#F59E0B] text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                  3
                </span>
                <span className="sr-only">Notifications</span>
              </Button>
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 pl-2 pr-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#10B981] to-[#047857] flex items-center justify-center text-white font-semibold text-sm">
                      G
                    </div>
                    <span className="hidden sm:block font-medium">Guest</span>
                    <ChevronDown className="w-4 h-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
                <span className="sr-only">Toggle menu</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-background border-b border-border">
          <div className="px-4 py-4 space-y-2">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive(item.href)
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-muted'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto px-2 py-0.5 text-xs font-bold rounded-full bg-[#F59E0B] text-black">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
            
            <div className="pt-4 border-t border-border">
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Portals
              </p>
              {portalItems.map((portal) => (
                <Link
                  key={portal.href}
                  to={portal.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {portal.icon}
                  <span className="font-medium">{portal.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default PremiumHeader;
