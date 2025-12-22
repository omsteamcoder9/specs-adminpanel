// src/components/ConfirmationModal.jsx
import React from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

const ConfirmationModal = ({ 
  title, 
  message, 
  confirmText, 
  cancelText, 
  onConfirm, 
  onCancel, 
  type = 'danger',
  icon 
}) => {
  const typeStyles = {
    danger: {
      iconColor: 'text-red-600',
      bgColor: 'bg-red-100',
      buttonColor: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-100',
      buttonColor: 'bg-amber-600 hover:bg-amber-700'
    },
    success: {
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100',
      buttonColor: 'bg-green-600 hover:bg-green-700'
    }
  };

  const styles = typeStyles[type];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 ${styles.bgColor} rounded-full`}>
              {icon || <AlertCircle className={`w-6 h-6 ${styles.iconColor}`} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                <button
                  onClick={onCancel}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <p className="text-slate-600">{message}</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              {cancelText || 'Cancel'}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-white rounded-lg font-medium transition-colors ${styles.buttonColor}`}
            >
              {confirmText || 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;