import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCashMovementSchema, type CreateCashMovementInput } from '@control-stock/shared';
import { Modal } from '../../components/ui/Modal.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { addCashMovement } from '../../services/cashregister.service.js';
import { toast } from '../../store/toastStore.js';

interface CashMovementModalProps {
  open: boolean;
  registerId: string;
  type: 'INGRESO' | 'EGRESO';
  onClose: () => void;
}

export function CashMovementModal({ open, registerId, type, onClose }: CashMovementModalProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState } = useForm<CreateCashMovementInput>({
    resolver: zodResolver(createCashMovementSchema),
    defaultValues: { type, amount: 0, description: '' },
  });

  useEffect(() => {
    if (open) reset({ type, amount: 0, description: '' });
  }, [open, type, reset]);

  const mutation = useMutation({
    mutationFn: (input: CreateCashMovementInput) => addCashMovement(registerId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashregister'] });
      toast.success(type === 'INGRESO' ? 'Ingreso registrado' : 'Egreso registrado');
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Modal open={open} onClose={onClose} title={type === 'INGRESO' ? 'Registrar ingreso' : 'Registrar egreso'}>
      <form className="space-y-4" onSubmit={handleSubmit((values) => mutation.mutate({ ...values, type }))}>
        <Input
          label="Monto"
          type="number"
          step="0.01"
          error={formState.errors.amount?.message}
          {...register('amount', { valueAsNumber: true })}
        />
        <Input label="Descripción" {...register('description')} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            Registrar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
