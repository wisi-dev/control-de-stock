import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { updateBusinessConfigSchema, type UpdateBusinessConfigInput } from '@control-stock/shared';
import { Card, CardContent, CardHeader } from '../components/ui/Card.js';
import { Input } from '../components/ui/Input.js';
import { Button } from '../components/ui/Button.js';
import { fetchSettings, updateSettings } from '../services/settings.service.js';
import { toast } from '../store/toastStore.js';
import { usePermission } from '../hooks/usePermission.js';

export function ConfiguracionPage() {
  const queryClient = useQueryClient();
  const canManageSettings = usePermission('settings:*');
  const settingsQuery = useQuery({ queryKey: ['settings'], queryFn: fetchSettings, enabled: canManageSettings });

  const { register, handleSubmit, reset, formState } = useForm<UpdateBusinessConfigInput>({
    resolver: zodResolver(updateBusinessConfigSchema),
  });

  useEffect(() => {
    if (settingsQuery.data) {
      reset({
        businessName: settingsQuery.data.businessName,
        currency: settingsQuery.data.currency,
        allowNegativeStock: settingsQuery.data.allowNegativeStock,
        defaultTaxRate: settingsQuery.data.defaultTaxRate,
        address: settingsQuery.data.address ?? '',
        phone: settingsQuery.data.phone ?? '',
      });
    }
  }, [settingsQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(['settings'], data);
      toast.success('Configuración guardada correctamente');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!canManageSettings) return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Configuración del negocio</h1>
        <p className="text-sm text-ink-muted">Datos generales y reglas que usa el sistema.</p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <p className="text-sm font-medium text-ink">Datos generales</p>
        </CardHeader>
        <CardContent>
          {settingsQuery.isLoading ? (
            <p className="text-sm text-ink-muted">Cargando...</p>
          ) : (
            <form
              className="space-y-4"
              onSubmit={handleSubmit((values) => mutation.mutate(values))}
            >
              <Input
                label="Nombre del negocio"
                error={formState.errors.businessName?.message}
                {...register('businessName')}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Moneda" error={formState.errors.currency?.message} {...register('currency')} />
                <Input
                  label="Impuesto por defecto (%)"
                  type="number"
                  step="0.01"
                  error={formState.errors.defaultTaxRate?.message}
                  {...register('defaultTaxRate', { valueAsNumber: true })}
                />
              </div>
              <Input label="Dirección" {...register('address')} />
              <Input label="Teléfono" {...register('phone')} />

              <label className="flex items-center gap-2 text-sm text-ink-muted">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  {...register('allowNegativeStock')}
                />
                Permitir vender productos sin stock disponible
              </label>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={mutation.isPending}>
                  Guardar cambios
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
