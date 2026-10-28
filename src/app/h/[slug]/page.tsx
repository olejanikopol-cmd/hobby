import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HostActivities } from '@/components/HostActivities';
import { Footer } from '@/components/Footer';
import { HOSTS, getHost } from '@/data/hosts';

export function generateStaticParams() {
  return HOSTS.map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const h = getHost(slug);
  return { title: h ? h.name : 'Ведучий', description: h?.bio };
}

export default async function HostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const host = getHost(slug);
  if (!host) notFound();
  return (
    <>
      <main className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-8 sm:px-6">
        <section className="flex animate-rise flex-wrap items-end gap-x-10 gap-y-6 rounded-[32px] bg-brand p-8 text-white sm:p-12">
          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-2">
            <span className="font-wave text-lg font-bold text-amber">{host.district}</span>
            <h1 className="font-head text-4xl leading-tight font-extrabold sm:text-5xl">{host.name}</h1>
            <p className="text-lg font-semibold text-[#CFE6D8]">{host.role}</p>
            <p className="mt-2 max-w-[620px] text-lg leading-relaxed text-[#E9F3EC]">{host.bio}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/messages?to=${host.slug}`} className="btn h-12 bg-white px-6 text-brand-dark hover:bg-brand-soft">Написати</Link>
            {host.instagram && (
              <a href={`https://instagram.com/${host.instagram}`} target="_blank" rel="noopener noreferrer" className="btn h-12 border-[1.5px] border-white/50 px-5 text-white hover:bg-white/10">
                Instagram
              </a>
            )}
            {host.telegram && (
              <a href={`https://t.me/${host.telegram}`} target="_blank" rel="noopener noreferrer" className="btn h-12 border-[1.5px] border-white/50 px-5 text-white hover:bg-white/10">
                Telegram
              </a>
            )}
          </div>
        </section>
        <HostActivities hostSlug={host.slug} />
      </main>
      <Footer />
    </>
  );
}
