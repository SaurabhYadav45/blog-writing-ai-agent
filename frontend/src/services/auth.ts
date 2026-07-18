const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const login = async (formData: URLSearchParams) => {
  return fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  });
};

export const signup = async (data: { email: string; password: string; full_name?: string }) => {
  return fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
};

export const googleLogin = async (token: string) => {
  return fetch(`${BASE_URL}/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });
};
