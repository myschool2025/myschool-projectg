
import React from 'react';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Gallery from '@/components/Gallery';
import Stats from '@/components/Stats';
import Contact from '@/components/Contact';

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <About />
      <Gallery />
      <Stats />
      <Contact />
    </div>
  );
};

export default Index;
