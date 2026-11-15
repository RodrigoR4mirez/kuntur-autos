import { formatMoney, type ListingCardData } from '../lib/listings.ts';
import { CarArt } from './car-art.tsx';
import { IconArrow } from './icons.tsx';

export function ListingCard({ item }: { item: ListingCardData }) {
  return (
    <a className="car-card" href={`/anuncios/${encodeURIComponent(item.id)}`}>
      <div className="car-card-photo">
        <span className="chip">{item.year}</span>
        <CarArt />
        <small>Fotos próximamente</small>
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
    </a>
  );
}
