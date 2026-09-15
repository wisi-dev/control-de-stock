import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCustomerSchema, type Customer, type CreateCustomerInput } from '@control-stock/shared';
import { Modal } from '../../components/ui/Modal.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { createCustomer, updateCustomer } from '../../services/customers.service.js';
import { toast } from '../../store/toastStore.js';

interface CustomerFormModalProps {
  open: boolean;
  /** `null` = crear cliente nuevo. */
  customer: Customer | null;
  onClose: () => void;
}

export function CustomerFormModal({ open, customer, onClose }: CustomerFormModalProps) {
  const isEdit = customer !== null;
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState } = useForm<CreateCustomerInput>({
    resolver: zodResolver(createCustomerSchema),
  });

  useEffect(() => {
    if (!open) return;
    reset({
      firstName: customer?.firstName ?? '',
      lastName: customer?.lastName ?? '',
      docNumber: customer?.docNumber ?? '',
      phone: customer?.phone ?? '',
      email: customer?.email ?? '',
      address: customer?.address ?? '',
      notes: customer?.notes ?? '',
    });
  }, [open, customer, reset]);

  const mutation = useMutation({
    mutationFn: (input: CreateCustomerInput) =>
      isEdit ? updateCustomer(customer.id, input) : createCustomer(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(isEdit ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente');
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar cliente' : 'Nuevo cliente'}>
      <form className="space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Nombre" error={formState.errors.firstName?.message} {...register('firstName')} />
          <Input label="Apellido" error={formState.errors.lastName?.message} {...register('lastName')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="DNI/CUIT" {...register('docNumber')} />
          <Input label="Teléfono" {...register('phone')} />
        </div>
        <Input label="Email" type="email" {...register('email')} />
        <Input label="Dirección" {...register('address')} />
        <Input label="Notas" {...register('notes')} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {isEdit ? 'Guardar cambios' : 'Crear cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
