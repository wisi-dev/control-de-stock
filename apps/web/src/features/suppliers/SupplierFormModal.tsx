import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSupplierSchema, type CreateSupplierInput, type Supplier } from '@control-stock/shared';
import { Modal } from '../../components/ui/Modal.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { createSupplier, updateSupplier } from '../../services/suppliers.service.js';
import { toast } from '../../store/toastStore.js';

interface SupplierFormModalProps {
  open: boolean;
  /** `null` = crear proveedor nuevo. */
  supplier: Supplier | null;
  onClose: () => void;
}

export function SupplierFormModal({ open, supplier, onClose }: SupplierFormModalProps) {
  const isEdit = supplier !== null;
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState } = useForm<CreateSupplierInput>({
    resolver: zodResolver(createSupplierSchema),
  });

  useEffect(() => {
    if (!open) return;
    reset({
      businessName: supplier?.businessName ?? '',
      cuit: supplier?.cuit ?? '',
      phone: supplier?.phone ?? '',
      email: supplier?.email ?? '',
      address: supplier?.address ?? '',
      contactName: supplier?.contactName ?? '',
      notes: supplier?.notes ?? '',
    });
  }, [open, supplier, reset]);

  const mutation = useMutation({
    mutationFn: (input: CreateSupplierInput) =>
      isEdit ? updateSupplier(supplier.id, input) : createSupplier(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success(isEdit ? 'Proveedor actualizado correctamente' : 'Proveedor creado correctamente');
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar proveedor' : 'Nuevo proveedor'}>
      <form className="space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <Input
          label="Razón social"
          error={formState.errors.businessName?.message}
          {...register('businessName')}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="CUIT" {...register('cuit')} />
          <Input label="Teléfono" {...register('phone')} />
        </div>
        <Input label="Email" type="email" {...register('email')} />
        <Input label="Dirección" {...register('address')} />
        <Input label="Contacto" {...register('contactName')} />
        <Input label="Notas" {...register('notes')} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {isEdit ? 'Guardar cambios' : 'Crear proveedor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
