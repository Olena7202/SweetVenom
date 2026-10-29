import api from '../api/axiosConfig';

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  return response.data.url;
}