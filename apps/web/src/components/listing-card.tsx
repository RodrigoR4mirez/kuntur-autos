import Link from 'next/link';
import { formatMoney, type ListingCardData } from '../lib/listings.ts';
import { photoSrcSet } from '../lib/photo.ts';
import { CarArt } from './car-art.tsx';
import { IconArrow } from './icons.tsx';

export interface CardPhoto {
  readonly src: string;
  readonly alt: string;
}

export function ListingCard({
  item,
  photo,
  href,
  eager = false,
}: {
  item: ListingCardData;
  photo?: CardPhoto;
  href?: string;
  /** `true` para las tarjetas que se ven sin desplazarse: la foto carga de inmediato. */
  eager?: boolean;
}) {
  return (
    <Link className="car-card" href={href ?? `/anuncios/${encodeURIComponent(item.id)}`}>
      <div className={`car-card-photo${photo ? ' car-card-photo-img' : ''}`}>
        <span className="chip">{item.year}</span>
        {photo ? (
          <img
            src={photo.src}
            srcSet={photoSrcSet(photo.src)}
            sizes="(min-width: 80rem) 310px, (min-width: 40rem) 33vw, 100vw"
            alt={photo.alt}
            width={1400}
            height={934}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
          />
        ) : (
          <>
            <CarArt />
            <small>Fotos próximamente</small>
          </>
        )}
      </div>
      <div className="car-card-body">
        <h3>{item.title}</h3>
        <p className="car-card-meta">
          {item.mileageKm.toLocaleString('en-US')} km · {item.city}, {item.department}
        </p>
        <div className="car-card-foot">
          <strong className="mono price-mono">{formatMoney(item.price)}</strong>
          <span className="circle-arrow">
            <IconArrow />
          </span>
        </div>
      </div>
    </Link>
  );
}
