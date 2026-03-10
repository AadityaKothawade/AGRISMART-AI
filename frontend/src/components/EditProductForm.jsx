// components/EditProductForm.jsx
import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import './Form.css';

const EditProductForm = ({ product, onClose, onProductUpdated }) => {
  const { getToken } = useAuth();
  const [formData, setFormData] = useState({
    name: product.name || '',
    price: product.price || '',
    quantity: product.quantity || '',
    category: product.category || '',
    image_url: product.image_url || '',
    location: product.location || ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        onProductUpdated();
        onClose();
      } else {
        alert('Error updating product: ' + data.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Product</h2>
        <form onSubmit={handleSubmit}>
          <input name="name" placeholder="Product Name" value={formData.name} onChange={handleChange} required />
          <input name="price" type="number" step="0.01" placeholder="Price" value={formData.price} onChange={handleChange} required />
          <input name="quantity" type="number" placeholder="Quantity" value={formData.quantity} onChange={handleChange} required />
          <input name="category" placeholder="Category" value={formData.category} onChange={handleChange} required />
          <input name="image_url" placeholder="Image URL" value={formData.image_url} onChange={handleChange} />
          <input name="location" placeholder="Location" value={formData.location} onChange={handleChange} required />
          <div className="form-actions">
            <button type="submit" disabled={submitting}>Update Product</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductForm;