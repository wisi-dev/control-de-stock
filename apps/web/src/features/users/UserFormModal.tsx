import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { createUserSchema, type CreateUserInput, type UserWithRole } from '@control-stock/shared';
import { Modal } from '../../components/ui/Modal.js';
import { Input } from '../../components/ui/Input.js';
import { Select } from '../../components/ui/Select.js';
import { Button } from '../../components/ui/Button.js';
import { fetchRoles } from '../../services/roles.service.js';
import { createUser, updateUser } from '../../services/users.service.js';
import { toast } from '../../store/toastStore.js';

const editSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  email: z.string().email('Email inválido'),
  roleId: z.string().min(1, 'Seleccioná un rol'),
});
type EditInput = z.infer<typeof editSchema>;

interface UserFormModalProps {
  open: boolean;
  /** `null` = crear usuario nuevo. */
  user: UserWithRole | null;
  onClose: () => void;
}

export function UserFormModal({ open, user, onClose }: UserFormModalProps) {
  const isEdit = user !== null;
  const queryClient = useQueryClient();
  const rolesQuery = useQuery({ queryKey: ['roles'], queryFn: fetchRoles, enabled: open });
  const roleOptions = (rolesQuery.data ?? []).map((r) => ({ value: r.id, label: r.name }));

  const createForm = useForm<CreateUserInput>({ resolver: zodResolver(createUserSchema) });
  const editForm = useForm<EditInput>({ resolver: zodResolver(editSchema) });

  useEffect(() => {
    if (open && isEdit && user) {
      editForm.reset({ name: user.name, email: user.email, roleId: user.roleId });
    }
    if (open && !isEdit) {
      createForm.reset({ name: '', email: '', password: '', roleId: '' });
    }
  }, [open, isEdit, user]);

  function handleSuccess(message: string) {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    toast.success(message);
    onClose();
  }

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => handleSuccess('Usuario creado correctamente'),
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (input: EditInput) => updateUser(user!.id, input),
    onSuccess: () => handleSuccess('Usuario actualizado correctamente'),
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar usuario' : 'Nuevo usuario'}>
      {isEdit ? (
        <form
          className="space-y-4"
          onSubmit={editForm.handleSubmit((values) => updateMutation.mutate(values))}
        >
          <Input label="Nombre" error={editForm.formState.errors.name?.message} {...editForm.register('name')} />
          <Input
            label="Email"
            type="email"
            error={editForm.formState.errors.email?.message}
            {...editForm.register('email')}
          />
          <Select
            label="Rol"
            options={roleOptions}
            placeholder="Seleccioná un rol"
            error={editForm.formState.errors.roleId?.message}
            {...editForm.register('roleId')}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              Guardar cambios
            </Button>
          </div>
        </form>
      ) : (
        <form
          className="space-y-4"
          onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}
        >
          <Input
            label="Nombre"
            error={createForm.formState.errors.name?.message}
            {...createForm.register('name')}
          />
          <Input
            label="Email"
            type="email"
            error={createForm.formState.errors.email?.message}
            {...createForm.register('email')}
          />
          <Input
            label="Contraseña"
            type="password"
            error={createForm.formState.errors.password?.message}
            {...createForm.register('password')}
          />
          <Select
            label="Rol"
            options={roleOptions}
            placeholder="Seleccioná un rol"
            error={createForm.formState.errors.roleId?.message}
            {...createForm.register('roleId')}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              Crear usuario
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
