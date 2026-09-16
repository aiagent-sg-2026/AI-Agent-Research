export function customerUrl(base, filter, page = 1) {
  return `${base}?page=${page}&filter=${filter}`;
}
