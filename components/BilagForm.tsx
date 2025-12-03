'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const bilagSchema = z.object({
  date: z.string().min(1, 'Kjøpsdato er påkrevd'),
  price: z.coerce.number().positive('Pris må være et positivt tall'),
  sellerName: z.string().min(1, 'Selgernavn er påkrevd'),
  buyerName: z.string().min(1, 'Kjøpernavn er påkrevd'),
  paymentMethod: z.string().min(1, 'Betalingsmåte er påkrevd'),
  location: z.string().optional(),
  notes: z.string().optional(),
  sourceUrl: z.string().optional(),
  title: z.string().optional(),
});

export type BilagFormData = z.infer<typeof bilagSchema>;

interface BilagFormProps {
  initialData?: Partial<BilagFormData>;
  onSubmit: (data: BilagFormData) => void;
  onPreview: (data: BilagFormData) => void;
  isLoading?: boolean;
}

export default function BilagForm({
  initialData,
  onSubmit,
  onPreview,
  isLoading,
}: BilagFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<BilagFormData>({
    resolver: zodResolver(bilagSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      ...initialData,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        date: initialData.date || new Date().toISOString().split('T')[0],
        ...initialData,
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data: BilagFormData) => {
    onSubmit(data);
  };

  const handlePreview = () => {
    handleSubmit((data) => {
      onPreview(data);
    })();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Vare/Tjeneste (valgfritt)
          </label>
          <input
            type="text"
            id="title"
            {...register('title')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="F.eks. Brukt bil, Møbler..."
          />
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Kjøpsdato *
          </label>
          <input
            type="date"
            id="date"
            {...register('date')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Pris (NOK) *
          </label>
          <input
            type="number"
            id="price"
            step="0.01"
            {...register('price')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="sellerName" className="block text-sm font-medium text-gray-700 mb-1">
            Selger *
          </label>
          <input
            type="text"
            id="sellerName"
            {...register('sellerName')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Navn på selger"
          />
          {errors.sellerName && (
            <p className="mt-1 text-sm text-red-600">{errors.sellerName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="buyerName" className="block text-sm font-medium text-gray-700 mb-1">
            Kjøper *
          </label>
          <input
            type="text"
            id="buyerName"
            {...register('buyerName')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ditt navn"
          />
          {errors.buyerName && (
            <p className="mt-1 text-sm text-red-600">{errors.buyerName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
            Betalingsmåte *
          </label>
          <select
            id="paymentMethod"
            {...register('paymentMethod')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Velg betalingsmåte</option>
            <option value="Kontant">Kontant</option>
            <option value="Vipps">Vipps</option>
            <option value="Bankoverføring">Bankoverføring</option>
            <option value="Kort">Kort</option>
            <option value="Annet">Annet</option>
          </select>
          {errors.paymentMethod && (
            <p className="mt-1 text-sm text-red-600">{errors.paymentMethod.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Sted (valgfritt)
          </label>
          <input
            type="text"
            id="location"
            {...register('location')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="F.eks. Oslo, Bergen..."
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="sourceUrl" className="block text-sm font-medium text-gray-700 mb-1">
            Annonselenke (valgfritt)
          </label>
          <input
            type="url"
            id="sourceUrl"
            {...register('sourceUrl')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://www.finn.no/..."
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Kommentarer (valgfritt)
          </label>
          <textarea
            id="notes"
            rows={4}
            {...register('notes')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ekstra informasjon om transaksjonen..."
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="button"
          onClick={handlePreview}
          disabled={isLoading}
          className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Forhåndsvis PDF
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? 'Genererer...' : 'Generer og last ned PDF'}
        </button>
      </div>
    </form>
  );
}

