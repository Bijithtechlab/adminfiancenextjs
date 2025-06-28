'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '../../components/AuthGuard';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function AddressBook() {
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    person_name: '',
    house_name: '',
    address: '',
    phone_number: '',
    email: '',
    category: 'general',
    notes: ''
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async (search = '') => {
    try {
      const token = localStorage.getItem('token');
      const url = search ? `/api/address-book?search=${encodeURIComponent(search)}` : '/api/address-book';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    fetchContacts(term);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const method = editingContact ? 'PUT' : 'POST';
      const body = editingContact ? { ...formData, id: editingContact.id } : formData;
      
      const response = await fetch('/api/address-book', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        resetForm();
        fetchContacts();
      }
    } catch (error) {
      console.error('Error saving contact:', error);
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      person_name: contact.person_name,
      house_name: contact.house_name || '',
      address: contact.address,
      phone_number: contact.phone_number,
      email: contact.email || '',
      category: contact.category,
      notes: contact.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/address-book?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchContacts();
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      person_name: '',
      house_name: '',
      address: '',
      phone_number: '',
      email: '',
      category: 'general',
      notes: ''
    });
    setEditingContact(null);
    setShowForm(false);
  };

  const handleExport = async () => {
    // Create a temporary div with the table content
    const exportDiv = document.createElement('div');
    exportDiv.style.position = 'absolute';
    exportDiv.style.left = '-9999px';
    exportDiv.style.top = '0';
    exportDiv.style.width = '800px';
    exportDiv.style.backgroundColor = 'white';
    exportDiv.style.padding = '20px';
    exportDiv.style.fontFamily = 'Arial, sans-serif';
    
    exportDiv.innerHTML = `
      <h1 style="text-align: center; color: #333; margin-bottom: 20px;">Address Book</h1>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #3b82f6; color: white;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">S.No</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Name</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">House Name</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Phone Number</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Address</th>
          </tr>
        </thead>
        <tbody>
          ${contacts.map((contact, index) => `
            <tr style="${index % 2 === 0 ? 'background-color: #f9f9f9;' : ''}">
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${contact.person_name}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${contact.house_name || ''}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${contact.phone_number}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${contact.address}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    document.body.appendChild(exportDiv);
    
    try {
      const canvas = await html2canvas(exportDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`address-book-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      document.body.removeChild(exportDiv);
    }
  };

  return (
    <AuthGuard>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Address Book</h1>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              📥 Export
            </button>
            <button
              onClick={() => showForm ? resetForm() : setShowForm(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {showForm ? 'Cancel' : 'Add Contact'}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full p-2 border rounded"
          />
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Person Name *"
                value={formData.person_name}
                onChange={(e) => setFormData({...formData, person_name: e.target.value})}
                className="p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="House Name"
                value={formData.house_name}
                onChange={(e) => setFormData({...formData, house_name: e.target.value})}
                className="p-2 border rounded"
              />
              <textarea
                placeholder="Address *"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="p-2 border rounded md:col-span-2"
                required
              />
              <input
                type="tel"
                placeholder="Phone Number *"
                value={formData.phone_number}
                onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                className="p-2 border rounded"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="p-2 border rounded"
              />
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="p-2 border rounded"
              >
                <option value="general">General</option>
                <option value="donor">Donor</option>
                <option value="family">Family</option>
                <option value="business">Business</option>
                <option value="emergency">Emergency</option>
              </select>
              <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="p-2 border rounded"
              />
            </div>
            <button
              type="submit"
              className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              {editingContact ? 'Update Contact' : 'Add Contact'}
            </button>
          </form>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{contact.person_name}</div>
                        {contact.house_name && (
                          <div className="text-sm text-gray-500">{contact.house_name}</div>
                        )}
                        {contact.email && (
                          <div className="text-sm text-green-600">✉️ {contact.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      📞 {contact.phone_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                      {contact.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        contact.category === 'donor' ? 'bg-green-100 text-green-800' :
                        contact.category === 'family' ? 'bg-purple-100 text-purple-800' :
                        contact.category === 'business' ? 'bg-blue-100 text-blue-800' :
                        contact.category === 'emergency' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {contact.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(contact)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(contact.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}