import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegistration } from '../contexts/RegContext';

const Register = () => {
  const navigate = useNavigate();
  const { registerUser, loading } = useRegistration();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    shirtSize: 'M'
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.age || !formData.shirtSize) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    const result = await registerUser(formData);
    
    setSubmitting(false);
    
    if (result.success) {
      navigate('/ticket');
    } else {
      setError(result.error || 'เกิดข้อผิดพลาดในการลงทะเบียน');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">กำลังโหลด...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white">
      <div className="glass-panel p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-magical-gold text-glow">
          ลงทะเบียนเข้าร่วมงาน
        </h2>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-100 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-white/80">ชื่อ - นามสกุล</label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-magical-light transition-colors"
              placeholder="นายสมชาย รักเรียน"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-white/80">อายุ</label>
            <input 
              type="number" 
              name="age"
              min="15"
              max="100"
              value={formData.age}
              onChange={handleChange}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-magical-light transition-colors"
              placeholder="18"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-white/80">ไซส์เสื้อ</label>
            <select 
              name="shirtSize"
              value={formData.shirtSize}
              onChange={handleChange}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-magical-light transition-colors"
            >
              <option value="S" className="bg-magical-dark">S</option>
              <option value="M" className="bg-magical-dark">M</option>
              <option value="L" className="bg-magical-dark">L</option>
              <option value="XL" className="bg-magical-dark">XL</option>
              <option value="XXL" className="bg-magical-dark">XXL</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="glass-button w-full mt-6"
          >
            {submitting ? 'กำลังบันทึก...' : 'ยืนยันการลงทะเบียน'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
