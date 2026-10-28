import type { Metadata } from 'next';
import { CatalogView } from '@/components/CatalogView';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = { title: 'Усі категорії хобі' };

export default function CategoriesPage() {
  return (
    <>
      <CatalogView />
      <Footer />
    </>
  );
}
