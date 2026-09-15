import { Modal } from '../../components/ui/Modal.js';
import type { Purchase } from '../../services/purchases.service.js';

interface PurchaseDetailModalProps {
  purchase: Purchase | null;
  onClose: () => void;
}

export function PurchaseDetailModal({ purchase, onClose }: PurchaseDetailModalProps) {
  return (
    <Modal open={purchase !== null} onClose={onClose} title="Detalle de la compra">
      {purchase && (
        <div className="space-y-4">
          <div className="text-sm">
            <p className="font-medium text-ink">{purchase.supplier?.businessName}</p>
            <p className="text-ink-muted">
              {new Date(purchase.createdAt).toLocaleString('es-AR')} — {purchase.user?.name}
            </p>
          </div>

          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-ink-subtle">
                <th className="py-2 font-medium">Producto</th>
                <th className="py-2 font-medium">Cant.</th>
                <th className="py-2 font-medium">Precio</th>
                <th className="py-2 font-medium text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchase.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 text-ink">{item.product?.name ?? '—'}</td>
                  <td className="py-2 text-ink-muted">{item.quantity}</td>
                  <td className="py-2 text-ink-muted">${item.unitPrice.toFixed(2)}</td>
                  <td className="py-2 text-right text-ink-muted">${item.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-1 border-t border-slate-100 pt-3 text-sm">
            <div className="flex justify-between text-ink-muted">
              <span>Subtotal</span>
              <span>${purchase.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>Descuento</span>
              <span>-${purchase.discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>Impuestos</span>
              <span>${purchase.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-ink">
              <span>Total</span>
              <span>${purchase.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
