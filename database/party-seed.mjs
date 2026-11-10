/** Offers an admin saved stay on the imported party. The rest of the row can refresh. */
export function offersForCatalogSeed(offersManaged, storedOffers, incomingOffers) {
  if (offersManaged) {
    return storedOffers === undefined ? null : storedOffers;
  }
  return incomingOffers === undefined ? null : incomingOffers;
}
