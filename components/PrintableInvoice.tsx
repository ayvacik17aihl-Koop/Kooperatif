'use client';
import React from 'react';

export const PrintableInvoice = React.forwardRef(({ fatura, satirlar }: any, ref: any) => {
  if (!fatura) return null;

  return (
    <div ref={ref} className="p-12 bg-white text-black font-sans leading-tight print:p-8" style={{ width: '210mm', minHeight: '297mm' }}>
      {/* Header: Logo ve Firma Bilgileri */}
      <div className="flex justify-between items-start border-b-4 border-gray-800 pb-8 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-gray-900 mb-2">KOOPERATİF OTOMASYON</h1>
          <p className="text-sm text-gray-600 w-64 uppercase">
            Örnek Mah. İstasyon Cad. No:45/A <br />
            Kadıköy / İSTANBUL <br />
            Tel: 0216 123 45 67 | Vergi No: 1234567890
          </p>
        </div>
        <div className="text-right">
          <div className="bg-gray-800 text-white px-4 py-2 inline-block font-bold text-xl mb-2">FATURA</div>
          <div className="text-sm space-y-1 text-gray-700">
            <p><strong>Fatura No:</strong> {fatura.fatura_no}</p>
            <p><strong>Tarih:</strong> {new Date(fatura.tarih).toLocaleDateString('tr-TR')}</p>
          </div>
        </div>
      </div>

      {/* Cari Bilgileri */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div className="bg-gray-50 p-6 rounded-xl border">
          <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Müşteri / Tedarikçi Bilgileri</h4>
          <p className="text-lg font-bold text-gray-900 mb-1">{fatura.cari?.tam_ad}</p>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{fatura.cari?.adres || 'Adres bilgisi girilmemiş.'}</p>
          <p className="text-sm text-gray-700 mt-2 font-medium">TC/VN: {fatura.cari?.tc_no}</p>
        </div>
        <div className="flex flex-col justify-end text-right pb-4">
          <p className="text-xs font-bold text-gray-400 uppercase">Ödeme Türü</p>
          <p className="text-sm font-bold text-gray-800">Cari Hesaba Borç / Havale</p>
        </div>
      </div>

      {/* Ürün Tablosu */}
      <table className="w-full mb-12 border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-800 text-left text-xs font-bold uppercase text-gray-600">
            <th className="py-3 px-2">Ürün Açıklaması</th>
            <th className="py-3 px-2 text-right">Miktar</th>
            <th className="py-3 px-2 text-right">Birim Fiyat</th>
            <th className="py-3 px-2 text-right">KDV (%)</th>
            <th className="py-3 px-2 text-right">Satır Toplamı</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {satirlar?.map((s: any, idx: number) => (
            <tr key={idx} className="text-sm text-gray-800 italic">
              <td className="py-4 px-2 font-medium not-italic">{s.urun_adi || 'Stok Kaydı'}</td>
              <td className="py-4 px-2 text-right">{s.miktar} Adet</td>
              <td className="py-4 px-2 text-right">{Number(s.birim_fiyat).toLocaleString('tr-TR')} ₺</td>
              <td className="py-4 px-2 text-right">%{s.kdv_orani}</td>
              <td className="py-4 px-2 text-right font-bold">{Number(s.satir_toplami).toLocaleString('tr-TR')} ₺</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Alt Toplamlar */}
      <div className="flex justify-end border-t-2 border-gray-100 pt-6">
        <div className="w-64 space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Ara Toplam</span>
            <span>{Number(fatura.toplam_ara_tutar).toLocaleString('tr-TR')} ₺</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Toplam KDV</span>
            <span>{Number(fatura.toplam_kdv).toLocaleString('tr-TR')} ₺</span>
          </div>
          <div className="flex justify-between text-xl font-black text-gray-900 pt-3 border-t-2 border-gray-800">
            <span>GENEL TOPLAM</span>
            <span>{Number(fatura.genel_toplam).toLocaleString('tr-TR')} ₺</span>
          </div>
          <div className="text-[10px] text-gray-400 italic text-right mt-2 font-medium">
            # Yalnızca {fatura.genel_toplam} Türk Lirasıdır #
          </div>
        </div>
      </div>

      {/* Footer: İmza ve Kaşe */}
      <div className="mt-32 grid grid-cols-2 gap-24 text-center">
        <div>
          <div className="border-t border-gray-300 pt-2 text-xs font-bold uppercase text-gray-400">Teslim Eden</div>
        </div>
        <div>
          <div className="border-t border-gray-300 pt-2 text-xs font-bold uppercase text-gray-400">Teslim Alan</div>
        </div>
      </div>
    </div>
  );
});

PrintableInvoice.displayName = 'PrintableInvoice';