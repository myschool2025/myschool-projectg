import { Outlet } from "react-router-dom";
import Navbar from "./../components/Navbar";
import Footer from "./../components/Footer";

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 via-blue-600 to-sky-600 to-green-500 to-yellow-500 to-orange-500 to-red-500 flex flex-col">
      <Navbar />
      <main className="w-full overflow-hidden flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;