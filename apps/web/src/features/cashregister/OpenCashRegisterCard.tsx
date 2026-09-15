import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { openCashRegisterSchema, type OpenCashRegisterInput } from '@control-stock/shared';
import { Card, CardContent, CardHeader } from '../../components/ui/Card.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { openCashRegister } from '../../services/cashregister.service.js';
import { toast } from '../../store/toastStore.js';

export function OpenCashRegisterCard() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState } = useForm<OpenCashRegisterInput>({
    resolver: zodResolver(openCashRegisterSchema),
    defaultValues: { openingAmount: 0, notes: '' },
  });

  const mutation = useMutation({
    mutationFn: openCashRegister,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashregister'] });
      toast.success('Caja abierta correctamente');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Card className="max-w-md">
      <CardHeader>
        <p className="text-sm font-medium text-ink">Abrir caja</p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
          <Input
            label="Monto inicial en efectivo"
            type="number"
            step="0.01"
            error={formState.errors.openingAmount?.message}
            {...register('openingAmount', { valueAsNumber: true })}
          />
          <Input label="Notas (opcional)" {...register('notes')} />
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            Abrir caja
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
