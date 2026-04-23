// pages/SellProduct.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { supabase } from '../config/supabaseClient';
import { useLanguage } from '../contexts/LanguageContext';
import './SellProduct.css';

const categories = ['vegetables', 'grains', 'fruits', 'fertilizers', 'seeds', 'tools', 'pesticides'];

export default function SellProduct() {
  const { t } = useLanguage();
  const { getToken, userId } = useAuth();
  const [formData, setFormData] = useState({
    product_name: '', category: categories[0], quantity: '', price: '', location: '', description: '', image: null
  });
  const [uploading, setUploading] = useState(false);
  const [userProducts, setUserProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { fetchMyProducts(); }, []);

  const fetchMyProducts = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/products/my-products', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setUserProducts(data.data || []);
    } catch (error) { console.error('Error fetching products:', error); }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') setFormData(prev => ({ ...prev, image: files[0] }));
    else setFormData(prev => ({ ...prev, [name]: value }));
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('product-images').upload(fileName, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let image_url = formData.image_url || '';
      if (formData.image) image_url = await uploadImage(formData.image);
      const token = await getToken();
      const payload = {
        product_name: formData.product_name, category: formData.category,
        quantity: parseFloat(formData.quantity), price: parseFloat(formData.price),
        location: formData.location, description: formData.description, image_url
      };
      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      if (res.ok) {
        alert(editingId ? t('product_updated') : t('product_listed'));
        setFormData({ product_name: '', category: categories[0], quantity: '', price: '', location: '', description: '', image: null });
        setEditingId(null);
        fetchMyProducts();
      } else { const error = await res.json(); alert('Error: ' + error.error); }
    } catch (error) { console.error('Submit error:', error); alert('Failed to save product'); }
    finally { setUploading(false); }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setFormData({
      product_name: product.product_name, category: product.category, quantity: product.quantity,
      price: product.price, location: product.location || '', description: product.description || '',
      image_url: product.image_url, image: null
    });
  };

  const handleDelete = async (id) => {
    if (!confirm(t('are_you_sure'))) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) fetchMyProducts();
      else alert(t('delete_failed'));
    } catch (error) { console.error('Delete error:', error); }
  };

  return (
    <div className="sell-product">
      <h2>{editingId ? t('edit_product') : t('sell_title')}</h2>
      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-group"><label>{t('product_name')}</label><input type="text" name="product_name" value={formData.product_name} onChange={handleChange} required /></div>
        <div className="form-group"><label>{t('category')}</label><select name="category" value={formData.category} onChange={handleChange} required>{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
        <div className="form-row">
          <div className="form-group"><label>{t('quantity')} *</label><input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required min="0.01" step="0.01" /></div>
          <div className="form-group"><label>{t('price')} (₹) *</label><input type="number" name="price" value={formData.price} onChange={handleChange} required min="0" step="0.01" /></div>
        </div>
        <div className="form-group"><label>{t('location')}</label><input type="text" name="location" value={formData.location} onChange={handleChange} placeholder={t('location_placeholder')} /></div>
        <div className="form-group"><label>{t('description')}</label><textarea name="description" value={formData.description} onChange={handleChange} rows="3" /></div>
        <div className="form-group"><label>{t('product_image')}</label><input type="file" name="image" accept="image/*" onChange={handleChange} />
          {formData.image_url && !formData.image && <div className="current-image"><img src={formData.image_url} alt="Current" /><span>{t('current_image')}</span></div>}
        </div>
        <button type="submit" disabled={uploading} className="submit-btn">{uploading ? t('uploading') : editingId ? t('update_product') : t('list_product')}</button>
      </form>
      <h3 style={{ marginTop: '3rem' }}>{t('your_listings')}</h3>
      <div className="product-list">
        {userProducts.length === 0 && <p>You haven't listed any products yet.</p>}
        {userProducts.map(product => (
          <motion.div key={product.id} className="product-item" whileHover={{ y: -5 }}>
            {product.image_url && <img src={product.image_url} alt={product.product_name} />}
            <div className="product-info"><h4>{product.product_name}</h4><p>{product.category} – ₹{product.price} / {product.quantity}</p>{product.location && <p className="location">{product.location}</p>}</div>
            <div className="product-actions"><button onClick={() => handleEdit(product)}>{t('edit')}</button><button onClick={() => handleDelete(product.id)} className="delete">{t('delete')}</button></div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}