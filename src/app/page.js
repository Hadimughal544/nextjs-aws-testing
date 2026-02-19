"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ---------- LOAD FILES ---------- */
  const loadFiles = async () => {
    try {
      const res = await fetch("/api/files");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to load files");
      }
      const data = await res.json();
      setFiles(data);
    } catch (error) {
      console.error("Load files error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      alert("Please select a file first!");
      return;
    }

    setIsUploading(true);
    try {
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileType: selectedFile.type,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to get upload URL");
      }

      const { uploadUrl } = await res.json();

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: selectedFile,
        headers: { "Content-Type": selectedFile.type },
      });

      if (!uploadRes.ok) {
        throw new Error("S3 Upload Failed. Check CORS settings.");
      }

      setSelectedFile(null);
      document.getElementById("file-input").value = "";

      await loadFiles();
      alert("File uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      alert(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteFile = async (key) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      const res = await fetch("/api/files", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete file");
      }

      loadFiles();
    } catch (error) {
      console.error("Delete error:", error);
      alert(error.message);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
            S3 Cloud Gallery
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Securely upload and manage your files and documents in the cloud.
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-12">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 w-full">
              <label
                htmlFor="file-input"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Choose a file to upload (Image, PDF, Word, etc.)
              </label>
              <input
                id="file-input"
                type="file"
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2.5 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100
                  cursor-pointer bg-slate-50 rounded-lg border border-slate-200"
              />
            </div>
            <button
              onClick={uploadFile}
              disabled={!selectedFile || isUploading}
              className={`w-full md:w-auto mt-6 md:mt-0 px-8 py-3 rounded-lg font-bold text-white transition-all
                ${!selectedFile || isUploading
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:transform active:scale-95 shadow-md shadow-indigo-200'}`}
            >
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span>
              ) : "Submit to S3"}
            </button>
          </div>
          {selectedFile && (
            <p className="mt-3 text-sm text-indigo-600 font-medium">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* Files Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-bold text-slate-800">Your Documents</h2>
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-medium">
              {files.length} Files
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square rounded-2xl bg-slate-200 animate-pulse"></div>
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
              <p className="text-slate-400">No files found. Start by uploading one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {files.map((file) => {
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.Key);
                const isPdf = /\.pdf$/i.test(file.Key);
                const isWord = /\.(doc|docx)$/i.test(file.Key);

                return (
                  <div
                    key={file.Key}
                    className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200"
                  >
                    <div className="aspect-square bg-slate-100 overflow-hidden flex items-center justify-center">
                      {isImage ? (
                        <img
                          src={file.url}
                          alt={file.Key}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            e.target.src = "https://placehold.co/400x400?text=Error+Loading";
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 p-4">
                          {isPdf ? (
                            <svg className="w-16 h-16 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6l-4-4H9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14h4" />
                            </svg>
                          ) : isWord ? (
                            <svg className="w-16 h-16 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6l-4-4H9z" />
                              <path d="M7 10h4v2H7v-2z" />
                            </svg>
                          ) : (
                            <svg className="w-16 h-16 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                            {file.Key.split('.').pop()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={() => deleteFile(file.Key)}
                        className="bg-red-500 hover:bg-red-600 text-white p-2.5 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                        title="Delete File"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white hover:bg-slate-100 text-indigo-600 p-2.5 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75"
                        title="Open File"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>

                    <div className="p-3">
                      <p className="text-xs font-medium text-slate-500 truncate" title={file.Key}>
                        {file.Key.replace('uploads/', '')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
