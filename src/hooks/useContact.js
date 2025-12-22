import { useState } from 'react';
import { contactAPI } from './contactAPI';

export const useContact = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submitContact = async (contactData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await contactAPI.submitContact(contactData);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to submit message';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getMessages = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await contactAPI.getContactMessages(params);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch messages';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getMessage = async (messageId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await contactAPI.getContactMessage(messageId);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch message';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (messageId, status) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await contactAPI.updateMessageStatus(messageId, status);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await contactAPI.deleteContactMessage(messageId);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete message';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    loading,
    error,
    submitContact,
    getMessages,
    getMessage,
    updateStatus,
    deleteMessage,
    clearError,
  };
};