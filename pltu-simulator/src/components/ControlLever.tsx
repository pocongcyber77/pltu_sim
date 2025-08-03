'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ControlLever as ControlLeverType } from '../types';

interface ControlLeverProps {
  lever: ControlLeverType;
  onValueChange: (value: number) => void;
}

export default function ControlLever({ lever, onValueChange }: ControlLeverProps) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const percentage = ((lever.currentValue - lever.minValue) / (lever.maxValue - lever.minValue)) * 100;

  const calculateValueFromY = (clientY: number): number => {
    if (!containerRef.current) return lever.currentValue;
    
    const rect = containerRef.current.getBoundingClientRect();
    const height = rect.height;
    const y = clientY - rect.top;
    const clampedY = Math.max(0, Math.min(height, y));
    const invertedPercentage = 100 - (clampedY / height) * 100;
    const value = lever.minValue + (invertedPercentage / 100) * (lever.maxValue - lever.minValue);
    
    return Math.max(lever.minValue, Math.min(lever.maxValue, value));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newValue = calculateValueFromY(e.clientY);
    onValueChange(newValue);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    
    const newValue = calculateValueFromY(e.touches[0].clientY);
    onValueChange(newValue);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    const newValue = calculateValueFromY(e.clientY);
    onValueChange(newValue);
  };

  const handleArrowUp = () => {
    const newValue = Math.min(lever.maxValue, lever.currentValue + 5);
    onValueChange(newValue);
  };

  const handleArrowDown = () => {
    const newValue = Math.max(lever.minValue, lever.currentValue - 5);
    onValueChange(newValue);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging]);

  return (
    <div className="flex flex-col items-center space-y-1 lg:space-y-2">
      <div className="text-center">
        <h3 className="text-xs font-semibold text-white">{lever.name}</h3>
        <p className="text-xs text-gray-400 hidden lg:block">{lever.description}</p>
      </div>
      
      <div className="flex items-center space-x-1 lg:space-x-2">
        {/* Arrow Up */}
        <button
          onClick={handleArrowUp}
          className="w-4 h-4 lg:w-6 lg:h-6 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center transition-colors"
          disabled={lever.currentValue >= lever.maxValue}
        >
          <svg className="w-2 h-2 lg:w-3 lg:h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
        
        {/* Lever Track */}
        <div 
          ref={containerRef}
          className="relative w-3 h-12 lg:w-4 lg:h-20 bg-gray-700 rounded-full border border-green-500 cursor-pointer select-none"
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={{ touchAction: 'none' }}
        >
          {/* Lever indicator */}
          <div 
            className={`absolute w-2 h-2 lg:w-3 lg:h-3 ${lever.color} rounded-full shadow-lg transition-all duration-150 ${
              isDragging ? 'scale-125' : 'hover:scale-110'
            }`}
            style={{
              top: `${100 - percentage}%`,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10
            }}
          />
          
          {/* Scale marks */}
          <div className="absolute left-0 right-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none">
            {[0, 25, 50, 75, 100].map((mark) => (
              <div key={mark} className="w-1 h-0.5 bg-green-400 mx-auto" />
            ))}
          </div>
        </div>
        
        {/* Arrow Down */}
        <button
          onClick={handleArrowDown}
          className="w-4 h-4 lg:w-6 lg:h-6 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center transition-colors"
          disabled={lever.currentValue <= lever.minValue}
        >
          <svg className="w-2 h-2 lg:w-3 lg:h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div className="text-center">
        <div className="text-xs lg:text-sm font-bold text-green-400">
          {lever.currentValue.toFixed(0)}{lever.unit}
        </div>
        <div className="text-xs text-gray-400 hidden lg:block">
          {lever.minValue}-{lever.maxValue}{lever.unit}
        </div>
      </div>
    </div>
  );
} 