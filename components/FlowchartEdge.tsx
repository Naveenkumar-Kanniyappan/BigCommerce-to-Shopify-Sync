import React from 'react';
import { Coordinates } from '../types';

interface FlowchartEdgeProps {
  source: Coordinates;
  target: Coordinates;
  label?: string;
}

export const FlowchartEdge: React.FC<FlowchartEdgeProps> = ({ source, target, label }) => {
  // Calculate control points for a smooth bezier curve
  const deltaY = target.y - source.y;
  const midY = source.y + deltaY / 2;

  // If strictly horizontal or close to vertical, adjust logic
  let path = '';
  
  if (Math.abs(source.x - target.x) < 2) {
      // Straight vertical line
      path = `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
  } else {
      // Curved line for branching
      path = `M ${source.x} ${source.y} C ${source.x} ${midY}, ${target.x} ${midY}, ${target.x} ${target.y}`;
  }

  // Calculate label position (approximate midpoint of curve)
  const labelX = (source.x + target.x) / 2;
  const labelY = (source.y + target.y) / 2;

  return (
    <g className="group">
      <path
        d={path}
        fill="none"
        stroke="black"
        strokeWidth="2"
        markerEnd="url(#arrowhead)"
        className="transition-all duration-300 group-hover:stroke-gray-600 group-hover:stroke-[3px]"
      />
      {label && (
        <g transform={`translate(${labelX}, ${labelY})`}>
          <rect
            x="-16"
            y="-10"
            width="32"
            height="20"
            fill="white"
            rx="4"
          />
          <text
            x="0"
            y="4"
            textAnchor="middle"
            className="text-[10px] font-bold fill-black uppercase tracking-wider"
          >
            {label}
          </text>
        </g>
      )}
    </g>
  );
};
