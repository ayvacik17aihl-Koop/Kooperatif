export const PosReceipt = ({ fatura, cart, cari }: any) => (
  <div className="w-[80mm] p-2 bg-white text-black font-mono text-xs">
    <div className="text-center border-b pb-2 mb-2">
      <h2 className="font-bold text-lg">KOOPERATİF MARKET</h2>
      <p>Hızlı Satış Fişi</p>
      <p>{new Date().toLocaleString('tr-TR')}</p>
    </div>
    
    <div className="border-b pb-2 mb-2">
      <p>Müşteri: {cari?.tam_ad || 'Perakende'}</p>
      <p>Fiş No: {fatura?.id?.slice(0,8)}</p>
    </div>

    <table className="w-full mb-2">
      <thead>
        <tr className="border-b">
          <th className="text-left">Ürün</th>
          <th className="text-center">Ad</th>
          <th className="text-right">Tutar</th>
        </tr>
      </thead>
      <tbody>
        {cart.map((item: any, i: number) => (
          <tr key={i}>
            <td className="py-1">{item.urun_adi.slice(0, 15)}</td>
            <td className="text-center">{item.miktar}</td>
            <td className="text-right">{(item.miktar * item.satis_fiyati).toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <div className="text-right border-t pt-2 space-y-1">
      <p>Ara Toplam: {fatura.ara_toplam}₺</p>
      <p className="font-bold text-lg">TOPLAM: {fatura.genel_toplam}₺</p>
    </div>

    <div className="text-center mt-4 text-[10px]">
      <p>Bizi Tercih Ettiğiniz İçin Teşekkürler!</p>
      <p>Yine Bekleriz</p>
    </div>
  </div>
  
);
<style jsx global>{`
  @media print {
    /* POS ekranındaki her şeyi gizle */
    body * { visibility: hidden; }
    /* Sadece fiş bileşenini ve içeriğini göster */
    .print-area, .print-area * { visibility: visible; }
    .print-area { 
      position: absolute; 
      left: 0; 
      top: 0; 
      width: 80mm; /* Termal kağıt genişliği */
    }
    nav, aside, button { display: none !important; }
  }
`}</style>