import React, { useState } from "react";
import { Button } from "@/components/ui/button"; // Ensure this path is correct
import { motion } from "framer-motion"; // ✅ Proper import

const Hero = () => {
  const [isHovered, setIsHovered] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.2,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      boxShadow: "0px 4px 15px rgba(255, 255, 255, 0.3)",
      transition: { duration: 0.3 },
    },
    tap: { scale: 0.95 },
  };

  return (
    <motion.section
      id="home"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative bg-gradient-to-br from-indigo-700 via-purple-600 to-blue-500 overflow-hidden py-16 sm:py-24 lg:py-32"
    >
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full filter blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Heading */}
          <motion.h1
            variants={childVariants}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-pink-300 p-2">
              মাইস্কুলে
            </span>{" "}
            স্বাগতম
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={childVariants}
            className="mt-6 text-lg sm:text-xl lg:text-2xl leading-8 text-gray-100 opacity-90"
          >
            মননশীল মন গঠন, ভবিষ্যত নির্মাণ। আমরা শিক্ষার্থীদের স্বপ্নকে বাস্তবে রূপ দিতে প্রতিশ্রুতিবদ্ধ।
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={childVariants}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
          >
            <motion.a
              href="#contact"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full text-primary font-semibold text-base sm:text-lg shadow-lg hover:from-yellow-500 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-yellow-300"
            >
              যোগাযোগ করুন
            </motion.a>

            <motion.a
              href="#about"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="w-full sm:w-auto px-6 py-3 bg-transparent border-2 border-white rounded-full text-white font-semibold text-base sm:text-lg hover:bg-white/10 transition-colors duration-300"
            >
              আমাদের সম্পর্কে জানুন
              <span
                className={`inline-block ml-2 transition-transform duration-300 ${
                  isHovered ? "translate-x-1" : ""
                }`}
                aria-hidden="true"
              >
                →
              </span>
            </motion.a>
          </motion.div>
        </div>

        {/* Optional Decorative Element */}
        <motion.div
          variants={childVariants}
          className="mt-12 hidden lg:block"
        >
          <div className="mx-auto w-16 h-1 bg-gradient-to-r from-yellow-400 to-transparent rounded-full" />
        </motion.div>
      </div> {/* ✅ Fixed closing div issue */}
    </motion.section>
  );
};

export default Hero;
