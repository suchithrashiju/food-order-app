import type { MenuItem } from '@/types/menu'

interface MenuCardProps {
  item: MenuItem
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

export function MenuCard({ item }: MenuCardProps) {
  const unavailable = !item.isAvailable

  return (
    <article
      className={`menu-card${unavailable ? ' menu-card--unavailable' : ''}`}
      aria-disabled={unavailable}
    >
      <div className="menu-card__media">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} loading="lazy" />
        ) : (
          <div className="menu-card__placeholder" aria-hidden="true">
            <span>{item.name.slice(0, 1)}</span>
          </div>
        )}
        <span className="menu-card__category">{item.category}</span>
      </div>

      <div className="menu-card__body">
        <div className="menu-card__title-row">
          <h3>{item.name}</h3>
          <p className="menu-card__price">{formatPrice(item.price)}</p>
        </div>
        <p className="menu-card__description">{item.description}</p>
        {unavailable && <p className="menu-card__status">Currently unavailable</p>}
      </div>
    </article>
  )
}
