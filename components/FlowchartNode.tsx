import React from 'react';
import { NodeData, NodeType } from '../types';
import { motion } from 'framer-motion';
import { Activity, Database, GitBranch, Play, StopCircle, UserCheck, AlertTriangle } from 'lucide-react';

interface FlowchartNodeProps {
  data: NodeData;
  onClick: (node: NodeData) => void;
  isSelected: boolean;
}

export const FlowchartNode: React.FC<FlowchartNodeProps> = ({ data, onClick, isSelected }) => {
  const { type, label, x, y } = data;

  // Node dimensions based on type
  const width = type === NodeType.DECISION ? 140 : 180;
  const height = type === NodeType.DECISION ? 100 : 60;
  
  // Center alignment offset
  const left = x - width / 2;
  const top = y - height / 2;

  // Icon mapping
  const getIcon = () => {
    switch (label) {
      case 'Start': return <Play size={16} fill="black" />;
      case 'End': return <StopCircle size={16} />;
      case 'Log Error': return <AlertTriangle size={16} />;
      case 'Fetch Customers': return <Database size={16} />;
      case 'Response Valid?': return <Activity size={16} />;
      case 'Customer Exists?': return <UserCheck size={16} />;
      default: return <GitBranch size={16} />;
    }
  };

  // Shape rendering
  const renderShape = () => {
    const commonClasses = `absolute inset-0 flex items-center justify-center border-2 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md ${
      isSelected ? 'bg-black text-white border-black scale-105 shadow-xl' : 'bg-white text-black border-black hover:bg-gray-50'
    }`;

    if (type === NodeType.DECISION) {
      // Diamond shape via rotation
      return (
        <div 
          className={`${commonClasses} transform rotate-45 rounded-xl`}
          onClick={() => onClick(data)}
        >
          <div className="transform -rotate-45 flex flex-col items-center justify-center p-2 text-center w-[140px]">
            <span className="mb-1 opacity-70">{getIcon()}</span>
            <span className="text-xs font-semibold leading-tight">{label}</span>
          </div>
        </div>
      );
    }

    if (type === NodeType.START || type === NodeType.END) {
       // Pill/Capsule shape
       return (
        <div 
          className={`${commonClasses} rounded-full`}
          onClick={() => onClick(data)}
        >
           <div className="flex items-center gap-2 px-4">
            {getIcon()}
            <span className="text-sm font-bold uppercase tracking-wide">{label}</span>
          </div>
        </div>
       );
    }

    // Default Process Rectangle
    return (
      <div 
        className={`${commonClasses} rounded-xl`}
        onClick={() => onClick(data)}
      >
        <div className="flex items-center gap-3 px-4 py-2">
           {getIcon()}
           <span className="text-sm font-medium">{label}</span>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: y / 1000 }} // Stagger based on Y position
      style={{
        position: 'absolute',
        left: left,
        top: top,
        width: width,
        height: height,
      }}
      className="z-10"
    >
      {renderShape()}
    </motion.div>
  );
};
