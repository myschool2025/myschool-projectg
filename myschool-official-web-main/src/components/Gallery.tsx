
import React, { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const Gallery = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const images = [
    { url: "/one.jpg", alt: "Gallery Image 1" },
    { url: "/two.jpg", alt: "Gallery Image 2" },
    { url: "/twelve.jpg", alt: "Gallery Image 12" },
    { url: "/thirteen.jpg", alt: "Gallery Image 13" },
    { url: "/fourteen.jpg", alt: "Gallery Image 14" },
    { url: "/fifteen.jpg", alt: "Gallery Image 15" },
    { url: "/three.jpg", alt: "Gallery Image 3" },
    { url: "/four.jpg", alt: "Gallery Image 4" },
    { url: "/five.jpg", alt: "Gallery Image 5" },
    { url: "/six.jpg", alt: "Gallery Image 6" },
    { url: "/seven.jpg", alt: "Gallery Image 7" },
    { url: "/eight.jpg", alt: "Gallery Image 8" },
    { url: "/nine.jpg", alt: "Gallery Image 9" },
    { url: "/ten.jpg", alt: "Gallery Image 10" },
  ];

  // Animation variants
  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const slideVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const buttonVariants = {
    hover: { scale: 1.1, rotate: 5 },
    tap: { scale: 0.95 },
  };

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi || !isPlaying) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 3000);
    return () => clearInterval(interval);
  }, [emblaApi, isPlaying]);

  const togglePlay = () => setIsPlaying((prev) => !prev);
  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  return (
    <motion.section
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="relative bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 py-12 sm:py-20 lg:py-24 overflow-hidden"
    >
      {/* Background Decorative Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 rounded-full filter blur-2xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-80 sm:h-80 bg-white/5 rounded-full filter blur-2xl animate-pulse delay-700" />
      </div>

      {/* Heading */}
      <div className="text-center mb-8 sm:mb-12">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white drop-shadow-md"
        >
          আমাদের গ্যালারি
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-2 text-base sm:text-lg lg:text-xl text-white/90"
        >
          আমাদের স্কুলের স্মরণীয় মুহূর্তগুলি এখানে উপস্থাপন করা হলো।
        </motion.p>
      </div>

      {/* Carousel */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={emblaRef} className="overflow-hidden rounded-xl shadow-2xl">
          <motion.div className="flex" layout>
            {images.map((image, index) => (
              <motion.div
                key={index}
                variants={slideVariants}
                initial="hidden"
                animate={index === selectedIndex ? "visible" : "hidden"}
                className="flex-[0_0_100%] min-w-0"
              >
                <Card className="border-0 shadow-none bg-transparent">
                  <CardContent className="p-0">
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="w-full aspect-[16/9] sm:aspect-[21/9] object-cover rounded-xl transform transition-transform hover:scale-105"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Navigation Buttons */}
        <motion.button
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={scrollPrev}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-gray-800 to-gray-600 text-white p-2 sm:p-3 rounded-full shadow-lg z-10"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </motion.button>
        <motion.button
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={scrollNext}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-gray-800 to-gray-600 text-white p-2 sm:p-3 rounded-full shadow-lg z-10"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </motion.button>

        {/* Play/Pause Button */}
        <motion.button
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={togglePlay}
          className="absolute bottom-4 right-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2 sm:p-3 rounded-full shadow-lg z-10"
          aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 sm:h-6 sm:w-6" />
          ) : (
            <Play className="h-5 w-5 sm:h-6 sm:w-6" />
          )}
        </motion.button>
      </div>

      {/* Progress Dots */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="flex justify-center gap-2 sm:gap-3 mt-6 sm:mt-8"
      >
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
              index === selectedIndex
                ? "bg-white scale-125 shadow-md"
                : "bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </motion.div>
    </motion.section>
  );
};

export default Gallery;
