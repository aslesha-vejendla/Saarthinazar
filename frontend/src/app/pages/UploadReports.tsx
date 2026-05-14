import {
  useState,
  useRef,
  useEffect,
} from "react";

import { useRole } from "../context/RoleContext";

import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  X,
  AlertTriangle,
  Calendar,
  Loader2,
} from "lucide-react";

interface UploadRecord {
  id: string;
  date?: string;
  created_at?: string;
  financial_year?: string;
  resdexFile?: string;
  resdex_file?: string;
  jobPostingFile?: string;
  job_posting_file?: string;
  uploadedBy?: string;
  uploaded_by?: string;
  status: "success" | "error";
  errorMessage?: string;
  message?: string;
}

export default function UploadReports() {

  const [financialYear, setFinancialYear] =
    useState("2025-2026");

  const [resdexFile, setResdexFile] =
    useState<File | null>(null);

  const [jobPostingFile, setJobPostingFile] =
    useState<File | null>(null);

  const [validationError, setValidationError] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const [dragActiveResdex, setDragActiveResdex] =
    useState(false);

  const [dragActiveJob, setDragActiveJob] =
    useState(false);

  // FIX 1: uploading is now set to true BEFORE the fetch
  const [uploading, setUploading] =
    useState(false);

  const [uploadHistory, setUploadHistory] =
    useState<UploadRecord[]>([]);

  const resdexInputRef =
    useRef<HTMLInputElement | null>(null);

  const jobsInputRef =
    useRef<HTMLInputElement | null>(null);

  // =====================================================
  // Read the logged-in user directly from context —
  // no more localStorage reads scattered in components
  // =====================================================

  const { username: loggedInUser } = useRole();

  // =====================================================
  // FETCH HISTORY
  // =====================================================

  const fetchHistory = () => {
    fetch("http://127.0.0.1:8000/reports/")
      .then((res) => res.json())
      .then((data) => setUploadHistory(data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // =====================================================
  // DRAG EVENTS — separate state per dropzone so
  // hovering one box doesn't highlight both
  // =====================================================

  const handleDragResdex = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveResdex(
      e.type === "dragenter" || e.type === "dragover"
    );
  };

  const handleDragJob = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveJob(
      e.type === "dragenter" || e.type === "dragover"
    );
  };

  const handleDrop = (
    e: React.DragEvent,
    type: "resdex" | "jobPosting"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveResdex(false);
    setDragActiveJob(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (type === "resdex") {
        setResdexFile(e.dataTransfer.files[0]);
      } else {
        setJobPostingFile(e.dataTransfer.files[0]);
      }
    }
  };

  // =====================================================
  // CLEAR FILES
  // =====================================================

  const clearFiles = () => {
    setResdexFile(null);
    setJobPostingFile(null);
    if (resdexInputRef.current) resdexInputRef.current.value = "";
    if (jobsInputRef.current) jobsInputRef.current.value = "";
  };

  // =====================================================
  // HANDLE UPLOAD — FIX: setUploading(true) comes FIRST,
  // before the await, so the button turns grey immediately
  // =====================================================

  const handleUpload = async () => {

    if (uploading) return;

    if (!resdexFile || !jobPostingFile) {
      setValidationError(
        "Both reports must be uploaded simultaneously."
      );
      return;
    }

    // ← THIS is the fix. Must be set before the await.
    setUploading(true);
    setValidationError(null);
    setSuccessMessage(null);

    try {

      const formData = new FormData();
      formData.append("financial_year", financialYear);

      // FIX 2: send the actual logged-in user, not hardcoded "Kajal"
      formData.append("uploaded_by", loggedInUser ?? "unknown");

      formData.append("resdex_report", resdexFile);
      formData.append("job_posting_report", jobPostingFile);

      const response = await fetch(
        "http://127.0.0.1:8000/reports/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok && data.status === "success") {

        const teamsCreated = data.new_teams_added || data.created_teams?.length || 0;
        const subusersAdded = data.subusers_added || 0;

        setSuccessMessage(
          `Upload successful. ${subusersAdded} subuser(s) processed, ${teamsCreated} new team(s) created.`
        );

        fetchHistory();
        clearFiles();

      } else if (data.status === "duplicate") {

        setValidationError(
          "Reports for this date range already exist. Enable 'Overwrite' to re-upload."
        );

      } else {

        setValidationError(
          data.detail || data.message || "Upload failed."
        );
        clearFiles();
      }

    } catch (error) {

      setValidationError(
        error instanceof Error ? error.message : "Upload failed."
      );
      clearFiles();

    } finally {
      // Always re-enable the button when done
      setUploading(false);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  const bothFilesReady = !!resdexFile && !!jobPostingFile;

  return (
    <div className="p-8">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl mb-2">Upload Reports</h1>
          <p className="text-slate-600">
            Upload weekly Resdex and Job Posting reports
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Uploading as: <span className="font-medium text-slate-600">{loggedInUser}</span>
          </p>
        </div>

        <select
          value={financialYear}
          onChange={(e) => setFinancialYear(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-xl bg-white"
        >
          <option value="2024-2025">FY 2024-2025</option>
          <option value="2025-2026">FY 2025-2026</option>
          <option value="2026-2027">FY 2026-2027</option>
        </select>
      </div>

      {/* INFO */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6 flex items-center gap-3">
        <Calendar className="text-purple-600 w-5 h-5 flex-shrink-0" />
        <div>
          <p className="text-purple-900 font-medium">Upload Requirements</p>
          <p className="text-purple-800 text-sm">
            Both reports must start from 1 April of the selected financial year
            and cover the same date range.
          </p>
        </div>
      </div>

      {/* ERROR */}
      {validationError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="text-red-600 w-5 h-5 flex-shrink-0" />
          <p className="text-red-900">{validationError}</p>
        </div>
      )}

      {/* SUCCESS */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="text-green-600 w-5 h-5 flex-shrink-0" />
          <p className="text-green-900">{successMessage}</p>
        </div>
      )}

      {/* FILE BOXES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* RESDEX */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-purple-600" />
            Resdex Usage Report (.xls)
          </h3>

          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
              dragActiveResdex
                ? "border-purple-500 bg-purple-50"
                : resdexFile
                ? "border-green-400 bg-green-50"
                : "border-slate-300"
            }`}
            onDragEnter={handleDragResdex}
            onDragLeave={handleDragResdex}
            onDragOver={handleDragResdex}
            onDrop={(e) => handleDrop(e, "resdex")}
          >
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 mb-1">Drag & drop your file here</p>
            <p className="text-sm text-slate-500 mb-4">or</p>

            <input
              type="file"
              ref={resdexInputRef}
              id="resdex-upload"
              className="hidden"
              accept=".xls,.xlsx"
              onChange={(e) =>
                e.target.files && setResdexFile(e.target.files[0])
              }
            />

            <label
              htmlFor="resdex-upload"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition cursor-pointer inline-block"
            >
              Browse Files
            </label>
          </div>

          {resdexFile && (
            <div className="mt-4 flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-900 truncate max-w-xs">
                  {resdexFile.name}
                </span>
              </div>
              <button
                onClick={() => {
                  setResdexFile(null);
                  if (resdexInputRef.current) resdexInputRef.current.value = "";
                }}
                className="text-green-600 hover:text-red-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* JOB POSTING */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-purple-600" />
            Job Posting Report (.xlsx)
          </h3>

          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
              dragActiveJob
                ? "border-purple-500 bg-purple-50"
                : jobPostingFile
                ? "border-green-400 bg-green-50"
                : "border-slate-300"
            }`}
            onDragEnter={handleDragJob}
            onDragLeave={handleDragJob}
            onDragOver={handleDragJob}
            onDrop={(e) => handleDrop(e, "jobPosting")}
          >
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 mb-1">Drag & drop your file here</p>
            <p className="text-sm text-slate-500 mb-4">or</p>

            <input
              type="file"
              ref={jobsInputRef}
              id="job-upload"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={(e) =>
                e.target.files && setJobPostingFile(e.target.files[0])
              }
            />

            <label
              htmlFor="job-upload"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition cursor-pointer inline-block"
            >
              Browse Files
            </label>
          </div>

          {jobPostingFile && (
            <div className="mt-4 flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-900 truncate max-w-xs">
                  {jobPostingFile.name}
                </span>
              </div>
              <button
                onClick={() => {
                  setJobPostingFile(null);
                  if (jobsInputRef.current) jobsInputRef.current.value = "";
                }}
                className="text-green-600 hover:text-red-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* UPLOAD BUTTON */}
      <div className="flex justify-center mb-8">
        <button
          onClick={handleUpload}
          disabled={uploading || !bothFilesReady}
          className={`px-8 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
            uploading
              ? "bg-slate-400 text-white cursor-not-allowed"
              : bothFilesReady
              ? "bg-purple-600 text-white hover:bg-purple-700 cursor-pointer"
              : "bg-slate-300 text-slate-500 cursor-not-allowed"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing Upload...
            </>
          ) : (
            "Upload & Validate Reports"
          )}
        </button>
      </div>

      {/* UPLOAD HISTORY */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-medium mb-6">Upload History</h3>

        {uploadHistory.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">
            No uploads yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm text-slate-600">Upload Date</th>
                  <th className="px-6 py-4 text-left text-sm text-slate-600">Financial Year</th>
                  <th className="px-6 py-4 text-left text-sm text-slate-600">Resdex File</th>
                  <th className="px-6 py-4 text-left text-sm text-slate-600">Job Posting File</th>
                  <th className="px-6 py-4 text-left text-sm text-slate-600">Uploaded By</th>
                  <th className="px-6 py-4 text-left text-sm text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {uploadHistory.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition"
                  >
                    <td className="px-6 py-4 text-sm">
                      {new Date(
                        record.created_at || record.date || ""
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {record.financial_year || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {record.resdex_file || record.resdexFile || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {record.job_posting_file || record.jobPostingFile || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {record.uploaded_by || record.uploadedBy || "—"}
                    </td>
                    <td className="px-6 py-4">
                      {record.status === "success" ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Success
                        </span>
                      ) : (
                        <div>
                          <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full inline-flex items-center gap-1 mb-1">
                            <AlertTriangle className="w-3 h-3" />
                            Failed
                          </span>
                          {record.message && (
                            <p className="text-xs text-red-600 mt-1 max-w-xs">
                              {record.message}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}