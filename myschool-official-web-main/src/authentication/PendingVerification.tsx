import React from 'react';
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { SmilePlus, LockKeyhole, Coffee,Rocket } from 'lucide-react';

const PendingVerification = () => {
  const { toast } = useToast();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-4">
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl max-w-2xl w-full mx-4 text-center space-y-6 animate-fade-in">
      <div className="flex justify-center">
        <div className="relative animate-bounce">
          <SmilePlus className="w-16 h-16 md:w-20 md:h-20 text-yellow-400" />
          <Coffee className="w-6 h-6 md:w-8 md:h-8 absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 text-brown-500 animate-spin-slow" />
        </div>
      </div>

      <h1 className="text-2xl md:text-4xl font-bold text-gray-800">
        🚀 Your Account is Brewing!
      </h1>

      <div className="space-y-4">
        <p className="text-base md:text-lg text-gray-600">
          Great job setting up your account! Our admin team is currently
          <span className="text-purple-600 font-medium"> quality-testing </span>
          your details with digital coffee ☕
        </p>
        <div className="flex items-center justify-center space-x-2 bg-gray-100 p-3 rounded-full">
          <div className="h-2 w-24 md:w-32 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-400 to-blue-400 animate-progress"
              style={{ width: '66%' }}
            />
          </div>
          <span className="text-xs md:text-sm text-gray-500">66% caffeinated</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 justify-center">
        <Link
          to="/"
          className="px-4 py-2 md:px-6 md:py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all
                     flex items-center justify-center gap-2 text-sm md:text-base"
        >
          🏡 Home Sweet Home
        </Link>
        <button
          onClick={() =>
            toast({
              title: "Admin Team Contact",
              description: "Shoot a message to myschoolcheorabazar@gmail.com - we promise no spam! 📬",
            })
          }
          className="px-4 py-2 md:px-6 md:py-3 bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-all
                     flex items-center justify-center gap-2 text-sm md:text-base"
        >
          📬 Email the Admin Squad
        </button>
      </div>

      <div className="mt-4">
        <Link
          to="/login"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm md:text-base"
        >
          <Rocket className="w-4 h-4 mr-2" />
          Already Verified? Blast off to Login!
        </Link>
      </div>

      <p className="text-xs md:text-sm text-gray-400 mt-4">
        P.S. Did you know? The average verification takes 2.4 sips of coffee ☕
      </p>
    </div>
  </div>
);
};




export default PendingVerification ;