import apiClient from './client'

export const login = async (correo, contrasena) => {
  const { data } = await apiClient.post('/auth/login', {
    correo,
    contrasena,
  })
  localStorage.setItem('access_token', data.access_token)
  return data
}

export const getMe = async () => {
  const { data } = await apiClient.get('/auth/me')
  return data
}

export const logout = async () => {
  try {
    await apiClient.post('/auth/logout')
  } catch (_) {
    // ignorar si falla
  }
  localStorage.removeItem('access_token')
  localStorage.removeItem('user')
}