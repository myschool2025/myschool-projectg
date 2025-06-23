
const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-6">
      <div className="container mx-auto px-4 text-center">
        <p className="mb-2">&copy; {new Date().getFullYear()} MySchool. All rights reserved.</p>
        <div className="flex justify-center gap-6">
          <a href="/assets" className="hover:text-blue-400 transition-colors">Assets</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
