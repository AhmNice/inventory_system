import {
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  Loader,
  Package,
  Scan,
  User,
  Clock,
  CheckCircle,
  Loader2,
  XCircle,
  Edit,
} from "lucide-react";
import { toast } from "react-toastify";
import PageLayOut from "../layout/PageLayOut";
import { useState } from "react";
import ReturnManually from "../assets/components/modal/ReturnManually";

const RequestDetailView = ({
  request,
  userRole,
  onBack,
  onApprove,
  onDecline,
  onScanEquipment,
  formatDate,
  formatDateTime,
  getStatusIcon,
  getStatusColor,
}) => {
  const [declineReason, setDeclineReason] = useState("");
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // const { use}

  const handleDeclineSubmit = () => {
    onDecline(request.request_id, declineReason);
    setShowDeclineForm(false);
    setDeclineReason("");
  };

const [showModal, setShowModal] = useState(false)

  return (
    <PageLayOut>

      {showModal && <ReturnManually onClose={()=> setShowModal(false)} request_id={request.request_id}/>}
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Requests</span>
            </button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Request Details
                </h1>
                <p className="text-gray-600 mt-2">
                  Request ID: {request.request_id}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(request.status)}
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      request.status,
                    )}`}
                  >
                    {request.status?.charAt(0).toUpperCase() +
                      request.status?.slice(1) || "Unknown"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Equipment List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Requested Equipment
                </h2>
                <div className="space-y-3">
                  {request.equipment && request.equipment.length > 0 ? (
                    request.equipment.map((item, index) => {
                      const shortage = Math.max(
                        0,
                        item.requested_quantity - item.quantity,
                      );
                      const isSufficient = shortage === 0;

                      return (
                        <div
                          key={`${item.good_id}-${index}`}
                          className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-all"
                        >
                          <div className="flex items-start justify-between">
                            {/* Equipment Info */}
                            <div className="flex items-start space-x-3 flex-1">
                              {/* Status Indicator */}
                              <div
                                className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                                  isSufficient ? "bg-green-500" : "bg-red-500"
                                }`}
                              />

                              {/* Icon */}
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package className="w-5 h-5 text-gray-600" />
                              </div>

                              {/* Details */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-gray-900 truncate">
                                    {item.equipment_name}
                                  </h4>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(
                                        item.good_id,
                                      );

                                      toast.success("ID copied to clipboard!");
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 flex-shrink-0 ml-2"
                                  >
                                    Copy ID
                                  </button>
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {item.category_name}
                                </div>
                                <div className="text-xs text-gray-500 font-mono mt-1">
                                  {item.good_id}
                                </div>
                              </div>
                            </div>

                            {/* Quantities */}
                            <div className="text-right ml-4">
                              <div className="flex items-center justify-end space-x-4">
                                <div className="text-center">
                                  <div className="text-xs text-gray-500 mb-1">
                                    Requested
                                  </div>
                                  <div className="font-bold text-gray-900">
                                    {item.requested_quantity}
                                  </div>
                                </div>
                                <div className="w-px h-6 bg-gray-300" />
                                <div
                                  className={`text-center ${
                                    isSufficient
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  <div className="text-xs mb-1">Available</div>
                                  <div className="font-bold">
                                    {item.quantity}
                                  </div>
                                </div>
                              </div>

                              {!isSufficient && (
                                <div className="text-xs text-red-600 font-medium mt-2 px-2 py-1 bg-red-50 rounded inline-block">
                                  {shortage} units needed
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6">
                      <div className="text-gray-400 mb-2">No equipment</div>
                      <div className="text-sm text-gray-500">
                        This request doesn't contain any equipment items
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Purpose and Notes */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Request Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Purpose
                    </label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {request.purpose || "No purpose provided"}
                    </p>
                  </div>

                  {request.note && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Notes
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {request.note}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Actions */}
              {(userRole === "admin" || userRole === "super_admin") && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Admin Actions
                  </h2>

                  {request.status === "pending" && (
                    <div className="flex space-x-4">
                      <button
                        onClick={() => onApprove(request.request_id)}
                        disabled={loading}
                        className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-5 h-5" />
                        )}
                        <span>
                          {loading ? "Approving..." : "Approve Request"}
                        </span>
                      </button>

                      {showDeclineForm ? (
                        <div className="flex-1 space-y-3">
                          <textarea
                            value={declineReason}
                            onChange={(e) => setDeclineReason(e.target.value)}
                            placeholder="Provide reason for declining..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db002f] focus:border-transparent"
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={handleDeclineSubmit}
                              disabled={loading}
                              className="flex-1 bg-[#db002f] text-white py-2 px-4 rounded-lg hover:bg-[#b50025] transition-colors disabled:opacity-50"
                            >
                              {loading ? "Declining..." : "Confirm Decline"}
                            </button>
                            <button
                              onClick={() => setShowDeclineForm(false)}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowDeclineForm(true)}
                          className="flex-1 bg-[#db002f] text-white py-3 px-4 rounded-lg hover:bg-[#b50025] transition-colors flex items-center justify-center space-x-2"
                        >
                          <XCircle className="w-5 h-5" />
                          <span>Decline Request</span>
                        </button>
                      )}
                    </div>
                  )}

                  {request.status === "approved" && (
                    <div className="gap-4 flex flex-col">
                      <button

                      className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Scan className="w-5 h-5" />
                      <span> Scan  Equipment</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowModal(true)
                      }}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Edit className="w-5 h-5" />
                      <span> Checkout Equipment</span>
                    </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Requester Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Requester Information
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-[#ffe6ea] rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-[#db002f]" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {request.user_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.user_department}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{request.user_email}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{request.user_phone || "No phone provided"}</span>
                  </div>
                </div>
              </div>

              {/* Request Timeline */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Request Timeline
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                      <Clock className="w-4 h-4" />
                      <span>Submitted</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatDateTime(request.submitted_at)}
                    </div>
                  </div>

                  {request.approved_at && (
                    <div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Approved</span>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatDateTime(request.approved_at)}
                      </div>
                      <div className="text-xs text-gray-500">
                        by {request.approved_by}
                      </div>
                    </div>
                  )}

                  {request.declined_at && (
                    <div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span>Declined</span>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatDateTime(request.declined_at)}
                      </div>
                      <div className="text-xs text-gray-500">
                        by {request.declined_by}
                      </div>
                      {request.decline_reason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                          {request.decline_reason}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayOut>
  );
};
export default RequestDetailView;
