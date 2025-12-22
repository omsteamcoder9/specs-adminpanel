import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../api/auth';
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// In AuthContext.jsx - Add this temporary fix
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        
        // TEMPORARY FIX: Force admin role for testing
        console.log('🛠️ TEMPORARY FIX: Forcing admin role for development');
        parsedUser.role = 'admin';
        
        setUser(parsedUser);
        
        // Update localStorage with admin role
        localStorage.setItem('user', JSON.stringify(parsedUser));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  
const login = async (email, password) => {
  try {


    const response = await authAPI.login({ email, password })

    console.log('Response status:', response.status);

    const data=response.data || response


    if (!response.status >= 400) {
      throw new Error(data.message || data.error || 'Login failed');
    }
  if (data.error || data.message === 'Login successful' && !data.token) {
      console.warn('Login API returned success message but no token:', data);
      // Continue processing but log the issue
    }
    // Handle different token field names
    const token = data.data.token
    console.log('Found token:', data);



    // Handle different user data structures
    const userData = data.user || data.data || data.userData || data;
    console.log('User data:', userData);

    // Ensure user data has required fields
    if (!userData.email && !userData.id) {
      userData.email = email; // Use login email as fallback
    }

    // Determine role - default to admin for development
    if (!userData.role) {
      userData.role = userData.userType || 
                     (userData.isAdmin ? 'admin' : 'user') || 
                     (userData.type === 'administrator' ? 'admin' : 'user') || 
                     'admin'; // Default to admin for testing
    }

    // Store token and user data
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    setUser(userData);
    return { success: true, user: userData };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
};

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};