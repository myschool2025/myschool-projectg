import { motion } from "framer-motion";

const Stats = () => {
  // Animation variants
  const containerVariants = {
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

  const itemVariants = {
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

  const statCardVariants = {
    hover: {
      scale: 1.05,
      boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.2)",
      transition: { duration: 0.3 },
    },
  };

  const statsData = [
    { id: 1, name: "অতীতে অর্জিত সফলতা", value: "১+ বছর" },
    { id: 2, name: "শিক্ষার্থী সংখ্যা", value: "১০০+" },
    { id: 3, name: "প্রশিক্ষিত শিক্ষক", value: "১০+" },
    { id: 4, name: "সাফল্যের হার", value: "৯৫%" },
  ];

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      className="relative bg-gradient-to-r from-sky-500 via-emerald-400 to-yellow-400 py-16 sm:py-24 lg:py-32 overflow-hidden"
    >
      {/* Background Decorative Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full filter blur-2xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full filter blur-2xl animate-pulse delay-700" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:max-w-none text-center">
          {/* Heading */}
          <motion.h2
            variants={itemVariants}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white drop-shadow-md"
          >
            শত শত পরিবারের আস্থা অর্জন করেছে
          </motion.h2>

          {/* Subheading */}
          <motion.p
            variants={itemVariants}
            className="mt-4 text-lg sm:text-xl lg:text-2xl leading-8 text-white/90"
          >
            আমাদের উৎকর্ষতার প্রতিশ্রুতি আমাদের পরিসংখ্যানে প্রতিফলিত হয়
          </motion.p>

          {/* Stats Grid */}
          <motion.dl
            variants={containerVariants}
            className="mt-12 sm:mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {statsData.map((stat) => (
              <motion.div
                key={stat.id}
                variants={statCardVariants}
                whileHover="hover"
                className="relative flex flex-col bg-white/20 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-lg border border-white/30 overflow-hidden"
              >
                {/* Subtle Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

                <dt className="text-sm sm:text-base font-semibold leading-6 text-white z-10">
                  {stat.name}
                </dt>
                <dd className="order-first text-3xl sm:text-4xl font-bold tracking-tight text-white z-10">
                  {stat.value}
                </dd>
              </motion.div>
            ))}
          </motion.dl>
        </div>
      </div>
    </motion.section>
  );
};

export default Stats;