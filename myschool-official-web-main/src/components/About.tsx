import { motion } from "framer-motion";

const About = () => {
  // Animation variants
  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.2,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const cardVariants = {
    hover: {
      scale: 1.02,
      boxShadow: "0px 15px 30px rgba(0, 0, 0, 0.2)",
      transition: { duration: 0.4 },
    },
  };

  return (
    <motion.section
      id="about"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      className="relative bg-gradient-to-r from-yellow-600 via-orange-500 to-red-600 py-16 sm:py-24 lg:py-32 overflow-hidden"
    >
      {/* Background Decorative Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full filter blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* About Header */}
        <div className="mx-auto max-w-2xl lg:mx-0 text-center lg:text-left">
          <motion.h2
            variants={childVariants}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white drop-shadow-md"
          >
            আমাদের সম্পর্কে
          </motion.h2>
          <motion.p
            variants={childVariants}
            className="mt-6 text-lg sm:text-xl leading-8 text-white/90"
          >
            MySchool-মাইস্কুল-এ, আমরা বিশ্বাস করি যে, তরুণ মনগুলি দায়িত্বশীল, উদ্ভাবনী এবং সহানুভূতিশীল ব্যক্তিত্বে পরিণত হতে সাহায্য করতে হবে। আমাদের লক্ষ্য হল এমন একটি পূর্ণাঙ্গ শিক্ষা প্রদান করা যা শিক্ষার্থীদের আগামী দিনের চ্যালেঞ্জগুলির জন্য প্রস্তুত করবে।
          </motion.p>
        </div>

        {/* Chairman's Message */}
        <motion.div
          variants={cardVariants}
          whileHover="hover"
          className="mx-auto mt-12 sm:mt-16 max-w-2xl lg:max-w-none rounded-3xl bg-gradient-to-r from-purple-600 via-blue-600 to-sky-600 shadow-xl ring-1 ring-white/20 overflow-hidden"
        >
<div className="p-6 sm:p-10 flex flex-col items-center text-center lg:flex lg:flex-col">
  <motion.div variants={childVariants} className="flex-shrink-0">
    <img
      src="/chairman.jpg"
      alt="Chairman"
      className="w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56 rounded-full object-cover border-4 border-white shadow-lg transform transition-transform hover:scale-105"
    />
  </motion.div>

  <div className="mt-6 lg:mt-6 max-w-3xl">
    <motion.h3
      variants={childVariants}
      className="text-2xl sm:text-3xl font-bold tracking-tight text-white"
    >
      চেয়ারম্যানের বার্তা
    </motion.h3>

    <motion.p
      variants={childVariants}
      className="mt-4 text-base sm:text-lg leading-7 text-white/90"
    >
      "শিক্ষা শুধু একাডেমিক উৎকর্ষতা সম্পর্কে নয়; এটি চরিত্র গঠন, সৃজনশীলতা উত্সাহিত করা, এবং এমন মূল্যবোধ প্রতিষ্ঠা করার বিষয় যা আমাদের শিক্ষার্থীদের সারা জীবনের পথে নির্দেশনা দেবে। MySchool-মাইস্কুল-এ, আমরা একটি পরিবেশ তৈরি করতে প্রতিশ্রুতিবদ্ধ যেখানে প্রতিটি ছাত্র তার পূর্ণ সম্ভাবনায় পৌঁছাতে পারে।"
    </motion.p>
  </div>
</div>

        </motion.div>
      </div>
    </motion.section>
  );
};

export default About;