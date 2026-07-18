const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface UserSettings {
  brand_persona: string | null;
  cms_wordpress_url: string | null;
  cms_wordpress_username: string | null;
  cms_wordpress_app_password: string | null;
  cms_medium_token: string | null;
  cms_linkedin_token: string | null;
  cms_linkedin_author_urn: string | null;
}

export const getMe = async (token: string) => {
  return fetch(`${BASE_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const getDashboard = async (token: string) => {
  return fetch(`${BASE_URL}/users/me/dashboard`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

export const updateMe = async (token: string, data: any) => {
  return fetch(`${BASE_URL}/users/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
};
