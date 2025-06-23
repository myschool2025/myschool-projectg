import { Facebook, Mail, Phone, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

const Contact = () => {
  const whatsappUrl = "https://wa.me/8801866882842"; // Replace with your WhatsApp number

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
      scale: 1.05,
      boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.2)",
      transition: { duration: 0.3 },
    },
    tap: { scale: 0.95 },
  };

  const contactItems = [
    {
      href: "tel:01866882842",
      icon: <Phone className="h-6 w-6 sm:h-8 sm:w-8 text-white" />,
      title: "ফোন",
      value: "01866882842",
    },
    {
      href: "mailto:myschoolcheorabazar@gmail.com",
      icon: <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-white" />,
      title: "ইমেইল",
      value: "myschoolcheorabazar@gmail.com",
    },
    {
      href: "https://www.facebook.com/profile.php?id=61570629429566",
      target: "_blank",
      rel: "noopener noreferrer",
      icon: <Facebook className="h-6 w-6 sm:h-8 sm:w-8 text-white" />,
      title: "ফেসবুক",
      value: "আমাদের অনুসরণ করুন",
    },
    {
      href: whatsappUrl,
      target: "_blank",
      rel: "noopener noreferrer",
      icon: <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />,
      title: "WhatsApp",
      value: "আমাদের মেসেজ করুন",
    },
  ];

  return (
    <motion.section
      id="contact"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      className="relative bg-gradient-to-r from-red-600 via-orange-500 to-yellow-600 py-16 sm:py-24 lg:py-32 overflow-hidden"
    >
      {/* Background Decorative Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 rounded-full filter blur-2xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-80 sm:h-80 bg-white/5 rounded-full filter blur-2xl animate-pulse delay-700" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Heading */}
        <div className="mx-auto max-w-2xl lg:mx-0 text-center lg:text-left">
          <motion.h2
            variants={childVariants}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white drop-shadow-md"
          >
            আমাদের সাথে যোগাযোগ করুন
          </motion.h2>
          <motion.p
            variants={childVariants}
            className="mt-4 sm:mt-6 text-base sm:text-lg lg:text-xl leading-8 text-white/90"
          >
            আমরা আপনার মতামত শোনার জন্য অপেক্ষা করছি। আমাদের সাথে যোগাযোগ করতে আপনি নিচের যেকোনো মাধ্যমে পৌঁছাতে পারেন।
          </motion.p>
        </div>

        {/* Contact Cards */}
        <motion.div
          variants={sectionVariants}
          className="mx-auto mt-12 sm:mt-16 max-w-2xl lg:mx-0 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {contactItems.map((item, index) => (
            <motion.a
              key={index}
              href={item.href}
              target={item.target || "_self"}
              rel={item.rel}
              variants={cardVariants}
              whileHover="hover"
              whileTap="tap"
              className="flex items-center gap-x-4 rounded-xl bg-white/20 backdrop-blur-lg p-4 sm:p-6 hover:bg-white/30 transition-colors shadow-md border border-white/30 overflow-hidden relative"
            >
              {/* Subtle Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

              <div className="relative z-10">{item.icon}</div>
              <div className="relative z-10 truncate">
                <h3 className="font-semibold text-white text-sm sm:text-base">
                  {item.title}
                </h3>
                <p className="mt-1 text-white/80 text-xs sm:text-sm lg:text-base">
                  {item.value}
                </p>
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
};

export default Contact;