import React, { useState } from 'react';
import { X, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useRequestStore } from '../../../store/requestStore';

const ReturnManually = ({ onClose, onReturnSuccess, request_id }) => {
  const [equipmentId, setEquipmentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const {checkoutEquipment} = useRequestStore()
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!equipmentId.trim()) {
      setError('Please enter an Equipment ID');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        equipment_id: equipmentId,
        request_id
      }
     const response = await checkoutEquipment(payload)
     if(!response.success){
      return
     }
      setSuccess(`Equipment ${equipmentId} returned successfully!`);
      setEquipmentId('');
    } catch (err) {
      console.log(err)
      toast.error(err.message)
      setError('Failed to process return. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose?.();
  };

  return (
    <div className='fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-xl shadow-lg max-w-md w-full'>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h4 className="text-xl font-semibold text-gray-900">
            Return Equipment Manually
          </h4>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Enter the Equipment ID to process the return. This will update the equipment status and inventory.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="equipmentId" className="block text-sm font-medium text-gray-700 mb-2">
                Equipment ID *
              </label>
              <div className="relative">
                <input
                  id="equipmentId"
                  type="text"
                  value={equipmentId}
                  onChange={(e) => {
                    setEquipmentId(e.target.value);
                    setError('');
                    setSuccess('');
                  }}
                  placeholder="Enter equipment ID (e.g., EQ-12345)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
                  disabled={loading}
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !equipmentId.trim()}
                className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Return Equipment</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> The equipment ID can usually be found on the equipment label,
              barcode, or in the equipment documentation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnManually;