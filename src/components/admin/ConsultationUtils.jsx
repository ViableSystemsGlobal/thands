
import React from "react";
import { FileText, Ruler, Calendar, Clock } from "lucide-react";

export const renderMeasurements = (consultation) => {
  if (!consultation?.sizes) return null;
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Measurements</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(consultation.sizes).map(([key, value]) => (
          <div key={key} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Ruler className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">{key.replace(/_/g, ' ').toUpperCase()}</p>
              <p className="font-medium">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const renderDetailItem = (icon, label, value) => {
  if (!icon || !label) return null;
  
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      {icon}
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium">{value || "Not specified"}</p>
      </div>
    </div>
  );
};

export const renderFileLinks = (urls, label) => {
  if (!urls?.length || !label) return null;

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-gray-500">{label} Files</h4>
      <div className="grid gap-2">
        {urls.map((url, index) => (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:underline p-2 bg-blue-50 rounded"
          >
            <FileText className="w-4 h-4" />
            {`${label} ${index + 1}`}
          </a>
        ))}
      </div>
    </div>
  );
};

export const renderAppointmentDetails = (consultation) => {
  if (!consultation?.type || consultation.type !== "consultation") return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Appointment Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderDetailItem(
          <Calendar className="w-5 h-5 text-red-500" />,
          "Preferred Date",
          consultation.preferred_date
        )}
        {renderDetailItem(
          <Clock className="w-5 h-5 text-yellow-500" />,
          "Preferred Time",
          consultation.preferred_time
        )}
      </div>
    </div>
  );
};

export const renderImages = (consultation) => {
  if (!consultation) return null;

  const allImages = [
    ...(consultation.photo_urls || []),
    ...(consultation.design_urls || []),
    consultation.photo_url,
    consultation.inspiration_url
  ].filter(Boolean);

  if (allImages.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Attached Images</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {allImages.map((url, index) => (
          <div key={index} className="relative group">
            <img
              src={url}
              alt={`Consultation image ${index + 1}`}
              className="w-full h-48 object-cover rounded-lg shadow-sm"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/300x200?text=Image+Not+Found";
              }}
            />
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center rounded-lg"
            >
              <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                View Full Size
              </span>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
