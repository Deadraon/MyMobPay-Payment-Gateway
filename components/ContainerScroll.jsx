'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';

export const ContainerScroll = ({
  titleComponent,
  children,
  className = '',
}) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [0.85, 0.98] : [1.05, 1];
  };

  // As user scrolls through section: tilts smoothly from 20deg to 0deg (upright)
  const rotate = useTransform(scrollYProgress, [0.05, 0.45], [20, 0]);
  const scale = useTransform(scrollYProgress, [0.05, 0.45], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0.05, 0.45], [0, -40]);

  return (
    <div
      ref={containerRef}
      className={`min-h-[50rem] md:min-h-[64rem] flex items-center justify-center relative p-3 sm:p-6 md:p-12 overflow-hidden ${className}`}
    >
      <div
        className="py-6 sm:py-12 md:py-16 w-full relative"
        style={{
          perspective: '1200px',
        }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} translate={translate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({ translate, titleComponent }) => {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="max-w-4xl mx-auto text-center mb-6 sm:mb-10 md:mb-12 relative z-10 px-4"
    >
      {titleComponent}
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  children,
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        transformStyle: 'preserve-3d',
        boxShadow:
          '0 20px 80px -15px rgba(13, 37, 61, 0.16), 0 0 40px -10px rgba(83, 58, 253, 0.08), 0 4px 20px -2px rgba(0, 0, 0, 0.04)',
      }}
      className="max-w-5xl mx-auto w-full p-2.5 sm:p-4 md:p-5 bg-gradient-to-b from-slate-200/90 via-slate-100/70 to-slate-200/80 rounded-[30px] sm:rounded-[38px] transition-all duration-200"
    >
      <div className="w-full overflow-hidden rounded-[22px] sm:rounded-[30px] bg-white shadow-xs">
        {children}
      </div>
    </motion.div>
  );
};

export default ContainerScroll;
