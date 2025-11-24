import React, { useState } from 'react';
import { NodeData, EdgeData, NodeType } from './types';
import { FlowchartNode } from './components/FlowchartNode';
import { FlowchartEdge } from './components/FlowchartEdge';
import { X, ZoomIn, ZoomOut, Maximize, MousePointer2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Workflow Definition based on Documentation ---
const NODES: NodeData[] = [
  // 1. Start
  { 
    id: 'start', 
    type: NodeType.START, 
    label: 'Start: Get last_sync_time', 
    x: 700, y: 50, 
    description: 'Input: special.last_sync_time (Time of previous sync). Starts the workflow process.' 
  },
  
  // 2. Formatter
  { 
    id: 'formatter', 
    type: NodeType.PROCESS, 
    label: 'Formatter: Timezone', 
    x: 700, y: 150, 
    description: 'Purpose: Converts timezone from Indian/Chagos to UTC.\nWhy: BigCommerce queries require "date_modified:min" in UTC format.' 
  },
  
  // 3. Code Runner (Init)
  { 
    id: 'init_vars', 
    type: NodeType.PROCESS, 
    label: 'Code Runner: Init Page=1', 
    x: 700, y: 250, 
    description: 'Purpose: Initializes the "page" variable to 1.\nWhy: Sets up the pagination counter for the loop.' 
  },

  // 4. Pagination Loop (Start)
  { 
    id: 'pagination_loop', 
    type: NodeType.PROCESS, 
    label: 'Pagination Loop (While)', 
    x: 700, y: 350, 
    description: 'Purpose: Control node for batch processing.\nWhy: Iterates through BigCommerce data page-by-page until all customers are fetched.' 
  },

  // 5. API Call: BigCommerce
  { 
    id: 'bc_api', 
    type: NodeType.PROCESS, 
    label: 'BigCommerce: Get Customers', 
    x: 700, y: 450, 
    description: 'Purpose: Fetches customers using "date_modified:min".\nWhy: Retrieves only new or updated customers from the source of truth.' 
  },

  // 6. Decision: Response Valid?
  { 
    id: 'valid_response', 
    type: NodeType.DECISION, 
    label: 'Status 200/201?', 
    x: 700, y: 560, 
    description: 'Purpose: Checks HTTP status code.\nWhy: Ensures API call was successful. If not, logs error and stops execution.' 
  },
    // -> Error Path
    { 
      id: 'log_error', 
      type: NodeType.PROCESS, 
      label: 'Log Error & Break', 
      x: 1000, y: 560, 
      description: 'Purpose: Logs the failure response body.\nWhy: Prevents infinite loops and provides audit trail for troubleshooting.' 
    },
    { 
      id: 'end_error', 
      type: NodeType.END, 
      label: 'End (Error)', 
      x: 1200, y: 560, 
      description: 'Stops workflow due to API failure.' 
    },

  // 7. Loop (For Each Customer)
  { 
    id: 'customer_loop', 
    type: NodeType.PROCESS, 
    label: 'Loop: For Each Customer', 
    x: 700, y: 680, 
    description: 'Purpose: Iterates through the list of customers in the current page response.\nWhy: Processes one customer at a time for synchronization.' 
  },

  // 8. API Call: Shopify Retrieve
  { 
    id: 'shopify_check', 
    type: NodeType.PROCESS, 
    label: 'Shopify: Check Existence', 
    x: 700, y: 780, 
    description: 'Purpose: Retrieves a list of customers from Shopify filtering by email.\nWhy: Checks if the customer already exists to avoid duplicates.' 
  },

  // 9. Decision: Customer Exists?
  { 
    id: 'exists_check', 
    type: NodeType.DECISION, 
    label: 'Email Exists?', 
    x: 700, y: 880, 
    description: 'Purpose: Logic check on Shopify response (NOT IN / IN).\nWhy: Determines whether to Create new or Skip/Update.' 
  },

    // -> NO (Create) Path
    { 
      id: 'create_customer', 
      type: NodeType.PROCESS, 
      label: 'Shopify: Create Customer', 
      x: 400, y: 880, 
      description: 'Purpose: POST request to create customer.\nMappings:\n- source.first_name -> dest.first_name\n- source.address -> dest.address\n- phone -> dest.phone (strips +1)\n- email -> verified_email (validated)' 
    },
    { 
      id: 'detail_logger', 
      type: NodeType.PROCESS, 
      label: 'Detail Logger', 
      x: 400, y: 980, 
      description: 'Purpose: Records success or failure with Entity ID.\nWhy: Essential for auditing and verifying sync status.' 
    },

    // -> YES (Skip) Path
    { 
      id: 'log_skip', 
      type: NodeType.PROCESS, 
      label: 'Log: Skip Customer', 
      x: 1000, y: 880, 
      description: 'Purpose: Logs that customer already exists.\nWhy: Prevents duplicate data creation.' 
    },

  // 10. Increment Page
  { 
    id: 'inc_page', 
    type: NodeType.PROCESS, 
    label: 'Code Runner: Page++', 
    x: 700, y: 1100, 
    description: 'Purpose: Increments the "page" variable (page = page + 1).\nWhy: Advances the pagination cursor for the next BigCommerce API call.' 
  },

  // 11. End
  { 
    id: 'end_workflow', 
    type: NodeType.END, 
    label: 'End Workflow', 
    x: 700, y: 1250, 
    description: 'Workflow completes when all pages are processed or an error occurs.' 
  }
];

const EDGES: EdgeData[] = [
  // Init sequence
  { id: 'e1', source: 'start', target: 'formatter' },
  { id: 'e2', source: 'formatter', target: 'init_vars' },
  { id: 'e3', source: 'init_vars', target: 'pagination_loop' },
  
  // Fetch & Validate
  { id: 'e4', source: 'pagination_loop', target: 'bc_api' },
  { id: 'e5', source: 'bc_api', target: 'valid_response' },
  
  // Validation branches
  { id: 'e6', source: 'valid_response', target: 'log_error', label: 'No (Error)' },
  { id: 'e7', source: 'log_error', target: 'end_error' },
  { id: 'e8', source: 'valid_response', target: 'customer_loop', label: 'Yes (200/201)' },
  
  // Customer Process
  { id: 'e9', source: 'customer_loop', target: 'shopify_check' },
  { id: 'e10', source: 'shopify_check', target: 'exists_check' },
  
  // Existence branches
  { id: 'e11', source: 'exists_check', target: 'create_customer', label: 'No (Create)' },
  { id: 'e12', source: 'exists_check', target: 'log_skip', label: 'Yes (Skip)' },
  
  // Re-convergence
  { id: 'e13', source: 'create_customer', target: 'detail_logger' },
  
  // Loop logic (Connecting back to main flow visualization)
  { id: 'e14', source: 'detail_logger', target: 'inc_page' },
  { id: 'e15', source: 'log_skip', target: 'inc_page' },
  
  // Loop Back Visual (Curved line back up implied, or flow to end)
  { id: 'e16', source: 'inc_page', target: 'end_workflow' }
];

export default function App() {
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(Math.max(prev + delta, 0.4), 2));
  };

  return (
    <div className="w-full h-screen bg-white flex overflow-hidden text-black selection:bg-black selection:text-white font-sans">
      
      {/* Sidebar / Overlay for Node Details */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full md:w-96 bg-white border-l-4 border-black z-50 shadow-2xl overflow-y-auto"
          >
            <div className="p-8 flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-black mb-1 tracking-tight">{selectedNode.label}</h2>
                    <span className="text-xs font-mono uppercase tracking-widest text-gray-500 bg-gray-100 px-2 py-1 rounded">{selectedNode.type}</span>
                </div>
                <button 
                  onClick={() => setSelectedNode(null)}
                  className="p-2 hover:bg-black hover:text-white rounded-full transition-colors border-2 border-transparent hover:border-black"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                    <MousePointer2 size={16} /> Technical Documentation
                </h3>
                <div className="text-gray-800 leading-relaxed text-sm font-mono border-l-4 border-black pl-4 whitespace-pre-wrap bg-gray-50 p-4 rounded-r-lg">
                  {selectedNode.description}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Toolbar */}
      <div className="fixed top-6 left-6 z-40 bg-white border-2 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-2 rounded-lg">
        <button onClick={() => handleZoom(0.1)} className="p-2 hover:bg-black hover:text-white transition-colors rounded" title="Zoom In"><ZoomIn size={20} /></button>
        <button onClick={() => handleZoom(-0.1)} className="p-2 hover:bg-black hover:text-white transition-colors rounded" title="Zoom Out"><ZoomOut size={20} /></button>
        <button onClick={() => setZoom(0.8)} className="p-2 hover:bg-black hover:text-white transition-colors rounded" title="Reset"><Maximize size={20} /></button>
      </div>

      <div className="fixed top-6 right-6 md:right-auto md:left-24 z-30 pointer-events-none">
          <div className="bg-white px-6 py-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] inline-block pointer-events-auto rounded-lg">
            <h1 className="text-xl font-black tracking-tighter uppercase">
              Workflow <span className="font-light text-gray-400 mx-2">/</span> Customer Sync
            </h1>
            <p className="text-xs font-mono text-gray-500 mt-1">BigCommerce <ArrowRight className="inline" size={10}/> Shopify</p>
          </div>
      </div>

      {/* Flowchart Canvas */}
      <div className="flex-1 relative overflow-auto cursor-grab active:cursor-grabbing bg-white">
        {/* Grid Background */}
        <div className="absolute inset-0 z-0 opacity-10" 
             style={{ 
               backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
               backgroundSize: '40px 40px'
             }}
        ></div>

        <div 
            className="absolute min-w-full min-h-full transition-transform duration-100 ease-out origin-top-left"
            style={{ 
                transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                width: '2000px', // Increased canvas size
                height: '1600px'
            }}
        >
            <svg className="w-full h-full absolute inset-0 pointer-events-none z-0">
                <defs>
                    <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
                        <path d="M0,0 L8,4 L0,8 z" fill="black" />
                    </marker>
                </defs>
                {EDGES.map(edge => {
                    const sourceNode = NODES.find(n => n.id === edge.source);
                    const targetNode = NODES.find(n => n.id === edge.target);
                    if (!sourceNode || !targetNode) return null;
                    return (
                        <FlowchartEdge 
                            key={edge.id} 
                            source={sourceNode} 
                            target={targetNode} 
                            label={edge.label}
                        />
                    );
                })}
            </svg>

            {NODES.map(node => (
                <FlowchartNode 
                    key={node.id} 
                    data={node} 
                    onClick={setSelectedNode}
                    isSelected={selectedNode?.id === node.id}
                />
            ))}
        </div>
      </div>
    </div>
  );
}