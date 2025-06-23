import React from 'react';
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { SmilePlus, LockKeyhole, Coffee } from 'lucide-react';

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full mx-4 text-center space-y-6">
        <div className="animate-shake">
          <LockKeyhole className="w-20 h-20 text-red-500 mx-auto" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 flex items-center justify-center gap-3">
          <span>🔐</span>
          <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Secret Agent Zone!
          </span>
          <span>🕵️</span>
        </h1>

        <p className="text-lg text-gray-600">
          Oops! Looks like you need special clearance to view this page.<br/>
          Our system hamsters are checking your credentials... 🐹
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all
                       flex items-center justify-center gap-2"
          >
            🏡 Return to Safety
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 bg-orange-100 text-orange-600 rounded-full hover:bg-orange-200 transition-all
                       flex items-center justify-center gap-2"
          >
            🚨 Request Access
          </Link>
        </div>

        <p className="text-sm text-gray-400 mt-6">
          Pro tip: Try bribing the hamsters with virtual carrots 🥕
        </p>
      </div>
    </div>
  );
};


export default Unauthorized ;