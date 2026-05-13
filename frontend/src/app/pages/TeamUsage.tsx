import { useEffect, useState } from "react";

import {
  ChevronDown,
  ChevronRight,
  Plus,
  AlertCircle,
} from "lucide-react";

import { useNavigate } from "react-router-dom";


interface SubUser {

  id: number;

  name: string;

  email: string;

  cv_usage: number;

  nvites_usage: number;

  jobs_usage: number;
}


interface Team {

  id: number;

  name: string;

  licence_count: number;

  original_limits: {

    cv: number;

    nvites: number;

    jobs: number;
  };

  topups: {

    cv: number;

    nvites: number;

    jobs: number;
  };

  total_limits: {

    cv: number;

    nvites: number;

    jobs: number;
  };

  usage: {

    cv: number;

    nvites: number;

    jobs: number;
  };

  usage_percent: {

    cv: number;

    nvites: number;

    jobs: number;
  };

  status: string;

  outstanding_invoice: number;

  subusers: SubUser[];
}


function getUsageColor(
  percentage: number
): string {

  if (percentage > 100) {

    return "text-red-900 bg-red-50 border-red-200";
  }

  if (percentage >= 90) {

    return "text-red-700 bg-red-50 border-red-200";
  }

  if (percentage >= 70) {

    return "text-orange-700 bg-orange-50 border-orange-200";
  }

  return "text-green-700 bg-green-50 border-green-200";
}


function getStatusBadge(
  status: string
) {

  if (status === "Over limit") {

    return (
      <span className="px-2 py-1 bg-red-700 text-white text-xs rounded-full">
        Over Limit
      </span>
    );
  }

  if (status === "Critical") {

    return (
      <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
        Critical
      </span>
    );
  }

  if (status === "Warning") {

    return (
      <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
        Warning
      </span>
    );
  }

  return (
    <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
      Safe
    </span>
  );
}


