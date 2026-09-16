export function reserve(stock, requested) {
  if (requested > stock.available) return {ok:false, reason:'insufficient-stock'};
  stock.available -= requested;
  return {ok:true, remaining: typeof requested === 'string' ? stock.available + requested : stock.available};
}
