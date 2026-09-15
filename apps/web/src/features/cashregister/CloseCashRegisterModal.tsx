import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { closeCashRegisterSchema, type CloseCashRegisterInput } from '@control-stock/shared';
import { Modal } from '../../components/ui/Modal.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { closeCashRegister, type CashRegister } from '../../services/cashregister.service.js';
import { toast } from '../../store/toastStore.js';

interface CloseCashRegisterModalProps {
  open: boolean;
  register: CashRegister;
  expectedAmount: number;
  onClose: () => void;
}

export function CloseCashRegisterModal({ open, register: cashRegister, expectedAmount, onClose }: CloseCashRegisterModalProps) {
  const queryClient = useQueryClient();
  const form = useForm<CloseCashRegisterInput>({
    resolver: zodResolver(closeCashRegisterSchema),
    defaultValues: { closingAmount: 0, notes: '' },
  });

  useEffect(() => {
    if (open) form.reset({ closingAmount: 0, notes: '' });
  }, [open, form]);

  const closingAmount = form.watch('closingAmount');
  const difference = (closingAmount || 0) - expectedAmount;

  const mutation = useMutation({
    mutationFn: (input: CloseCashRegisterInput) => closeCashRegister(cashRegister.id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashregister'] });
      toast.success('Caja cerrada correctamente');
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Modal open={open} onClose={onClose} title="Cerrar caja">
      <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <p className="text-sm text-ink-muted">
          Caja esperada según ingresos, egresos y ventas en efectivo: <strong>${expectedAmount.toFixed(2)}</strong>
        </p>
        <Input
          label="Efectivo contado"
          type="number"
          step="0.01"
          error={form.formState.errors.closingAmount?.message}
          {...form.register('closingAmount', { valueAsNumber: true })}
        />
        {closingAmount > 0 && (
          <p className={`text-sm font-medium ${difference === 0 ? 'text-success' : difference > 0 ? 'text-warning' : 'text-danger'}`}>
            Diferencia: ${difference.toFixed(2)} {difference === 0 ? '(cuadra)' : difference > 0 ? '(sobrante)' : '(faltante)'}
          </p>
        )}
        <Input label="Notas (opcional)" {...form.register('notes')} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="danger" disabled={mutation.isPending}>
            Cerrar caja
          </Button>
        </div>
      </form>
    </Modal>
  );
}
