"use client";

import { motion, useDragControls } from 'motion/react';
import { GalleryTicket } from '@/types/ticket';
import { PhotoCard } from './PhotoCard';

interface DraggableCardProps {
  ticket: GalleryTicket;
  x: number;
  y: number;
  rotate: number;
  delay: number;
  dragConstraints?: any;
  onClick?: () => void;
}

export const DraggableCard = ({ ticket, x, y, rotate, delay, dragConstraints, onClick }: DraggableCardProps) => {
  const dragControls = useDragControls();

  return (
    <motion.div
      drag
      dragConstraints={dragConstraints}
      dragControls={dragControls}
      dragMomentum={false}
      initial={{ 
        y: -1000, 
        rotate: rotate + (Math.random() > 0.5 ? 180 : -180), 
        opacity: 0,
        scale: 1.2
      }}
      animate={{ x, y, rotate, opacity: 1, scale: 1 }}
      transition={{ 
        delay,
        type: "spring",
        stiffness: 30,
        damping: 15,
        mass: 1.2,
        y: { type: "spring", stiffness: 20, damping: 10, mass: 1.5 }
      }}
      whileHover={{ scale: 1.05, zIndex: 100 }}
      whileDrag={{ scale: 1.1, zIndex: 1000, rotate: 0, boxShadow: "0 30px 60px rgba(0,0,0,0.3)" }}
      // framer-motion 성능 최적화 (프레임 드랍 방지)
      style={{ willChange: "transform" }}
      className="absolute cursor-grab active:cursor-grabbing"
    >
      <div className="relative group">
        <PhotoCard
          ticket={ticket}
          className="shadow-2xl cursor-pointer"
          onClick={onClick}
        />
      </div>
    </motion.div>
  );
};
