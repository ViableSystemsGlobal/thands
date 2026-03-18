
import React from 'react';
import { API_BASE_URL } from '@/lib/services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { User, Mail, Phone, FileText, Calendar, Clock, Info, Image as ImageIcon, Link as LinkIcon, Paperclip } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const DetailItem = ({ icon: Icon, label, value, className = "" }) => (
  <div className={`flex items-start p-3 bg-slate-50 rounded-lg ${className}`}>
    <Icon className="w-5 h-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
    <div>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-sm text-slate-800 font-semibold">{value || "N/A"}</p>
    </div>
  </div>
);

const FileLinkItem = ({ url, label }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-blue-700"
  >
    <Paperclip className="w-4 h-4 mr-2" />
    <span className="text-sm font-medium">View {label}</span>
  </a>
);

const ImagePreview = ({ url, alt }) => (
  <div className="w-full aspect-video rounded-lg overflow-hidden border border-slate-200">
    <img-replace src={url} alt={alt} className="w-full h-full object-cover" />
  </div>
);


const ConsultationDetailsDialog = ({ consultation, open, onOpenChange }) => {
  if (!consultation) return null;

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    // Assuming Supabase storage URL structure
    return `${API_BASE_URL}/images/${imagePath}`;
  };
  
  const designUrls = Array.isArray(consultation.design_urls) ? consultation.design_urls : [];
  const photoUrls = Array.isArray(consultation.photo_urls) ? consultation.photo_urls : [];


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <DialogTitle className="text-2xl font-light text-slate-800">Consultation Details</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Request ID: {consultation.id} - Submitted on {new Date(consultation.created_at).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6 space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-slate-700 mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem icon={User} label="Full Name" value={consultation.name} />
              <DetailItem icon={Mail} label="Email" value={consultation.email} />
              <DetailItem icon={Phone} label="Phone" value={consultation.phone} />
              <DetailItem icon={FileText} label="Consultation Type" value={consultation.type} />
            </div>
          </section>

          {consultation.consultation_type === 'booking' && (
            <section>
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Appointment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailItem icon={Calendar} label="Preferred Date" value={consultation.preferred_date ? new Date(consultation.preferred_date).toLocaleDateString() : 'N/A'} />
                <DetailItem icon={Clock} label="Preferred Time" value={consultation.preferred_time || 'N/A'} />
              </div>
              {consultation.consultation_instructions && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-600 mb-1">Consultation Instructions</h4>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{consultation.consultation_instructions}</p>
                </div>
              )}
            </section>
          )}

          {(consultation.height || consultation.sizes) && (
            <section>
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Measurements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {consultation.height && <DetailItem icon={Info} label="Height" value={consultation.height} />}
              </div>
              {consultation.sizes && typeof consultation.sizes === 'object' && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-600 mb-2">Provided Sizes:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {Object.entries(consultation.sizes).map(([key, value]) => (
                      <li key={key} className="text-sm text-slate-700">
                        <span className="capitalize font-medium">{key.replace(/_/g, ' ')}:</span> {value}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}
          
          {consultation.additional_instructions && consultation.consultation_type !== 'booking' && (
             <section>
                <h3 className="text-lg font-semibold text-slate-700 mb-3">Additional Instructions</h3>
                <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{consultation.additional_instructions}</p>
                </div>
            </section>
          )}

          {(designUrls.length > 0 || photoUrls.length > 0 || consultation.measurements_url || consultation.inspiration_url || consultation.photo_url) && (
            <section>
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Uploaded Files & Links</h3>
              <div className="space-y-3">
                {designUrls.map((url, i) => <FileLinkItem key={`design-${i}`} url={url} label={`Design File ${i + 1}`} />)}
                {photoUrls.map((url, i) => <FileLinkItem key={`photo-${i}`} url={url} label={`Photo File ${i + 1}`} />)}
                {consultation.measurements_url && <FileLinkItem url={consultation.measurements_url} label="Measurements File" />}
                {consultation.inspiration_url && <FileLinkItem url={consultation.inspiration_url} label="Inspiration File" />}
                {consultation.photo_url && <FileLinkItem url={consultation.photo_url} label="Additional Photo File" />}
              </div>
            </section>
          )}
          
          <section>
            <h3 className="text-lg font-semibold text-slate-700 mb-3">Status</h3>
            <Badge variant={
              consultation.status === 'completed' ? 'success' :
              consultation.status === 'confirmed' ? 'default' :
              consultation.status === 'cancelled' ? 'destructive' :
              'secondary'
            } className="text-sm px-3 py-1">
              {consultation.status ? consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1) : "Pending"}
            </Badge>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConsultationDetailsDialog;
