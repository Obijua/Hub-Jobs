import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, Download, Clock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyDocuments = () => {
  const [paidDocs, setPaidDocs] = useState<any[]>([]);

  useEffect(() => {
    const paid = JSON.parse(localStorage.getItem('cb_paid_docs') || '{}');
    const docs = [];
    
    if (paid['cv_draft']) {
      const data = JSON.parse(localStorage.getItem('cb_cv_draft') || '{}');
      docs.push({ id: 'cv_draft', type: 'cv', title: 'Professional CV', data });
    }
    if (paid['proposal_draft']) {
      const data = JSON.parse(localStorage.getItem('cb_proposal_draft') || '{}');
      docs.push({ id: 'proposal_draft', type: 'proposal', title: 'Business Proposal', data });
    }
    if (paid['plan_draft']) {
      const data = JSON.parse(localStorage.getItem('cb_plan_draft') || '{}');
      docs.push({ id: 'plan_draft', type: 'business-plan', title: 'Business Plan', data });
    }
    
    setPaidDocs(docs);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">My Documents</h1>
            <p className="text-gray-500">Access and re-download your paid documents anytime</p>
          </div>
          <Link 
            to="/documents"
            className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30"
          >
            Build New Document
          </Link>
        </div>

        {paidDocs.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {paidDocs.map((doc) => (
              <motion.div 
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-primary rounded-2xl flex items-center justify-center">
                    <FileText size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">{doc.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        Paid & Unlocked
                      </span>
                      <span className="capitalize">{doc.type.replace('-', ' ')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <Link 
                    to={`/documents/${doc.type}`}
                    className="flex-1 md:flex-none px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={18} />
                    View/Edit
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-[40px] border border-gray-100 dark:border-gray-800">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText size={40} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No documents yet</h2>
            <p className="text-gray-500 mb-8 max-w-xs mx-auto">You haven't unlocked any documents yet. Start building your first professional document today.</p>
            <Link 
              to="/documents"
              className="px-12 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 inline-block"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDocuments;
