"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "../../(main)/dashboard/DashboardLayout";

// -------------------------------------------
// LOCAL LIST DATA
// -------------------------------------------
interface RealEstateList {
  id: string;
  property_name: string;
  property_type: string;
  listing_id: string;
  filename: string;
  file_hash: string;
  upload_time: string;
  query_url: string;
  size: number;
  json_size: number;
  view_url: string;
  download_url: string;
  has_json: boolean;
  has_files: boolean;
}

export const realEstateList: RealEstateList[] = [
  {
    id: "1",
    property_name: "Sunny Heights Apartment",
    property_type: "Residential",
    listing_id: "RES-1001",
    filename: "sunny_heights_docs.pdf",
    file_hash: "abc123xyz890",
    upload_time: "2024-10-25T10:15:00Z",
    query_url: "/api/query/RES-1001",
    size: 2450,
    json_size: 870,
    view_url: "/view/RES-1001",
    download_url: "/download/RES-1001",
    has_json: true,
    has_files: true,
  },
  {
    id: "2",
    property_name: "Green Villa Phase 2",
    property_type: "Villa",
    listing_id: "RES-1002",
    filename: "green_villa_pack.zip",
    file_hash: "hjy567pqr341",
    upload_time: "2024-10-28T09:12:00Z",
    query_url: "/api/query/RES-1002",
    size: 3200,
    json_size: 1150,
    view_url: "/view/RES-1002",
    download_url: "/download/RES-1002",
    has_json: true,
    has_files: true,
  },
];

// -------------------------------------------
// LOCAL DETAIL SAMPLE DATA
// -------------------------------------------
interface RealEstateDetail {
  query: string;
  answer: any;
}

export const realEstateDetail: RealEstateDetail = {
  query: "Give me full details of Sunny Heights Apartment",
  answer: {
    property_name: "Sunny Heights Apartment",
    property_type: "Apartment",
    listing_id: "RES-1001",
    owner_name: "Rajesh Sharma",
    seller_name: "Sunrise Realty",
    price: 8500000,
    area_sqft: 1250,
    additional_info: {
      water_supply: "24x7",
      parking_details: "1 Covered",
      security: "CCTV, Security",
    },
  },
};

// -----------------------------------------------------
// MAIN COMPONENT (FULL RESPONSIVE FIXED VERSION)
// -----------------------------------------------------
export default function List() {
  const [FileList, setFileList] = useState<RealEstateList[]>([]);
  const [selectedFile, setSelectedFile] = useState<RealEstateDetail | null>(
    null
  );
  const [activeHash, setActiveHash] = useState<string | null>(null);

  useEffect(() => {
    setFileList(realEstateList);
    setSelectedFile(realEstateDetail);
    setActiveHash(realEstateList[0].file_hash);
  }, []);

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row flex-1 overflow-hidden text-white">

        {/* LEFT LIST (NO FIXED WIDTH ON MOBILE, ADJUST ON DESKTOP) */}
        <div className="
            w-full 
            sm:w-auto sm:min-w-[180px] sm:max-w-[220px]
            shrink-0 border-r border-white/20
            overflow-y-auto px-4 py-4 sm:pr-4 ">
          <h2 className="text-base sm:text-lg font-semibold mb-2">
            Your Properties
          </h2>

          {FileList.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setActiveHash(item.file_hash);
                setSelectedFile(realEstateDetail);
              }}
              className={`
                px-3 py-3 rounded-lg cursor-pointer transition-all
                text-sm sm:text-base
                ${
                  activeHash === item.file_hash
                    ? "bg-purple-700/50 text-white"
                    : "text-purple-300 hover:bg-purple-600/20"
                }
              `}
            >
              {item.property_name}
            </div>
          ))}
        </div>

        {/* RIGHT DETAILS */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {selectedFile && (
            <div className="bg-white/10 backdrop-blur-xl shadow-xl rounded-xl border border-white/20 p-4 sm:p-6 space-y-4">

              <h2 className="text-xl sm:text-2xl font-semibold">
                {selectedFile.answer.property_name}
              </h2>

              <p className="text-sm sm:text-base">
                <strong>Type:</strong> {selectedFile.answer.property_type}
              </p>

              <p className="text-sm sm:text-base">
                <strong>Owner:</strong> {selectedFile.answer.owner_name}
              </p>

              <p className="text-sm sm:text-base">
                <strong>Price:</strong> {selectedFile.answer.price}
              </p>

              <p className="text-sm sm:text-base">
                <strong>Area:</strong> {selectedFile.answer.area_sqft} sq ft
              </p>

              <div>
                <h3 className="font-semibold text-base sm:text-lg">
                  Additional Info:
                </h3>

                <ul className="list-disc ml-4 sm:ml-6 text-sm sm:text-base">
                  {Object.entries(selectedFile.answer.additional_info).map(
                    ([k, v], i) => (
                      <li key={i}>
                        <strong>{k}:</strong> {String(v)}
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
