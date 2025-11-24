export enum NodeType {
  START = 'START',
  PROCESS = 'PROCESS',
  DECISION = 'DECISION',
  END = 'END',
}

export interface Coordinates {
  x: number;
  y: number;
}

export interface NodeData {
  id: string;
  type: NodeType;
  label: string;
  description?: string; // For AI context
  x: number;
  y: number;
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
  label?: string; // For decision branches (Yes/No)
  pathType?: 'straight' | 'curved' | 'elbow';
}

export interface AIResponse {
  explanation: string;
  tips: string[];
}
