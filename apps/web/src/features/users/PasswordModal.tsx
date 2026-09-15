import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { setUserPasswordSchema, type SetUserPasswordInput, type UserWithRole } from '@control-stock/shared';
import { Modal } from '../../components/ui/Modal.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { setUserPassword } from '../../services/users.service.js';
import { toast } from '../../store/toastStore.js';
import { useAuthStore } from '../../store/authStore.js';

interface PasswordModalProps {
  open: boolean;
  user: UserWithRole | null;
  onClose: () => void;
}

export function PasswordModal({ open, user, onClose }: PasswordModalProps) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isOwnPassword = user !== null && user.id === currentUserId;

  const { register, handleSubmit, reset, formState } = useForm<SetUserPasswordInput>({
    resolver: zodResolver(setUserPasswordSchema),
  });

  useEffect(() => {
    if (open) reset({ currentPassword: '', newPassword: '' });
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (input: SetUserPasswordInput) => setUserPassword(user!.id, input),
    onSuccess: () => {
      toast.success('Contraseña actualizada correctamente');
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Modal open={open} onClose={onClose} title={`Cambiar contraseña${user ? ` — ${user.name}` : ''}`}>
      <form className="space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        {isOwnPassword && (
          <Input
            label="Contraseña actual"
            type="password"
            error={formState.errors.currentPassword?.message}
            {...register('currentPassword')}
          />
        )}
        <Input
          label="Contraseña nueva"
          type="password"
          error={formState.errors.newPassword?.message}
          {...register('newPassword')}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
