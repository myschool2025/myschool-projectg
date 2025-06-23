import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, Users, BookOpen, School, MessageSquare,
  DollarSign, Calendar, Settings, LogOut, Menu, X, ChevronRight,
  Bot,
  ListTodo,
  SettingsIcon, Briefcase,
  Target,
  Laptop,
  Shield,
  ChevronDown,
  UserCheck,
  FileText,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Organized navigation with sub-menus
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: '/admin',
      type: 'single'
    },
    {
      id: 'student-management',
      label: 'Student Management',
      icon: <Users className="h-5 w-5" />,
      type: 'group',
      items: [
        { path: '/admin/student-management', label: 'Student Profiles', icon: <FileText className="h-4 w-4" /> },
        { path: '/admin/users-management', label: 'User Verification', icon: <UserCheck className="h-4 w-4" /> },
      ]
    },
    {
      id: 'academic',
      label: 'Academic',
      icon: <BookOpen className="h-5 w-5" />,
      type: 'group',
      items: [
        { path: '/admin/academic', label: 'Class Routine', icon: <Calendar className="h-4 w-4" /> },
        { path: '/admin/staff', label: 'Staff Management', icon: <School className="h-4 w-4" /> },
        { path: '/admin/exam-management', label: 'Exam Management', icon: <FileText className="h-4 w-4" /> },
        { path: '/admin/school-result', label: 'School Result', icon: <BarChart3 className="h-4 w-4" /> },
      ]
    },
    {
      id: 'finance',
      label: 'Finance & Accounts',
      icon: <DollarSign className="h-5 w-5" />,
      type: 'group',
      items: [
        { path: '/admin/fee-collection', label: 'Fee Collection', icon: <BarChart3 className="h-4 w-4" /> },
        { path: '/admin/fee-settings', label: 'Fee Settings', icon: <SettingsIcon className="h-4 w-4" /> },
        { path: '/admin/custom-student-fees', label: 'Custom Student Fees', icon: <ListTodo className="h-4 w-4" /> },
        { path: '/admin/fund-tracker', label: 'Fund Tracker', icon: <Briefcase className="h-4 w-4" /> },
        { path: '/admin/fee-management-tour', label: 'Fee Guide', icon: <ListTodo className="h-4 w-4" /> },
      ]
    },
    {
      id: 'operations',
      label: 'Operations',
      icon: <Settings className="h-5 w-5" />,
      type: 'group',
      items: [
        { path: '/admin/assets-management', label: 'Assets Management', icon: <Briefcase className="h-4 w-4" /> },
        { path: '/admin/sms-service', label: 'SMS Service', icon: <MessageSquare className="h-4 w-4" /> },
        { path: '/admin/myschool-suite', label: 'Content Generator', icon: <Bot className="h-4 w-4" /> },
        { path: '/admin/marketing', label: 'Marketing Leads', icon: <Target className="h-4 w-4" /> },
        { path: '/admin/devices', label: 'Login Devices', icon: <Shield className="h-4 w-4" /> },
      ]
    }
  ];

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isMenuExpanded = (menuId: string) => expandedMenus.includes(menuId);

  const isActivePath = (path: string) => location.pathname === path;

  const isActiveMenu = (menu: any) => {
    if (menu.type === 'single') {
      return isActivePath(menu.path);
    }
    if (menu.type === 'group') {
      return menu.items.some((item: any) => isActivePath(item.path));
    }
    return false;
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
      });
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
      });
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const renderMenuItem = (item: any) => {
    if (item.type === 'single') {
      return (
        <li key={item.id}>
          <Link
            to={item.path}
            className={cn(
              "flex items-center space-x-3 px-4 py-3 rounded-md transition-colors duration-200",
              isActivePath(item.path)
                ? "bg-white/20 text-white font-medium"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            )}
          >
            {item.icon}
            <span>{item.label}</span>
            {isActivePath(item.path) && (
              <ChevronRight className="h-4 w-4 ml-auto" />
            )}
          </Link>
        </li>
      );
    }

    if (item.type === 'group') {
      const isExpanded = isMenuExpanded(item.id);
      const isActive = isActiveMenu(item);

      return (
        <li key={item.id}>
          <button
            onClick={() => toggleMenu(item.id)}
            className={cn(
              "flex items-center justify-between w-full px-4 py-3 rounded-md transition-colors duration-200",
              isActive
                ? "bg-white/20 text-white font-medium"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            )}
          >
            <div className="flex items-center space-x-3">
              {item.icon}
              <span>{item.label}</span>
            </div>
            <ChevronDown 
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isExpanded ? "rotate-180" : ""
              )} 
            />
          </button>
          
          {isExpanded && (
            <ul className="mt-1 ml-6 space-y-1">
              {item.items.map((subItem: any) => (
                <li key={subItem.path}>
                  <Link
                    to={subItem.path}
                    className={cn(
                      "flex items-center space-x-3 px-4 py-2 rounded-md transition-colors duration-200 text-sm",
                      isActivePath(subItem.path)
                        ? "bg-white/20 text-white font-medium"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {subItem.icon}
                    <span>{subItem.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </li>
      );
    }

    return null;
  };

  const getCurrentPageTitle = () => {
    for (const item of navigationItems) {
      if (item.type === 'single' && isActivePath(item.path)) {
        return item.label;
      }
      if (item.type === 'group') {
        const activeSubItem = item.items.find((subItem: any) => isActivePath(subItem.path));
        if (activeSubItem) {
          return activeSubItem.label;
        }
      }
    }
    return 'Admin Panel';
  };

  return (
    <div className="flex h-screen bg-gray-100">
    {/* Desktop Sidebar */}
    <aside
      className={cn(
        "bg-school-primary text-white fixed inset-y-0 left-0 z-40 w-64 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-school-dark">
          <Link to="/admin" className="flex items-center space-x-2">
            <School className="h-8 w-8" />
            <span className="text-xl font-bold">School Admin</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white hover:bg-school-dark"
            onClick={toggleSidebar}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
              {navigationItems.map(renderMenuItem)}
          </ul>
        </nav>

        <div className="p-4 border-t border-school-dark">
          <Button
            variant="outline"
            className="w-full bg-transparent text-white border-white/20 hover:bg-white/10 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </aside>

    {/* Main Content */}
    <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
      {/* Top Navbar */}
      <header className="bg-white shadow-sm z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 lg:hidden"
              onClick={toggleMobileMenu}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
              onClick={toggleSidebar}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-800 ml-2">
                {getCurrentPageTitle()}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 hidden md:inline">Administrator</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={toggleMobileMenu}></div>
          <div className="absolute top-0 left-0 w-64 h-full bg-school-primary text-white">
            <div className="flex items-center justify-between p-4 border-b border-school-dark">
              <Link to="/admin" className="flex items-center space-x-2" onClick={toggleMobileMenu}>
                <School className="h-8 w-8" />
                <span className="text-xl font-bold">School Admin</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-school-dark"
                onClick={toggleMobileMenu}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

              <nav className="py-4 overflow-y-auto">
              <ul className="space-y-1 px-2">
                  {navigationItems.map((item) => {
                    if (item.type === 'single') {
                      return (
                        <li key={item.id}>
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 rounded-md transition-colors duration-200",
                              isActivePath(item.path)
                          ? "bg-white/20 text-white font-medium"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      )}
                      onClick={toggleMobileMenu}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                          </Link>
                        </li>
                      );
                    }

                    if (item.type === 'group') {
                      const isExpanded = isMenuExpanded(item.id);
                      const isActive = isActiveMenu(item);

                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => toggleMenu(item.id)}
                            className={cn(
                              "flex items-center justify-between w-full px-4 py-3 rounded-md transition-colors duration-200",
                              isActive
                                ? "bg-white/20 text-white font-medium"
                                : "text-white/80 hover:bg-white/10 hover:text-white"
                            )}
                          >
                            <div className="flex items-center space-x-3">
                              {item.icon}
                              <span>{item.label}</span>
                            </div>
                            <ChevronDown 
                              className={cn(
                                "h-4 w-4 transition-transform duration-200",
                                isExpanded ? "rotate-180" : ""
                              )} 
                            />
                          </button>
                          
                          {isExpanded && (
                            <ul className="mt-1 ml-6 space-y-1">
                              {item.items.map((subItem: any) => (
                                <li key={subItem.path}>
                                  <Link
                                    to={subItem.path}
                                    className={cn(
                                      "flex items-center space-x-3 px-4 py-2 rounded-md transition-colors duration-200 text-sm",
                                      isActivePath(subItem.path)
                                        ? "bg-white/20 text-white font-medium"
                                        : "text-white/70 hover:bg-white/10 hover:text-white"
                                    )}
                                    onClick={toggleMobileMenu}
                                  >
                                    {subItem.icon}
                                    <span>{subItem.label}</span>
                    </Link>
                  </li>
                ))}
                            </ul>
                          )}
                        </li>
                      );
                    }

                    return null;
                  })}
              </ul>
            </nav>

            <div className="p-4 border-t border-school-dark">
              <Button
                variant="outline"
                className="w-full bg-transparent text-white border-white/20 hover:bg-white/10 hover:text-white"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4">
        <Outlet />
      </main>
    </div>
  </div>
  );
};

export default AdminLayout;
