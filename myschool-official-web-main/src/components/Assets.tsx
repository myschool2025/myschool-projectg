
import React from "react";
import { Download, Share2 } from "lucide-react"; // Icons from lucide-react

// Mock data for assets
const assetsData = [
  {
    id: 1,
    type: "image",
    name: "School Event Poster",
    url: "/assets/school-event-poster.jpg",
    thumbnail: "/assets/school-event-poster-thumb.jpg",
    size: "1.2 MB",
  },
  {
    id: 2,
    type: "pdf",
    name: "School Handbook 2025",
    url: "/assets/school-handbook-2025.pdf",
    size: "3.5 MB",
  },
  {
    id: 3,
    type: "csv",
    name: "Student Attendance Report",
    url: "/assets/student-attendance.csv",
    size: "250 KB",
  },
  {
    id: 4,
    type: "xlsx",
    name: "Annual Budget Plan",
    url: "/assets/annual-budget-plan.xlsx",
    size: "450 KB",
  },
  {
    id: 5,
    type: "image",
    name: "Graduation Ceremony",
    url: "/assets/graduation-ceremony.jpg",
    thumbnail: "/assets/graduation-ceremony-thumb.jpg",
    size: "2.1 MB",
  },
];

const Assets = () => {
  // Function to handle download (simulated for mock data)
  const handleDownload = (url: string, name: string) => {
    // In a real app, this would trigger a file download
    console.log(`Downloading ${name} from ${url}`);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
  };

  // Function to handle share (simulated using Web Share API if available)
  const handleShare = async (name: string, url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          text: `Check out this asset from MySchool: ${name}`,
          url: url,
        });
        console.log(`Shared ${name} successfully`);
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      console.log("Web Share API not supported, copying URL to clipboard:", url);
      navigator.clipboard.writeText(url);
      alert(`URL for ${name} copied to clipboard!`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            MySchool Assets
          </h1>
          <p className="text-lg text-gray-600">
            Explore and download resources related to MySchool. Share them with others!
          </p>
        </div>

        {/* Assets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {assetsData.map((asset) => (
            <div
              key={asset.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              {/* Thumbnail or Icon */}
              {asset.type === "image" && asset.thumbnail ? (
                <img
                  src={asset.thumbnail}
                  alt={asset.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-xl font-semibold uppercase">
                    {asset.type}
                  </span>
                </div>
              )}

              {/* Asset Info */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 truncate">
                  {asset.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{asset.size}</p>
              </div>

              {/* Actions */}
              <div className="p-4 pt-0 flex justify-between">
                <button
                  onClick={() => handleDownload(asset.url, asset.name)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Download size={18} />
                  Download
                </button>
                <button
                  onClick={() => handleShare(asset.name, asset.url)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  <Share2 size={18} />
                  Share
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Note */}
        <p className="text-center text-gray-500 mt-8">
          Note: These are mock assets. In a real application, files would be hosted on a server or cloud storage.
        </p>
      </div>
    </div>
  );
};

export default Assets;
