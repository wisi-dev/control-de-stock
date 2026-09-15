import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Minus, Plus, Search, ShoppingCart, Trash2 } from 'lucide-react';
import { PaymentMethod, type Product } from '@control-stock/shared';
import { Card, CardContent, CardHeader } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Select } from '../../components/ui/Select.js';
import { Input } from '../../components/ui/Input.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { fetchProducts } from '../../services/products.service.js';
import { fetchCustomers } from '../../services/customers.service.js';
import { createSale } from '../../services/sales.service.js';
import { toast } from '../../store/toastStore.js';

interface CartItem {
  productId: string;
  sku: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
}

const paymentOptions = [
  { value: PaymentMethod.EFECTIVO, label: 'Efectivo' },
  { value: PaymentMethod.TRANSFERENCIA, label: 'Transferencia' },
  { value: PaymentMethod.TARJETA, label: 'Tarjeta' },
  { value: PaymentMethod.OTRO, label: 'Otro' },
];

export function SalesCart() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.EFECTIVO);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const searchQuery = useQuery({
    queryKey: ['products', 'sales-search', search],
    queryFn: () => fetchProducts({ search, pageSize: 8, status: 'ACTIVO' }),
    enabled: search.length > 0,
  });
  const customersQuery = useQuery({ queryKey: ['customers'], queryFn: fetchCustomers });

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        { productId: product.id, sku: product.sku, name: product.name, unit: product.unit, unitPrice: product.salePrice, quantity: 1 },
      ];
    });
    setSearchInput('');
    setSearch('');
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity < 1) return;
    setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
  }

  function removeItem(productId: string) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  const subtotal = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const total = Math.max(0, subtotal - discount + tax);

  const mutation = useMutation({
    mutationFn: () =>
      createSale({
        customerId: customerId || undefined,
        paymentMethod,
        discount,
        tax,
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Venta registrada correctamente');
      setCart([]);
      setCustomerId('');
      setDiscount(0);
      setTax(0);
      setPaymentMethod(PaymentMethod.EFECTIVO);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        <div className="relative">
          <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
            <Search className="h-4 w-4 text-ink-subtle" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar producto por nombre, SKU o código de barras..."
              className="w-full outline-none"
            />
          </div>
          {search.length > 0 && (
            <Card className="absolute z-10 mt-1 w-full max-h-72 overflow-y-auto">
              {searchQuery.isLoading ? (
                <p className="p-3 text-sm text-ink-muted">Buscando...</p>
              ) : (searchQuery.data?.items.length ?? 0) === 0 ? (
                <p className="p-3 text-sm text-ink-muted">Sin resultados.</p>
              ) : (
                searchQuery.data!.items.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addToCart(product)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    <span>
                      <span className="font-medium text-ink">{product.name}</span>{' '}
                      <span className="text-ink-subtle">({product.sku})</span>
                    </span>
                    <span className="text-ink-muted">
                      ${product.salePrice.toFixed(2)} — stock {product.currentStock}
                    </span>
                  </button>
                ))
              )}
            </Card>
          )}
        </div>

        <Card>
          {cart.length === 0 ? (
            <CardContent>
              <EmptyState icon={ShoppingCart} title="El carrito está vacío" description="Buscá un producto para agregarlo." />
            </CardContent>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-ink-subtle">
                  <th className="px-5 py-3 font-medium">Producto</th>
                  <th className="px-5 py-3 font-medium">Cantidad</th>
                  <th className="px-5 py-3 font-medium">Precio</th>
                  <th className="px-5 py-3 font-medium text-right">Subtotal</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cart.map((item) => (
                  <tr key={item.productId}>
                    <td className="px-5 py-3 font-medium text-ink">
                      {item.name} <span className="text-ink-subtle">({item.sku})</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="rounded p-1 text-ink-muted hover:bg-slate-100"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="rounded p-1 text-ink-muted hover:bg-slate-100"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-muted">${item.unitPrice.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right text-ink-muted">
                      ${(item.unitPrice * item.quantity).toFixed(2)}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        aria-label="Quitar del carrito"
                        className="rounded-lg p-2 text-ink-muted hover:bg-slate-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <p className="text-sm font-medium text-ink">Resumen</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            label="Cliente (opcional)"
            placeholder="Sin cliente"
            options={(customersQuery.data ?? []).map((c) => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }))}
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          />
          <Select
            label="Método de pago"
            options={paymentOptions}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Descuento"
              type="number"
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
            />
            <Input label="Impuestos" type="number" step="0.01" value={tax} onChange={(e) => setTax(Number(e.target.value) || 0)} />
          </div>

          <div className="space-y-1 border-t border-slate-100 pt-3 text-sm">
            <div className="flex justify-between text-ink-muted">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold text-ink">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <Button
            className="w-full"
            disabled={cart.length === 0 || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Confirmar venta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
