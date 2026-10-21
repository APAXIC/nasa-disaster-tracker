import apiClient from '../../lib/apiClient.js';

export const registerUser = async (name, email, password) => {
  const response = await apiClient.post('/auth/register', {
    name,
    email,
    password
  });

  if (response.data.accessToken) {
    localStorage.setItem('accessToken', response.data.accessToken);
  }

  return response.data;
};

export const loginUser = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password });

  if (response.data.accessToken) {
    localStorage.setItem('accessToken', response.data.accessToken);
  }

  return response.data;
};

export const logoutUser = async () => {
  await apiClient.post('/auth/logout');
  localStorage.removeItem('accessToken');
};

export const fetchCurrentUser = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};
