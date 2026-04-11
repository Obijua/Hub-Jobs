import React from 'react';
import { motion } from 'motion/react';
import { Lock, Download, ShieldCheck } from 'lucide-react';
import { useDocumentSettings } from '../hooks/useDocumentSettings';
import { cleanAIResponse } from '../lib/gemini';

import html2pdf from 'html2pdf.js';

interface DocumentPreviewProps {
  documentData: any;
  documentType: 'cv' | 'proposal' | 'business-plan';
  isPaid: boolean;
  paymentRef?: string;
  onPayClick: () => void;
  price: number;
  filename?: string;
}

const DocumentHTML = ({ data, type }: { data: any; type: string }) => {
  if (type === 'cv') {
    return (
      <div className="bg-white p-10 font-sans text-gray-900 leading-relaxed shadow-lg border border-gray-100 min-h-[1100px]">
        {/* Header */}
        <div className="bg-blue-900 text-white p-8 rounded-xl mb-8">
          <h1 className="text-4xl font-black mb-2 uppercase tracking-tight">{data.fullName || 'YOUR FULL NAME'}</h1>
          <p className="text-amber-400 font-bold text-xl mb-4">{data.professionalTitle || 'PROFESSIONAL TITLE'}</p>
          <div className="flex flex-wrap gap-4 text-sm opacity-90">
            {data.email && <span>📧 {data.email}</span>}
            {data.phone && <span>📞 {data.phone}</span>}
            {data.location && <span>📍 {data.location}</span>}
            {data.linkedin && <span>🔗 {data.linkedin}</span>}
          </div>
        </div>

        {/* Summary */}
        <div className="mb-8">
          <h2 className="text-blue-900 font-black text-lg uppercase border-b-2 border-amber-400 pb-1 mb-4">Professional Summary</h2>
          <p className="text-gray-700">{data.summary ? cleanAIResponse(data.summary) : 'A brief professional summary about your skills and career goals.'}</p>
        </div>

        {/* Experience */}
        <div className="mb-8">
          <h2 className="text-blue-900 font-black text-lg uppercase border-b-2 border-amber-400 pb-1 mb-4">Work Experience</h2>
          {data.experience?.length > 0 ? data.experience.map((exp: any, i: number) => (
            <div key={i} className="mb-6">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="font-black text-gray-900">{exp.jobTitle}</h3>
                <span className="text-sm font-bold text-gray-500">{exp.startDate} - {exp.endDate || 'Present'}</span>
              </div>
              {(exp.companyName?.trim() || exp.location?.trim()) && (
                <p className="text-blue-800 font-bold text-sm mb-2">
                  {exp.companyName?.trim()}{exp.companyName?.trim() && exp.location?.trim() ? ' | ' : ''}{exp.location?.trim()}
                </p>
              )}
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                {exp.responsibilities?.split('\n')
                  .map((l: string) => cleanAIResponse(l))
                  .filter((l: string) => l.trim().length > 0)
                  .map((line: string, j: number) => (
                    <li key={j}>{line}</li>
                  ))}
              </ul>
            </div>
          )) : (
            <div className="p-4 border-2 border-dashed border-gray-100 rounded-xl text-center">
              <p className="text-gray-300 font-bold uppercase tracking-widest text-xs italic">Experience Section Placeholder</p>
            </div>
          )}
        </div>

        {/* Education */}
        <div className="mb-8">
          <h2 className="text-blue-900 font-black text-lg uppercase border-b-2 border-amber-400 pb-1 mb-4">Education</h2>
          {data.education?.length > 0 ? (
            data.education.map((edu: any, i: number) => (
              <div key={i} className="mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900">
                      {edu.degree ? cleanAIResponse(edu.degree) : 'Degree'}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {edu.institutionName ? cleanAIResponse(edu.institutionName) : 'Institution'}
                    </p>
                    {edu.grade && (
                      <p className="text-gray-500 text-xs">
                        {cleanAIResponse(edu.grade)}
                      </p>
                    )}
                  </div>
                  <span className="text-gray-400 text-sm flex-shrink-0 ml-4">
                    {edu.yearGraduated}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm italic">
              No education added
            </p>
          )}
          {data.nyscStatus && data.nyscStatus !== 'Not Started' && (
            <div className="mt-4 p-3 bg-[#f7faff] rounded-lg border border-[#edf4fe] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-800" />
              <p className="text-sm font-bold text-gray-700">NYSC Status: <span className="text-blue-800">{data.nyscStatus}</span></p>
            </div>
          )}
        </div>

        {/* Skills */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-blue-900 font-black text-lg uppercase border-b-2 border-amber-400 pb-1 mb-4">Technical Skills</h2>
            <div className="flex flex-wrap gap-2">
              {data.technicalSkills?.length > 0 ? data.technicalSkills.map((skill: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">{skill}</span>
              )) : (
                <span className="text-gray-300 text-xs italic">No skills added</span>
              )}
            </div>
          </div>
          <div>
            <h2 className="text-blue-900 font-black text-lg uppercase border-b-2 border-amber-400 pb-1 mb-4">Soft Skills</h2>
            <div className="flex flex-wrap gap-2">
              {data.softSkills?.length > 0 ? data.softSkills.map((skill: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">{skill}</span>
              )) : (
                <span className="text-gray-300 text-xs italic">No skills added</span>
              )}
            </div>
          </div>
        </div>

        {/* Others */}
        <div className="mb-8">
          <h2 className="text-blue-900 font-black text-lg uppercase border-b-2 border-amber-400 pb-1 mb-4">Certifications & Others</h2>
          {data.certifications && (
            <div className="mb-4">
              <h3 className="text-sm font-black text-gray-900 mb-1">Certifications</h3>
              <p className="text-gray-700 text-sm whitespace-pre-line">{data.certifications}</p>
            </div>
          )}
          {data.languages && (
            <div className="mb-4">
              <h3 className="text-sm font-black text-gray-900 mb-1">Languages</h3>
              <p className="text-gray-700 text-sm">{data.languages.join(', ')}</p>
            </div>
          )}
        </div>

        {/* References */}
        <div>
          <h2 className="text-blue-900 font-black text-lg uppercase border-b-2 border-amber-400 pb-1 mb-4">References</h2>
          {data.referenceType === 'request' ? (
            <p className="text-gray-700 italic text-sm">Available on request.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {data.references?.map((ref: any, i: number) => (
                <div key={i} className="text-sm">
                  <p className="font-black text-gray-900">{ref.name}</p>
                  <p className="text-gray-600">{ref.company}</p>
                  <p className="text-blue-800 font-bold">{ref.phone}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (type === 'proposal') {
    return (
      <div className="bg-white p-10 font-sans text-gray-900 leading-relaxed shadow-lg border border-gray-100 min-h-[1100px]">
        {/* Cover Page */}
        <div className="text-center py-20 border-b-8 border-blue-900 mb-12">
          <div className="w-24 h-24 bg-blue-900 text-white rounded-full flex items-center justify-center mx-auto mb-8 text-4xl font-black">
            {data.businessName?.charAt(0) || 'B'}
          </div>
          <h1 className="text-5xl font-black text-blue-900 mb-4 uppercase tracking-tighter">BUSINESS PROPOSAL</h1>
          <div className="w-20 h-2 bg-amber-400 mx-auto mb-8" />
          <p className="text-2xl font-bold text-gray-600 mb-2">Prepared for:</p>
          <p className="text-3xl font-black text-gray-900 mb-12 uppercase">{data.clientName || 'CLIENT NAME'}</p>
          
          <div className="text-left max-w-md mx-auto bg-gray-50 p-8 rounded-2xl border border-gray-100">
            <p className="text-sm font-black text-blue-900 uppercase mb-4 tracking-widest">Prepared by:</p>
            <p className="font-black text-xl text-gray-900">{data.businessName || 'YOUR BUSINESS NAME'}</p>
            <p className="text-gray-600 font-bold">{data.businessType || 'SERVICE TYPE'}</p>
            <div className="mt-4 space-y-1 text-sm text-gray-500">
              <p>📞 {data.phone}</p>
              <p>📧 {data.email}</p>
              <p>📍 {data.address}</p>
              {data.cacNumber && <p>CAC: {data.cacNumber}</p>}
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="mb-12">
          <h2 className="text-2xl font-black text-blue-900 uppercase border-l-4 border-amber-400 pl-4 mb-6">Executive Summary</h2>
          <p className="text-gray-700 leading-relaxed">
            {data.whyChooseUs ? cleanAIResponse(data.whyChooseUs) : 'A compelling summary of why your business is the best choice for this contract.'}
          </p>
        </div>

        {/* Services & Pricing */}
        <div className="mb-12">
          <h2 className="text-2xl font-black text-blue-900 uppercase border-l-4 border-amber-400 pl-4 mb-6">Services & Pricing</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="p-4 rounded-tl-lg">Service Description</th>
                <th className="p-4">Frequency</th>
                <th className="p-4">Unit Price</th>
                <th className="p-4">Qty</th>
                <th className="p-4 rounded-tr-lg text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.lineItems?.map((item: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="p-4 font-bold text-gray-800">{item.name}</td>
                  <td className="p-4 text-gray-600">{item.frequency}</td>
                  <td className="p-4 text-gray-600">₦{Number(item.price).toLocaleString()}</td>
                  <td className="p-4 text-gray-600">{item.qty}</td>
                  <td className="p-4 font-black text-gray-900 text-right">₦{(item.price * item.qty).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-bold">
              <tr>
                <td colSpan={4} className="p-4 text-right text-gray-500">Subtotal</td>
                <td className="p-4 text-right text-gray-900">₦{Number(data.subtotal || 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td colSpan={4} className="p-4 text-right text-gray-500">VAT (7.5%)</td>
                <td className="p-4 text-right text-gray-900">₦{Number(data.vat || 0).toLocaleString()}</td>
              </tr>
              <tr className="text-xl text-blue-900 bg-blue-50">
                <td colSpan={4} className="p-4 text-right font-black">GRAND TOTAL</td>
                <td className="p-4 text-right font-black">₦{Number(data.total || 0).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Terms */}
        <div className="mb-12 p-8 bg-gray-50 rounded-2xl border border-gray-100">
          <h2 className="text-xl font-black text-blue-900 uppercase mb-4">Terms & Conditions</h2>
          <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
            <li>Payment Terms: <span className="font-bold text-gray-900">{data.paymentTerms}</span></li>
            <li>Proposed Start Date: <span className="font-bold text-gray-900">{data.startDate}</span></li>
            <li>Contract Duration: <span className="font-bold text-gray-900">{data.duration}</span></li>
            {data.equipment && <li>Equipment/Materials: {data.equipment}</li>}
          </ul>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-20 pt-20">
          <div className="border-t-2 border-gray-300 pt-4">
            <p className="text-xs font-black text-gray-400 uppercase mb-8">For: {data.businessName}</p>
            <div className="h-12" />
            <p className="font-black text-gray-900">{data.contactPerson}</p>
            <p className="text-xs text-gray-500">Authorized Signatory</p>
          </div>
          <div className="border-t-2 border-gray-300 pt-4">
            <p className="text-xs font-black text-gray-400 uppercase mb-8">For: {data.clientName}</p>
            <div className="h-12" />
            <p className="font-black text-gray-900">{data.clientContact}</p>
            <p className="text-xs text-gray-500">Authorized Signatory</p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'business-plan') {
    return (
      <div className="bg-white p-10 font-sans text-gray-900 leading-relaxed shadow-lg border border-gray-100 min-h-[1100px]">
        {/* Cover Page */}
        <div className="text-center py-32 mb-12">
          <h1 className="text-6xl font-black text-blue-900 mb-4 uppercase tracking-tighter">{data.businessName || 'BUSINESS NAME'}</h1>
          <h2 className="text-3xl font-bold text-amber-500 mb-12 uppercase tracking-widest">BUSINESS PLAN</h2>
          <div className="w-32 h-2 bg-blue-900 mx-auto mb-12" />
          <p className="text-xl text-gray-500 mb-20">{data.industry || 'Industry Type'} | {data.location || 'Location'}</p>
          
          <div className="inline-block p-4 border-2 border-blue-900 rounded-xl text-blue-900 font-black text-sm uppercase tracking-widest">
            BoI / SMEDAN / NIRSAL Standard Format
          </div>
        </div>

        {/* Table of Contents */}
        <div className="mb-20 page-break-after">
          <h2 className="text-2xl font-black text-blue-900 uppercase mb-8 text-center">Table of Contents</h2>
          <div className="max-w-md mx-auto space-y-4">
            {['Executive Summary', 'Business Description', 'Market Analysis', 'Financial Plan', 'Team & Operations'].map((item, i) => (
              <div key={i} className="flex justify-between items-baseline border-b border-dotted border-gray-300">
                <span className="font-bold text-gray-700">{i + 1}. {item}</span>
                <span className="text-gray-400">................................</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-black text-blue-900 uppercase border-b-4 border-amber-400 pb-2 mb-6">1. Executive Summary</h2>
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs font-black text-gray-400 uppercase mb-1">Business Stage</p>
                <p className="font-bold text-blue-900">{data.businessStage}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs font-black text-gray-400 uppercase mb-1">Registration</p>
                <p className="font-bold text-blue-900">{data.registrationStatus}</p>
              </div>
            </div>
            <p className="text-gray-700 font-bold italic mb-4">"{data.oneLineDescription ? cleanAIResponse(data.oneLineDescription) : ''}"</p>
            <p className="text-gray-700">{data.fullDescription ? cleanAIResponse(data.fullDescription) : ''}</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-blue-900 uppercase border-b-4 border-amber-400 pb-2 mb-6">2. Business Description</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-black text-blue-800 uppercase text-sm mb-2">Vision</h3>
                <p className="text-gray-700">{data.vision ? cleanAIResponse(data.vision) : ''}</p>
              </div>
              <div>
                <h3 className="font-black text-blue-800 uppercase text-sm mb-2">Mission</h3>
                <p className="text-gray-700">{data.mission ? cleanAIResponse(data.mission) : ''}</p>
              </div>
              <div>
                <h3 className="font-black text-blue-800 uppercase text-sm mb-2">Core Values</h3>
                <div className="flex flex-wrap gap-2">
                  {data.coreValues?.map((val: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">{cleanAIResponse(val)}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-blue-900 uppercase border-b-4 border-amber-400 pb-2 mb-6">3. Market Analysis</h2>
            <div className="space-y-6">
              <p className="text-gray-700"><span className="font-black">Target Market:</span> {data.targetMarket ? cleanAIResponse(data.targetMarket) : ''}</p>
              <p className="text-gray-700"><span className="font-black">Market Size:</span> {data.marketSize ? cleanAIResponse(data.marketSize) : ''}</p>
              <p className="text-gray-700"><span className="font-black">Competitive Advantage:</span> {data.competitiveAdvantage ? cleanAIResponse(data.competitiveAdvantage) : ''}</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-blue-900 uppercase border-b-4 border-amber-400 pb-2 mb-6">4. Financial Plan</h2>
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="bg-blue-900 text-white p-6 rounded-2xl">
                <p className="text-xs font-black opacity-60 uppercase mb-1">Capital Required</p>
                <p className="text-3xl font-black">₦{Number(data.capitalRequired || 0).toLocaleString()}</p>
              </div>
              <div className="bg-amber-500 text-white p-6 rounded-2xl">
                <p className="text-xs font-black opacity-60 uppercase mb-1">Loan Requested</p>
                <p className="text-3xl font-black">₦{Number(data.loanAmount || 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
              <h3 className="font-black text-blue-900 uppercase text-sm mb-4">3-Year Revenue Projections</h3>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-black text-gray-400 uppercase">
                    <th className="pb-4">Year</th>
                    <th className="pb-4">Est. Revenue</th>
                    <th className="pb-4">Est. Expenses</th>
                    <th className="pb-4 text-right">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[1, 2, 3].map((year) => {
                    const rev = Number(data.monthlyRevenue || 0) * 12 * Math.pow(1.2, year - 1);
                    const exp = Number(data.monthlyExpenses || 0) * 12 * Math.pow(1.1, year - 1);
                    return (
                      <tr key={year}>
                        <td className="py-4 font-bold">Year {year}</td>
                        <td className="py-4">₦{rev.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td className="py-4">₦{exp.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td className="py-4 text-right font-black text-blue-900">₦{(rev - exp).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return null;
};
export const DocumentPreview = ({ 
  documentData, 
  documentType, 
  isPaid, 
  paymentRef,
  onPayClick, 
  price,
  filename = 'document'
}: DocumentPreviewProps) => {
  const downloadAsPDF = async (
    elementId: string, 
    filename: string
  ) => {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with ID ${elementId} not found`);
      return;
    }
    
    // Temporarily hide watermarks for PDF
    const watermarks = element.querySelectorAll(
      '[aria-hidden="true"]'
    );
    watermarks?.forEach(w => 
      (w as HTMLElement).style.display = 'none'
    );

    try {
      // Show loading toast
      const toastId = 'pdf-gen';
      // We don't have access to toast here unless we import it, but we can use a local state or just hope it's fast.
      // Actually, let's just make it more robust.
      
      await html2pdf()
      .set({
        margin: [8, 8, 8, 8],
        filename: `${filename}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          logging: false,
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
        },
      })
      .from(element)
      .save();
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      // Restore watermarks after download
      watermarks?.forEach(w => 
        (w as HTMLElement).style.display = ''
      );
    }
  };

  return (
    <div className="relative w-full">
      <div className="no-print-message p-8 text-center bg-red-50 text-red-600 font-bold rounded-2xl mb-8">
        Printing is disabled for previews. Please unlock the document to download or print.
      </div>

      <div
        onContextMenu={(e) => !isPaid && e.preventDefault()}
        onCopy={(e) => !isPaid && e.preventDefault()}
        onCut={(e) => !isPaid && e.preventDefault()}
        onDrag={(e) => !isPaid && e.preventDefault()}
        onDragStart={(e) => !isPaid && e.preventDefault()}
        style={!isPaid ? {
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          WebkitTouchCallout: 'none',
        } : {}}
        className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white shadow-lg"
      >
        {/* THE DOCUMENT — full render but clipped when unpaid */}
        <div
          id="document-preview-content"
          className={!isPaid ? "document-preview-locked" : ""}
          style={!isPaid ? {
            maxHeight: '420px',  // shows ~35% on most screens
            overflow: 'hidden',
            position: 'relative',
          } : {}}
        >
          <DocumentHTML data={documentData} type={documentType} />
        </div>

        {/* ANTI-SCREENSHOT WATERMARK — over visible portion */}
        {!isPaid && (
          <div
            className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
            aria-hidden="true"
          >
            {/* Diagonal watermark grid */}
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute whitespace-nowrap text-gray-300 font-bold text-sm opacity-30 select-none"
                style={{
                  top: `${(i % 5) * 22}%`,
                  left: `${Math.floor(i / 5) * 28 - 10}%`,
                  transform: 'rotate(-35deg)',
                  fontSize: '13px',
                  letterSpacing: '2px',
                }}
              >
                hubandjobs.com • PREVIEW ONLY •&nbsp;
                hubandjobs.com • PREVIEW ONLY •
              </div>
            ))}
          </div>
        )}

        {/* GRADIENT FADE — bottom of visible area */}
        {!isPaid && (
          <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none z-20"
            style={{
              background: 'linear-gradient(to bottom, transparent, white 70%)'
            }}
          />
        )}

        {/* BLURRED CONTINUATION — teaser of more content */}
        {!isPaid && (
          <div className="relative z-10 overflow-hidden" style={{ height: '120px' }}>
            <div
              className="document-preview-locked"
              style={{
                filter: 'blur(8px)',
                opacity: 0.5,
                transform: 'translateY(-420px)',
                pointerEvents: 'none',
              }}
            >
              <DocumentHTML data={documentData} type={documentType} />
            </div>
          </div>
        )}

        {/* PAYMENT CTA — floating over blur */}
        {!isPaid && (
          <div className="relative z-30 bg-white dark:bg-gray-900 px-6 pb-8 pt-4 text-center border-t border-gray-100">
            {/* Lock icon with pulse */}
            <div className="relative inline-block mb-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto shadow-xl shadow-primary/30">
                <Lock className="text-white" size={32} />
              </div>
              <div className="absolute inset-0 rounded-full bg-primary opacity-20 animate-ping"/>
            </div>

            <h3 className="font-black text-gray-900 dark:text-white text-xl mb-2">
              Your document is ready!
            </h3>
            <p className="text-gray-500 text-sm mb-2 max-w-xs mx-auto">
              Pay once to unlock the complete document and download it as PDF instantly.
            </p>

            {/* What they get */}
            <div className="flex flex-col gap-1.5 max-w-xs mx-auto mb-6 text-left">
              {[
                'Full professional document unlocked',
                'Instant PDF download',
                'Keep forever — re-download anytime',
                'Edit and regenerate free',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="text-green-500 font-bold">✓</span>
                  {item}
                </div>
              ))}
            </div>

            {/* Price */}
            <div className="mb-4">
              <span className="text-3xl font-black text-primary">
                ₦{price.toLocaleString()}
              </span>
              <span className="text-gray-400 text-sm ml-1">
                one-time
              </span>
            </div>

            {/* Pay button */}
            <button
              onClick={onPayClick}
              className="w-full max-w-xs py-4 bg-primary text-white font-black rounded-2xl text-base shadow-xl shadow-primary/30 hover:bg-blue-900 active:scale-95 transition-all mx-auto block"
            >
              Unlock & Download — ₦{price.toLocaleString()}
            </button>

            <p className="text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
              <span>🔒</span>
              Secured by Paystack
            </p>
          </div>
        )}
      </div>

      {/* After payment unlock */}
      {isPaid && paymentRef && (
        <div className="mt-8 space-y-6">
          <div className="text-center py-8 bg-green-50 dark:bg-green-900/10 rounded-3xl border border-green-100 dark:border-green-900/20">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h3 className="font-black text-green-600 text-xl mb-2">
              Payment Successful!
            </h3>
            <p className="text-gray-500 text-sm mb-2">
              Reference: <span className="font-mono font-bold">{paymentRef}</span>
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Your document is fully unlocked. Scroll up to view and download.
            </p>
            
            <button
              onClick={() => downloadAsPDF('document-preview-content', filename)}
              className="w-full max-w-xs py-4 bg-green-500 hover:bg-green-600 text-white font-black rounded-2xl text-base shadow-xl shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <Download size={20} />
              Download PDF Now
            </button>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => window.location.href = '/documents'}
              className="text-gray-500 hover:text-primary font-bold text-sm transition-colors"
            >
              ← Build Another Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentPreview;
