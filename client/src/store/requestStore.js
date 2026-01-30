import { create } from "zustand";
import axios from "axios";
import { toast } from "react-toastify";
axios.defaults.withCredentials = true;

const initialState = {
  requests: [],
  requestError: null,
  requestSuccess: null,
  loadingRequest: false,
};
const SERVER_ENDPOINT = `${import.meta.env.VITE_SERVER_API_BASE_URL}`;
export const useRequestStore = create((set, get) => ({
  ...initialState,
  createRequest: async (payload) => {
    set({ loadingRequest: true, requestError: null, requestSuccess: null });
    try {
      const { data } = await axios.post(
        `${SERVER_ENDPOINT}/request/create-request`,
        payload
      );
      if (!data.success) {
        set({
          requestError: data.message,
          requestSuccess: null,
          loadingRequest: false,
        });
        return {
          success: false,
          message: data.message || "Request creation failed",
        };
      }
      set({
        requestError: null,
        requestSuccess: data.message,
        loadingRequest: false,
      });
      await get().fetchAllRequests({ limit: 10, offset: 0 });
      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      console.log("Error fetching requests: ", error?.response?.data?.message);
      set({ loadingRequest: false });
      return {
        success: false,
        message:
          error?.response?.data?.message ||
          "An error occurred while creating request",
      };
    }
  },
  fetchAllRequests: async ({ limit, offset }) => {
    set({ loadingRequest: true, requestError: null, requestSuccess: null });
    try {
      const { data } = await axios.get(
        `${SERVER_ENDPOINT}/request/fetch-all-requests?limit=${limit}&offset=${offset}`
      );
      if (!data.success) {
        set({
          requestError: data.message,
          requestSuccess: null,
          loadingRequest: false,
        });
        return {
          success: false,
          message: data.message || "Fetching requests failed",
        };
      }
      set({
        loadingRequest: false,
        requests: data.requests,
        requestError: null,
        requestSuccess: null,
      });
      return {
        success: true,
        message: data.message,
        requests: data.requests,
        pagination: data.pagination,
      };
    } catch (error) {
      console.log("Error fetching requests: ", error?.response?.data?.message);
      set({ loadingRequest: false });
      return {
        success: false,
        message:
          error?.response?.data?.message ||
          "An error occurred while fetching requests",
      };
    }
  },
  updateRequestStatus: async(payload) =>{
    try {
      const { data } = await axios.post(`${SERVER_ENDPOINT}/request/update-request-status`, payload);
      if (!data.success) {
        return {
          success: false,
          message: data.message || "Updating request status failed",
        };
      }
      return {
        success:true,
        message: data.message,
      }
    } catch (error) {
      console.log("Error updating request status: ", error?.response?.data?.message);
      return {
        success: false,
        message:
          error?.response?.data?.message ||
          "An error occurred while updating request status",
      };
    }
  },
  checkoutEquipment: async(payload) =>{
    try {
      const { data } = await axios.post(`${SERVER_ENDPOINT}/checkout/check-out/${payload.equipment_id}`, payload);
      if (!data.success) {
         toast.error(data.message)
        return {
          success: false,
          message: data.message || "Updating request status failed",
        };

      }
      toast.success(data.message)
      return {
        success:true,
        message: data.message,
      }

    } catch (error) {
      console.log("Error updating request status: ", error?.response?.data?.message);
      toast.error(error?.response?.data?.message || "Error updating request status")
      return {
        success: false,
        message:
          error?.response?.data?.message ||
          "An error occurred while updating request status",
      };
    }
  },
}));
