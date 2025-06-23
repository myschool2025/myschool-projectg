import React from 'react';
import { FeeCollection } from '@/lib/types';

interface ReceiptProps {
  feeCollection: FeeCollection;
  student: {
    FullName: string;
    StudentUniqueCode: string;
    ClassName: string;
    ShiftName: string;
    Mobile: string;
  };
  schoolInfo: {
    name: string;
    address: string;
    phone: string;
    email?: string;
    logo?: string;
  };
}

const Receipt: React.FC<ReceiptProps> = ({ feeCollection, student, schoolInfo }) => {
  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getFeeTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'monthly_fee': 'মাসিক বেতন',
      'transport_fee': 'পরিবহন ফি',
      'books': 'বইয়ের ফি',
      'khata': 'খাতা ফি',
      'other': 'অন্যান্য ফি'
    };
    return labels[type] || type;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: { [key: string]: string } = {
      'cash': 'নগদ',
      'mobile_banking': 'মোবাইল ব্যাংকিং',
      'bank_transfer': 'ব্যাংক ট্রান্সফার'
    };
    return labels[method] || method;
  };

  return (
    <div className="receipt-container" style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', padding: '20px' }}>
      {/* School Header */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '20px', marginBottom: '20px' }}>
        {schoolInfo.logo && (
          <img 
            src={schoolInfo.logo} 
            alt="School Logo" 
            style={{ height: '60px', marginBottom: '10px' }}
          />
        )}
        <h1 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
          {schoolInfo.name}
        </h1>
        <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
          {schoolInfo.address}
        </p>
        <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
          ফোন: {schoolInfo.phone}
          {schoolInfo.email && ` | ইমেইল: ${schoolInfo.email}`}
        </p>
      </div>

      {/* Receipt Title */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ margin: '0', fontSize: '20px', fontWeight: 'bold', color: '#333', border: '2px solid #333', padding: '10px', display: 'inline-block' }}>
          ফি আদায়ের রসিদ
        </h2>
      </div>

      {/* Receipt Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold', color: '#333', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>
            রসিদের বিবরণ
          </h3>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '5px 0' }}>রসিদ নং:</td>
                <td style={{ padding: '5px 0' }}>{feeCollection.receiptNumber}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '5px 0' }}>তারিখ:</td>
                <td style={{ padding: '5px 0' }}>{formatDate(feeCollection.collectedAt)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '5px 0' }}>ফি প্রকার:</td>
                <td style={{ padding: '5px 0' }}>{getFeeTypeLabel(feeCollection.collectionType)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '5px 0' }}>পরিশোধ পদ্ধতি:</td>
                <td style={{ padding: '5px 0' }}>{getPaymentMethodLabel(feeCollection.paymentMethod)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '5px 0' }}>সংগ্রহকারী:</td>
                <td style={{ padding: '5px 0' }}>{feeCollection.collectedBy}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold', color: '#333', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>
            শিক্ষার্থীর তথ্য
          </h3>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '5px 0' }}>নাম:</td>
                <td style={{ padding: '5px 0' }}>{student.FullName}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '5px 0' }}>শিক্ষার্থী আইডি:</td>
                <td style={{ padding: '5px 0' }}>{student.StudentUniqueCode}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '5px 0' }}>শ্রেণী:</td>
                <td style={{ padding: '5px 0' }}>{student.ClassName}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '5px 0' }}>শিফট:</td>
                <td style={{ padding: '5px 0' }}>{student.ShiftName}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '5px 0' }}>মোবাইল:</td>
                <td style={{ padding: '5px 0' }}>{student.Mobile}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Amount Details */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold', color: '#333', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>
          অর্থের বিবরণ
        </h3>
        <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>বিবরণ</th>
              <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right' }}>পরিমাণ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                {getFeeTypeLabel(feeCollection.collectionType)}
                {feeCollection.description && (
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    {feeCollection.description}
                  </div>
                )}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                {formatAmount(feeCollection.amount)}
              </td>
            </tr>
            <tr style={{ backgroundColor: '#f9f9f9' }}>
              <td style={{ border: '1px solid #ddd', padding: '10px', fontWeight: 'bold' }}>মোট</td>
              <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>
                {formatAmount(feeCollection.amount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Guardian Info */}
      {feeCollection.guardianName && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold', color: '#333', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>
            অভিভাবকের তথ্য
          </h3>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '5px 0' }}>নাম:</td>
                <td style={{ padding: '5px 0' }}>{feeCollection.guardianName}</td>
              </tr>
              {feeCollection.guardianPhone && (
                <tr>
                  <td style={{ fontWeight: 'bold', padding: '5px 0' }}>মোবাইল:</td>
                  <td style={{ padding: '5px 0' }}>{feeCollection.guardianPhone}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes */}
      {feeCollection.notes && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold', color: '#333', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>
            মন্তব্য
          </h3>
          <p style={{ fontSize: '14px', color: '#666', margin: '0', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
            {feeCollection.notes}
          </p>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: '40px', borderTop: '2px solid #333', paddingTop: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #333', paddingTop: '10px', marginTop: '50px' }}>
              <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>অভিভাবকের স্বাক্ষর</p>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #333', paddingTop: '10px', marginTop: '50px' }}>
              <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>অফিসের স্বাক্ষর</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Instructions */}
      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#999' }}>
        <p>এই রসিদটি প্রিন্ট করুন এবং সুরক্ষিত রাখুন</p>
      </div>
    </div>
  );
};

export default Receipt; 