import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useToast } from "@/hooks/use-toast";

const baseNavRoutes = [
  { label: "Home", path: "/" },
  { label: "Submit Data", path: "/submit-student-data" },
  { label: "Assets", path: "/assets" },
  { label: "School Results", path: "/school-results" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "staff" | "student" | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Animation variants
  const navVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const linkVariants = {
    hover: { scale: 1.05, color: "#e5e7eb" },
    tap: { scale: 0.95 },
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: "auto", transition: { duration: 0.3 } },
  };

  const mobileItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  // Fetch user auth state, role, and verified status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const role = userData.role as "admin" | "staff" | "student";
            const verified = userData.verified || false;
            setUserRole(role);
            setIsVerified(verified);
            if (verified) {
              // Navigate to dashboard for verified users
              const dashboardPath = role === "admin" ? "/admin" : role === "staff" ? "/staff" : "/student";
              if (!window.location.pathname.startsWith(dashboardPath)) {
                console.log(`Navbar - Navigating verified user to ${dashboardPath}`);
                navigate(dashboardPath);
              }
            } else {
              // Navigate to pending-verification for unverified users
              if (window.location.pathname !== "/pending-verification") {
                console.log("Navbar - Navigating unverified user to /pending-verification");
                navigate("/pending-verification");
                toast({
                  variant: "destructive",
                  title: "Account Not Verified",
                  description: "Your account is pending verification. Please contact the admin.",
                });
              }
            }
          } else {
            console.error("User document not found");
            setIsAuthenticated(false);
            setUserRole(null);
            setIsVerified(false);
            navigate("/login");
            toast({
              variant: "destructive",
              title: "Error",
              description: "User data not found. Please sign in again.",
            });
          }
        } catch (error: any) {
          console.error("Error fetching user data:", error);
          setIsAuthenticated(false);
          setUserRole(null);
          setIsVerified(false);
          navigate("/login");
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch user data.",
          });
        }
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
        setIsVerified(false);
        // Only navigate to /login if on a protected route
        if (
          window.location.pathname.startsWith("/admin") ||
          window.location.pathname.startsWith("/staff") ||
          window.location.pathname.startsWith("/student")
        ) {
          console.log("Navbar - No user authenticated, navigating to /login");
          navigate("/login");
        }
      }
    });

    return () => unsubscribe();
  }, [navigate, toast]);

  // Dynamically set nav routes
  const navRoutes = isAuthenticated
    ? [
        ...baseNavRoutes,
        ...(isVerified
          ? [{ label: "Dashboard", path: `/${userRole}` }]
          : [{ label: "Pending Verification", path: "/pending-verification" }]),
      ]
    : [...baseNavRoutes, { label: "Sign In", path: "/login" }];

  return (
    <motion.nav
      variants={navVariants}
      initial="hidden"
      animate="visible"
      className="bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600 shadow-xl sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo Section */}
          <motion.div
            className="flex-shrink-0 flex items-center space-x-3"
            whileHover={{ scale: 1.05 }}
          >
            <Link to="/" className="flex items-center space-x-3">
              <img
                src="/my-school-logo.jpg"
                alt="School Logo"
                className="h-12 w-12 object-cover rounded-full border-2 border-white/20 shadow-md"
                onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/48")}
              />
              <span className="text-2xl lg:text-3xl font-extrabold text-white">
                MySchool-মাইস্কুল
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navRoutes.map((route) => (
              <motion.div
                key={route.label}
                variants={linkVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Link
                  to={route.path}
                  className="text-white text-lg font-medium px-1 py-2 hover:underline underline-offset-4"
                >
                  {route.label}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <motion.div
            className="md:hidden flex items-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white p-2 rounded-full hover:bg-white/10"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </motion.div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="md:hidden bg-white/10 backdrop-blur-md border-t border-white/10"
          >
            <div className="px-4 pt-4 pb-6 space-y-2">
              {navRoutes.map((route) => (
                <motion.div key={route.label} variants={mobileItemVariants}>
                  <Link
                    to={route.path}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 text-white text-lg font-medium rounded-lg hover:bg-white/20"
                  >
                    {route.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;