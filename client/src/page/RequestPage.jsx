import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Package,
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Send,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import PageLayOut from "../layout/PageLayOut";
import { useEquipmentStore } from "../store/equipmentStore";
import { useAuthStore } from "../store/authStore";
import { useRequestStore } from "../store/requestStore";

const RequestEquipmentPage = () => {
  const { equipment, fetchEquipment } = useEquipmentStore();
  const { user } = useAuthStore();
  const { createRequest } = useRequestStore();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [requestForm, setRequestForm] = useState({
    purpose: "",
    notes: "",
  });

  useEffect(() => {
    const loadEquipment = async () => {
      try {
        await fetchEquipment();
      } catch (error) {
        console.error("Error fetching equipment:", error);
        toast.error("Failed to load equipment");
      } finally {
        setLoading(false);
      }
    };
    loadEquipment();
  }, []);

  // Get unique categories from equipment data
  const categories = [
    ...new Set(equipment?.map((item) => item.category_name).filter(Boolean)),
  ];

  const filteredEquipment =
    equipment?.filter((item) => {
      if (!item) return false;

      const matchesSearch =
        item.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || item.category_name === categoryFilter;

      return matchesSearch && matchesCategory;
    }) || [];

  const handleAddToRequest = (item) => {
    const existingItem = selectedEquipment.find(
      (selected) => selected.equipment_id === item.equipment_id
    );

    if (existingItem) {
      if (existingItem.quantity + 1 > item.quantity) {
        toast.error(`Only ${item.quantity} ${item.equipment_name} available`);
        return;
      }
      setSelectedEquipment(
        selectedEquipment.map((selected) =>
          selected.equipment_id === item.equipment_id
            ? { ...selected, quantity: selected.quantity + 1 }
            : selected
        )
      );
    } else {
      if (item.quantity === 0 || item.status !== "available") {
        toast.error(`${item.equipment_name} is currently unavailable`);
        return;
      }
      setSelectedEquipment([
        ...selectedEquipment,
        {
          ...item,
          quantity: 1,
          equipment_id: item.equipment_id,
        },
      ]);
    }
    toast.success(`${item.equipment_name} added to request`);
  };

  const handleRemoveFromRequest = (itemId) => {
    setSelectedEquipment(
      selectedEquipment.filter((item) => item.equipment_id !== itemId)
    );
    toast.info("Item removed from request");
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    const item = selectedEquipment.find((item) => item.equipment_id === itemId);
    const equipmentItem = equipment.find((eq) => eq.equipment_id === itemId);

    if (!equipmentItem) return;

    if (newQuantity < 1) {
      handleRemoveFromRequest(itemId);
      return;
    }

    if (newQuantity > equipmentItem.quantity) {
      toast.error(
        `Only ${equipmentItem.quantity} ${equipmentItem.equipment_name} available`
      );
      return;
    }

    setSelectedEquipment(
      selectedEquipment.map((item) =>
        item.equipment_id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRequestFormChange = (e) => {
    const { name, value } = e.target;
    setRequestForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();

    if (selectedEquipment.length === 0) {
      toast.error("Please select at least one equipment item");
      return;
    }

    if (!requestForm.purpose.trim()) {
      toast.error("Please provide a purpose for this request");
      return;
    }

   

    const startDate = new Date(requestForm.start_date);
    const endDate = new Date(requestForm.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);


    // Calculate total days
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff > 30) {
      toast.error("Maximum rental period is 30 days");
      return;
    }

    try {
      // Prepare request data
      const requestData = {
        equipment: selectedEquipment.map((item) => ({
          equipment_id: item.equipment_id,
          quantity: item.quantity,
          equipment_name: item.equipment_name,
        })),
        user_id: user.user_id,
        reason: requestForm.purpose,
        start_date: requestForm.start_date,
        end_date: requestForm.end_date,
        notes: requestForm.notes,
        total_days: daysDiff,
        requested_at: new Date().toISOString(),
      };

      console.log("Submitting request:", requestData);

      const result = await createRequest(requestData);
      if (result.success) {
        toast.success(result.message);
        // Reset form
        setSelectedEquipment([]);
        setRequestForm({
          purpose: "",
          start_date: "",
          end_date: "",
          notes: "",
        });
        return;
      }
      if (!result.success) {
        toast.error(result.message);
        return;
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error("Failed to submit request. Please try again.");
    }
  };

  const getStatusColor = (status, quantity) => {
    if (status !== "available") return "bg-red-100 text-red-800 border-red-200";
    if (quantity === 0) return "bg-red-100 text-red-800 border-red-200";
    if (quantity <= 2) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-green-100 text-green-800 border-green-200";
  };

  const getStatusText = (status, quantity) => {
    if (status !== "available") return "Unavailable";
    if (quantity === 0) return "Out of Stock";
    if (quantity <= 2) return "Low Stock";
    return "Available";
  };

  const calculateTotalDays = () => {
    if (!requestForm.start_date || !requestForm.end_date) return 0;
    const start = new Date(requestForm.start_date);
    const end = new Date(requestForm.end_date);
    const timeDiff = end.getTime() - start.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split("T")[0];
  };

  if (loading) {
    return (
      <PageLayOut>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#db002f] mx-auto" />
            <p className="mt-4 text-gray-600">Loading equipment...</p>
          </div>
        </div>
      </PageLayOut>
    );
  }

  return (
    <PageLayOut>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Request Equipment
            </h1>
            <p className="text-gray-600 mt-2">
              Browse available equipment and submit your request
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Available Equipment */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                {/* Search and Filters */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-4 flex-1">
                      <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search equipment by name, description, or category..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db002f] focus:border-transparent"
                        />
                      </div>

                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db002f] focus:border-transparent"
                      >
                        <option value="all">All Categories</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Filter options"
                      >
                        <Filter className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Equipment Grid */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredEquipment.map((item) => (
                      <div
                        key={item.equipment_id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow hover:border-[#db002f]/20"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="w-10 h-10 bg-[#ffe6ea] rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package className="w-5 h-5 text-[#db002f]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-gray-900 truncate">
                                {item.equipment_name}
                              </h3>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {item.description || "No description available"}
                              </p>
                              <div className="flex items-center space-x-3 mt-2">
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {item.category_name}
                                </span>
                                <span
                                  className={`inline-flex items-center px-2 py-1  rounded-full text-xs font-medium border ${getStatusColor(
                                    item.status,
                                    item.quantity
                                  )}`}
                                >
                                  {getStatusText(item.status, item.quantity)}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 mt-2">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span className="text-xs text-gray-600">
                                  {item.quantity} available
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleAddToRequest(item)}
                            disabled={
                              item.quantity === 0 || item.status !== "available"
                            }
                            className="ml-2 px-3 py-2 bg-[#db002f] text-white rounded-lg hover:bg-[#b50025] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center space-x-1"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredEquipment.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">
                        No equipment found
                      </p>
                      <p className="text-gray-400 mt-2">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Request Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-6">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Request Summary
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Review and submit your equipment request
                  </p>
                </div>

                {/* Selected Equipment */}
                <div className="p-6 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-3">
                    Selected Equipment ({selectedEquipment.length})
                  </h3>

                  {selectedEquipment.length === 0 ? (
                    <div className="text-center py-4">
                      <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">
                        No equipment selected
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Add items from the list
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {selectedEquipment.map((item) => (
                        <div
                          key={item.equipment_id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate">
                              {item.equipment_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.category_name}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  item.equipment_id,
                                  item.quantity - 1
                                )
                              }
                              className="p-1 text-gray-500 hover:text-[#db002f] transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-medium w-8 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  item.equipment_id,
                                  item.quantity + 1
                                )
                              }
                              disabled={item.quantity >= item.quantity}
                              className="p-1 text-gray-500 hover:text-[#db002f] transition-colors disabled:opacity-50"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleRemoveFromRequest(item.equipment_id)
                              }
                              className="p-1 text-gray-400 hover:text-[#db002f] transition-colors ml-2"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Request Form */}
                <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
                  <div>
                    <label
                      htmlFor="purpose"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Purpose of Request *
                    </label>
                    <textarea
                      id="purpose"
                      name="purpose"
                      value={requestForm.purpose}
                      onChange={handleRequestFormChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db002f] focus:border-transparent"
                      placeholder="Describe what you'll be using the equipment for..."
                      required
                    />
                  </div>



                  {requestForm.start_date && requestForm.end_date && (
                    <div className="bg-[#ffe6ea] border border-[#ffb8c4] rounded-lg p-3">
                      <div className="flex items-center space-x-2 text-[#db002f]">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {calculateTotalDays()} day
                          {calculateTotalDays() !== 1 ? "s" : ""} rental period
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="notes"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Additional Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={requestForm.notes}
                      onChange={handleRequestFormChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db002f] focus:border-transparent"
                      placeholder="Any special requirements or notes..."
                    />
                  </div>

                  {/* Request Summary */}
                  {selectedEquipment.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Total Items:</span>
                        <span className="font-medium">
                          {selectedEquipment.length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-gray-600">Total Quantity:</span>
                        <span className="font-medium">
                          {selectedEquipment.reduce(
                            (sum, item) => sum + item.quantity,
                            0
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-gray-600">Rental Period:</span>
                        <span className="font-medium">
                          {calculateTotalDays()} days
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={selectedEquipment.length === 0}
                    className="w-full bg-[#db002f] text-white py-3 px-4 rounded-lg hover:bg-[#b50025] focus:outline-none focus:ring-2 focus:ring-[#db002f] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <Send className="w-5 h-5" />
                    <span>Submit Request</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayOut>
  );
};

export default RequestEquipmentPage;