export default function TeamUsage() {

  const navigate = useNavigate();

  const [teams, setTeams] = useState<Team[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [expandedTeams, setExpandedTeams] =
    useState<Set<number>>(new Set());

  const [financialYear, setFinancialYear] =
    useState("2026-2027");


  // ===================================================
  // FETCH TEAM DATA
  // ===================================================

  const fetchTeams = async () => {

    try {

      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch(

        `http://127.0.0.1:8000/dashboard/teams?financial_year=${financialYear}`,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(
          data.detail || "Failed to fetch teams"
        );
      }

      setTeams(data);

      setError("");

    } catch (err: any) {

      setError(
        err.message || "Something went wrong"
      );

    } finally {

      setLoading(false);
    }
  };


  useEffect(() => {

    fetchTeams();

  }, [financialYear]);


  // ===================================================
  // EXPAND / COLLAPSE
  // ===================================================

  const toggleTeam = (
    teamId: number
  ) => {

    const updated = new Set(expandedTeams);

    if (updated.has(teamId)) {

      updated.delete(teamId);

    } else {

      updated.add(teamId);
    }

    setExpandedTeams(updated);
  };


  // ===================================================
  // TOPUP NAVIGATION
  // ===================================================

  const handleAddTopUp = (
    teamId: number
  ) => {

    navigate(
      `/topups?teamId=${teamId}`
    );
  };


  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {

    return (

      <div className="p-8">

        <div className="bg-white rounded-xl p-10 text-center shadow-sm border border-slate-200">

          <p className="text-slate-600">
            Loading teams...
          </p>

        </div>

      </div>
    );
  }


  // ===================================================
  // ERROR
  // ===================================================

  if (error) {

    return (

      <div className="p-8">

        <div className="bg-red-50 border border-red-200 rounded-xl p-6">

          <p className="text-red-700">
            {error}
          </p>

        </div>

      </div>
    );
  }


  return (

    <div className="p-8">

      {/* ========================================= */}
      {/* HEADER */}
      {/* ========================================= */}

      <div className="flex justify-between items-center mb-8">

        <div>

          <h1 className="text-3xl font-semibold mb-2">
            Team Usage
          </h1>

          <p className="text-slate-600">
            Monitor team-wise consumption and limits
          </p>

        </div>

        <div className="flex gap-4">

          {/* FINANCIAL YEAR */}

          <select

            value={financialYear}

            onChange={(e) =>
              setFinancialYear(
                e.target.value
              )
            }

            className="px-4 py-2 border border-slate-300 rounded-xl bg-white"
          >

            <option value="2024-2025">
              FY 2024-2025
            </option>

            <option value="2025-2026">
              FY 2025-2026
            </option>

            <option value="2026-2027">
              FY 2026-2027
            </option>

          </select>

          {/* TOPUP BUTTON */}

          <button

            onClick={() =>
              navigate("/topups")
            }

            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
          >

            <Plus className="w-4 h-4" />

            Add Top-Up

          </button>

        </div>

      </div>


      {/* ========================================= */}
      {/* TABLE */}
      {/* ========================================= */}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-slate-50 border-b border-slate-200">

              <tr>

                <th className="px-6 py-4 w-8"></th>

                <th className="px-6 py-4 text-left text-sm text-slate-600">
                  Team Name
                </th>

                <th className="px-6 py-4 text-left text-sm text-slate-600">
                  Licences
                </th>

                <th className="px-6 py-4 text-left text-sm text-slate-600">
                  CV Usage
                </th>

                <th className="px-6 py-4 text-left text-sm text-slate-600">
                  NVites Usage
                </th>

                <th className="px-6 py-4 text-left text-sm text-slate-600">
                  Jobs Usage
                </th>

                <th className="px-6 py-4 text-left text-sm text-slate-600">
                  Status
                </th>

                <th className="px-6 py-4 text-left text-sm text-slate-600">
                  Outstanding
                </th>

                <th className="px-6 py-4 text-left text-sm text-slate-600">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {teams.map((team) => {

                const expanded =
                  expandedTeams.has(team.id);

                return (

                  <>

                    {/* TEAM ROW */}

                    <tr

                      key={team.id}

                      className="border-b border-slate-100 hover:bg-slate-50 transition"
                    >

                      <td className="px-6 py-4">

                        <button

                          onClick={() =>
                            toggleTeam(team.id)
                          }

                          className="text-slate-400 hover:text-slate-700"
                        >

                          {expanded ? (

                            <ChevronDown className="w-4 h-4" />

                          ) : (

                            <ChevronRight className="w-4 h-4" />
                          )}

                        </button>

                      </td>

                      <td className="px-6 py-4 font-medium">

                        {team.name}

                      </td>

                      <td className="px-6 py-4">

                        {team.licence_count}

                      </td>

                      {/* CV */}

                      <td className="px-6 py-4">

                        <div className="text-sm">

                          <p className="font-medium">

                            {team.usage.cv.toLocaleString()}
                            {" / "}
                            {team.total_limits.cv.toLocaleString()}

                          </p>

                          <div className={`inline-block mt-1 px-2 py-1 rounded border text-xs ${getUsageColor(team.usage_percent.cv)}`}>

                            {team.usage_percent.cv}%

                          </div>

                        </div>

                      </td>

                      {/* NVITES */}

                      <td className="px-6 py-4">

                        <div className="text-sm">

                          <p className="font-medium">

                            {team.usage.nvites.toLocaleString()}
                            {" / "}
                            {team.total_limits.nvites.toLocaleString()}

                          </p>

                          <div className={`inline-block mt-1 px-2 py-1 rounded border text-xs ${getUsageColor(team.usage_percent.nvites)}`}>

                            {team.usage_percent.nvites}%

                          </div>

                        </div>

                      </td>

                      {/* JOBS */}

                      <td className="px-6 py-4">

                        <div className="text-sm">

                          <p className="font-medium">

                            {team.usage.jobs}
                            {" / "}
                            {team.total_limits.jobs}

                          </p>

                          <div className={`inline-block mt-1 px-2 py-1 rounded border text-xs ${getUsageColor(team.usage_percent.jobs)}`}>

                            {team.usage_percent.jobs}%

                          </div>

                        </div>

                      </td>

                      {/* STATUS */}

                      <td className="px-6 py-4">

                        {getStatusBadge(team.status)}

                      </td>

                      {/* OUTSTANDING */}

                      <td className="px-6 py-4">

                        {team.outstanding_invoice > 0 ? (

                          <span className="text-orange-600 font-medium">

                            ₹{team.outstanding_invoice.toLocaleString()}

                          </span>

                        ) : (

                          <span className="text-green-600">
                            —
                          </span>
                        )}

                      </td>

                      {/* ACTION */}

                      <td className="px-6 py-4">

                        <button

                          onClick={() =>
                            handleAddTopUp(team.id)
                          }

                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition text-sm font-medium flex items-center gap-1"
                        >

                          <Plus className="w-3 h-3" />

                          Top-Up

                        </button>

                      </td>

                    </tr>


                    {/* SUBUSERS */}

                    {expanded && (

                      <tr>

                        <td
                          colSpan={9}
                          className="px-6 py-4 bg-slate-50"
                        >

                          <div className="ml-10">

                            <h4 className="font-medium mb-3 flex items-center gap-2">

                              <AlertCircle className="w-4 h-4 text-purple-600" />

                              Team Members

                            </h4>

                            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">

                              <table className="w-full">

                                <thead className="bg-slate-50 border-b border-slate-200">

                                  <tr>

                                    <th className="px-4 py-3 text-left text-xs text-slate-600">
                                      Name
                                    </th>

                                    <th className="px-4 py-3 text-left text-xs text-slate-600">
                                      Email
                                    </th>

                                    <th className="px-4 py-3 text-left text-xs text-slate-600">
                                      CV Usage
                                    </th>

                                    <th className="px-4 py-3 text-left text-xs text-slate-600">
                                      NVites Usage
                                    </th>

                                    <th className="px-4 py-3 text-left text-xs text-slate-600">
                                      Jobs Usage
                                    </th>

                                  </tr>

                                </thead>

                                <tbody>

                                  {team.subusers.map((user) => (

                                    <tr
                                      key={user.id}
                                      className="border-b border-slate-100 last:border-0"
                                    >

                                      <td className="px-4 py-3 text-sm">
                                        {user.name}
                                      </td>

                                      <td className="px-4 py-3 text-sm text-slate-600">
                                        {user.email}
                                      </td>

                                      <td className="px-4 py-3 text-sm font-medium">
                                        {user.cv_usage.toLocaleString()}
                                      </td>

                                      <td className="px-4 py-3 text-sm font-medium">
                                        {user.nvites_usage.toLocaleString()}
                                      </td>

                                      <td className="px-4 py-3 text-sm font-medium">
                                        {user.jobs_usage}
                                      </td>

                                    </tr>

                                  ))}

                                </tbody>

                              </table>

                            </div>

                          </div>

                        </td>

                      </tr>
                    )}

                  </>
                );
              })}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}