'use client';

import { motion } from 'framer-motion';
import { ControlLever as ControlLeverType } from '@/types';

interface ControlLeverProps {
  lever: ControlLeverType;
  onValueChange: (value: number) => void;
}

export default function ControlLever({ lever, onValueChange }: ControlLeverProps) {
  const percentage = ((lever.currentValue - lever.minValue) / (lever.maxValue - lever.minValue)) * 100;

  const handleDrag = (event: any, info: any) => {
    const container = event.target.closest('.lever-container');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const height = rect.height;
    const y = info.point.y - rect.top;
    const clampedY = Math.max(0, Math.min(height, y));
    const invertedPercentage = 100 - (clampedY / height) * 100;
    const value = lever.minValue + (invertedPercentage / 100) * (lever.maxValue - lever.minValue);
    
    onValueChange(value);
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="text-center">
        <h3 className="text-sm font-semibold text-gray-800">{lever.name}</h3>
        <p className="text-xs text-gray-600">{lever.description}</p>
      </div>
      
      <div className="lever-container relative w-8 h-32 bg-gray-200 rounded-full border-2 border-gray-300">
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0}
          dragMomentum={false}
          onDrag={handleDrag}
          className={`absolute w-6 h-6 ${lever.color} rounded-full cursor-grab active:cursor-grabbing shadow-lg`}
          style={{
            top: `${100 - percentage}%`,
            left: '50%',
            transform: 'translateX(-50%)'
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        />
        
        {/* Scale marks */}
        <div className="absolute left-0 right-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none">
          {[0, 25, 50, 75, 100].map((mark) => (
            <div key={mark} className="w-2 h-0.5 bg-gray-400 mx-auto" />
          ))}
        </div>
      </div>
      
      <div className="text-center">
        <div className="text-lg font-bold text-gray-800">
          {lever.currentValue.toFixed(0)}{lever.unit}
        </div>
        <div className="text-xs text-gray-500">
          {lever.minValue}-{lever.maxValue}{lever.unit}
        </div>
      </div>
    </div>
  );
} 